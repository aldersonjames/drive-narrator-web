import crypto from 'node:crypto';

export interface PoiQuery {
  routeId: string;
  interestTags: string[];
  bbox?: number[]; // [minLng, minLat, maxLng, maxLat]
  limit?: number;
}

export interface PoiResult {
  poiId: string;
  name: string;
  category: string;
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
  private readonly provider: 'ops' | 'foursquare';
  private readonly opsBaseUrl: string;
  private readonly opsApiKey: string | undefined;
  private readonly foursquareBaseUrl: string;
  private readonly foursquareApiKey: string | undefined;
  private readonly ttlMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly cache = new Map<string, CacheEntry<PoiResult[]>>();

  constructor(options: PoiProviderOptions = {}) {
    this.provider = options.provider ?? (process.env.POI_PROVIDER as 'ops' | 'foursquare') ?? 'ops';
    this.opsBaseUrl = options.opsBaseUrl ?? 'https://api.openpoiservice.org';
    this.opsApiKey = options.opsApiKey ?? process.env.POI_API_KEY;
    this.foursquareBaseUrl = options.foursquareBaseUrl ?? 'https://api.foursquare.com/v3';
    this.foursquareApiKey = options.foursquareApiKey ?? process.env.FOURSQUARE_API_KEY;
    this.ttlMs = options.ttlMs ?? Number(process.env.POI_CACHE_TTL_MS ?? 900_000);
    this.fetchImpl = options.fetchImpl ?? fetch;

    if (this.provider === 'foursquare' && !this.foursquareApiKey) {
      throw new Error('POI provider foursquare selected but FOURSQUARE_API_KEY missing');
    }
  }

  async fetchPois(query: PoiQuery): Promise<PoiResult[]> {
    const cacheKey = this.buildCacheKey(query);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const pois =
      this.provider === 'ops'
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
    const body = {
      request: 'pois',
      geometry: {
        bbox: query.bbox ?? null,
      },
      filters: {
        categories: query.interestTags,
      },
      limit: query.limit ?? 50,
    };

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

    interface OpsFeature {
      properties: {
        id?: string | number;
        name?: string;
        category?: string;
        categories?: string[];
        relevance?: number;
        description?: string;
        datasource?: { raw?: { website?: string } };
      };
      geometry: {
        coordinates?: [number, number];
      };
    }

    const json = (await response.json()) as { features: OpsFeature[] };

    return json.features.map((feature) => {
      const { properties, geometry } = feature;
      return {
        poiId: properties.id?.toString() ?? crypto.randomUUID(),
        name: properties.name ?? 'Unknown point of interest',
        category: properties.category ?? properties.categories?.[0] ?? 'unknown',
        relevance: properties.relevance ?? 1,
        coordinates: {
          lat: geometry.coordinates?.[1] ?? 0,
          lng: geometry.coordinates?.[0] ?? 0,
        },
        summary: properties.description ?? properties.name ?? 'Point of interest',
        attribution: { provider: 'openpoiservice', sourceUrl: properties.datasource?.raw?.website },
        raw: feature,
      } satisfies PoiResult;
    });
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
      const category = result.categories?.[0]?.name ?? 'unknown';
      const geo = result.geocodes?.main ?? result.location;
      return {
        poiId,
        name: result.name ?? 'Unknown POI',
        category,
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

  private buildCacheKey(query: PoiQuery): string {
    const hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(query));
    return hash.digest('hex');
  }
}
