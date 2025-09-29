import crypto from 'node:crypto';

import { resolveInterestTokens, resolveOpsCategoryIds } from './interestTaxonomy';

export interface PoiQuery {
  routeId: string;
  interestTags: string[];
  bbox?: number[]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
}

export interface PoiResult {
  poiId: string;
  name: string;
  /** Primary category token such as `historic.battlefield`. */
  category: string;
  /** Additional category tokens derived from provider metadata (e.g., `historic`, `battlefield`). */
  categories: string[];
  relevance: number;
  coordinates: { lat: number; lng: number };
  summary: string;
  attribution: { provider: string; sourceUrl?: string };
  raw: unknown;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface PoiProviderOptions {
  provider?: 'ops' | 'foursquare';
  opsBaseUrl?: string;
  opsApiKey?: string;
  foursquareBaseUrl?: string;
  foursquareApiKey?: string;
  ttlMs?: number;
  fetchImpl?: typeof fetch;
}

export class PoiProviderClient {
  private provider: 'ops' | 'foursquare';
  private readonly opsBaseUrl: string;
  private readonly opsApiKey: string | undefined;
  private readonly foursquareBaseUrl: string;
  private readonly foursquareApiKey: string | undefined;
  private readonly ttlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, CacheEntry<PoiResult[]>>();
  private readonly useMock: boolean;

  constructor(options: PoiProviderOptions = {}) {
    this.provider = options.provider ?? (process.env.POI_PROVIDER as 'ops' | 'foursquare') ?? 'ops';
    this.opsBaseUrl = options.opsBaseUrl ?? 'https://api.openpoiservice.org';
    this.opsApiKey = options.opsApiKey ?? process.env.POI_API_KEY;
    this.foursquareBaseUrl = options.foursquareBaseUrl ?? 'https://api.foursquare.com/v3';
    this.foursquareApiKey = options.foursquareApiKey ?? process.env.FOURSQUARE_API_KEY;
    this.ttlMs = options.ttlMs ?? Number(process.env.POI_CACHE_TTL_MS ?? 900_000);
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.useMock = !this.opsApiKey && !this.foursquareApiKey;

    if (this.provider === 'foursquare' && !this.foursquareApiKey) {
      // Foursquare was requested but no credential is available yet; fall back to OPS until a key is provided.
      this.provider = 'ops';
    }
  }

  async fetchPois(query: PoiQuery): Promise<PoiResult[]> {
    const cacheKey = this.buildCacheKey(query);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const pois = this.useMock
      ? this.buildMockPois(query)
      : this.provider === 'ops'
        ? await this.fetchFromOpenPoiService(query)
        : await this.fetchFromFoursquare(query);

    this.cache.set(cacheKey, { value: pois, expiresAt: now + this.ttlMs });
    return pois;
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async fetchFromOpenPoiService(query: PoiQuery): Promise<PoiResult[]> {
    if (!this.opsApiKey) {
      throw new Error('POI_API_KEY missing for openpoiservice');
    }

    const url = new URL(`${this.opsBaseUrl}/v1/pois`);

    const categoryTokens = resolveInterestTokens(query.interestTags);
    const opsCategoryIds = resolveOpsCategoryIds(query.interestTags);

    const filters: Record<string, unknown> = {};
    if (categoryTokens.length) {
      filters.categories = categoryTokens;
    }
    if (opsCategoryIds.length) {
      filters.category_ids = opsCategoryIds;
    }

    const body: Record<string, unknown> = {
      request: 'pois',
      geometry: {
        bbox: query.bbox ?? null,
      },
      limit: query.limit ?? 50,
    };

    if (Object.keys(filters).length) {
      body.filters = filters;
    }

    const response = await this.fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.opsApiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`openpoiservice error ${response.status}: ${errorText}`);
    }

    interface OpsCategoryEntry {
      category_name?: string;
      category_group?: string;
    }

    interface OpsFeature {
      properties: {
        id?: string | number;
        name?: string;
        category?: string;
        categories?: string[];
        category_ids?: Record<string, OpsCategoryEntry>;
        relevance?: number;
        description?: string;
        datasource?: { raw?: { website?: string } };
      };
      geometry: {
        coordinates?: [number, number];
      };
    }

    const json = (await response.json()) as { features: OpsFeature[] };

    return json.features.map((feature) => this.transformOpsFeature(feature));
  }

  private async fetchFromFoursquare(query: PoiQuery): Promise<PoiResult[]> {
    const url = new URL(`${this.foursquareBaseUrl}/places/search`);
    url.searchParams.set('limit', String(query.limit ?? 50));
    url.searchParams.set('categories', query.interestTags.join(','));

    if (query.bbox) {
      const [minLng, minLat, maxLng, maxLat] = query.bbox;
      const lat = (minLat + maxLat) / 2;
      const lng = (minLng + maxLng) / 2;
      url.searchParams.set('ll', `${lat},${lng}`);
    }

    const response = await this.fetchImpl(url.toString(), {
      headers: {
        Authorization: this.foursquareApiKey as string,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Foursquare error ${response.status}: ${errorText}`);
    }

    interface FoursquareCategory {
      name?: string;
    }
    interface FoursquareGeocode {
      latitude?: number;
      longitude?: number;
    }
    interface FoursquareResult {
      fsq_id?: string;
      name?: string;
      categories?: FoursquareCategory[];
      rating?: number;
      link?: string;
      website?: string;
      description?: string;
      geocodes?: { main?: FoursquareGeocode };
      location?: { latitude?: number; longitude?: number };
    }

    const json = (await response.json()) as { results: FoursquareResult[] };

    return json.results.map((result) => {
      const poiId = result.fsq_id ?? crypto.randomUUID();
      const categoryName = result.categories?.[0]?.name ?? 'unknown';
      const canonicalCategories = (result.categories ?? [])
        .map((entry) => entry.name?.toLowerCase())
        .filter((entry): entry is string => Boolean(entry));
      const geo = result.geocodes?.main ?? result.location;
      return {
        poiId,
        name: result.name ?? 'Unknown POI',
        category: categoryName.toLowerCase(),
        categories: canonicalCategories.length ? canonicalCategories : [categoryName.toLowerCase()],
        relevance: result.rating ? result.rating / 10 : 0.5,
        coordinates: {
          lat: geo?.latitude ?? 0,
          lng: geo?.longitude ?? 0,
        },
        summary: result.description ?? result.name ?? 'Point of interest',
        attribution: {
          provider: 'foursquare',
          sourceUrl: result.link ?? result.website,
        },
        raw: result,
      } satisfies PoiResult;
    });
  }

  private transformOpsFeature(feature: {
    properties: {
      id?: string | number;
      name?: string;
      category?: string;
      categories?: string[];
      category_ids?: Record<string, { category_name?: string; category_group?: string }>;
      relevance?: number;
      description?: string;
      datasource?: { raw?: { website?: string } };
    };
    geometry: { coordinates?: [number, number] };
  }): PoiResult {
    const { properties, geometry } = feature;

    const opsCategories = properties.category_ids
      ? Object.values(properties.category_ids)
          .map(({ category_group, category_name }) => {
            const group = category_group?.toLowerCase();
            const name = category_name?.toLowerCase();
            if (group && name) {
              return `${group}.${name}`;
            }
            return name ?? group ?? undefined;
          })
          .filter((entry): entry is string => Boolean(entry))
      : [];

    const primaryCategory = (properties.category ?? opsCategories[0] ?? 'unknown').toLowerCase();

    const categoryTokens = new Set<string>();
    if (primaryCategory && primaryCategory !== 'unknown') {
      categoryTokens.add(primaryCategory);
    }
    opsCategories.forEach((entry) => {
      categoryTokens.add(entry);
      entry.split(/[.:/_-]/).forEach((piece) => {
        const trimmed = piece.trim();
        if (trimmed) {
          categoryTokens.add(trimmed);
        }
      });
    });
    (properties.categories ?? []).forEach((legacy) => {
      const lower = legacy.toLowerCase();
      categoryTokens.add(lower);
      lower.split(/[.:/_-]/).forEach((piece) => {
        const trimmed = piece.trim();
        if (trimmed) {
          categoryTokens.add(trimmed);
        }
      });
    });

    return {
      poiId: properties.id?.toString() ?? crypto.randomUUID(),
      name: properties.name ?? 'Unknown point of interest',
      category: primaryCategory,
      categories: Array.from(categoryTokens),
      relevance: properties.relevance ?? 1,
      coordinates: {
        lat: geometry.coordinates?.[1] ?? 0,
        lng: geometry.coordinates?.[0] ?? 0,
      },
      summary: properties.description ?? properties.name ?? 'Point of interest',
      attribution: { provider: 'openpoiservice', sourceUrl: properties.datasource?.raw?.website },
      raw: feature,
    } satisfies PoiResult;
  }

  async fetchOpsCategoryCatalog(): Promise<Record<string, unknown>> {
    if (!this.opsApiKey || this.useMock) {
      return {
        historic: {
          id: 220,
          children: {
            historic: {
              battlefield: 228,
              memorial: 237,
            },
          },
        },
        scenic: {
          id: 330,
          children: {
            tourism: {
              viewpoint: 627,
              attraction: 622,
            },
          },
        },
      } satisfies Record<string, unknown>;
    }

    const url = new URL(`${this.opsBaseUrl}/v1/pois`);
    const response = await this.fetchImpl(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.opsApiKey,
      },
      body: JSON.stringify({ request: 'list' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`openpoiservice category list error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  isFoursquareEnabled(): boolean {
    return Boolean(this.foursquareApiKey);
  }

  private buildCacheKey(query: PoiQuery): string {
    const hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(query));
    return hash.digest('hex');
  }

  private buildMockPois(query: PoiQuery): PoiResult[] {
    const base = this.hashToNumber(query.routeId);
    return ['Civil War Fort', 'Mountain Overlook', 'Historic Museum'].map((name, index) => ({
      poiId: `${query.routeId}-poi-${index}`,
      name,
      category: (
        query.interestTags[index % query.interestTags.length] ?? 'historical'
      ).toLowerCase(),
      categories: [
        (query.interestTags[index % query.interestTags.length] ?? 'historical').toLowerCase(),
      ],
      relevance: 0.7 + index * 0.1,
      coordinates: {
        lat: base + index * 0.01,
        lng: base / 2 + index * 0.02,
      },
      summary: `${name} — narrated highlight along the route`,
      attribution: { provider: 'mock-data' },
      raw: {},
    }));
  }

  private hashToNumber(value: string): number {
    const hash = crypto.createHash('sha1').update(value).digest('hex');
    return parseInt(hash.slice(0, 6), 16) / 100000;
  }
}
