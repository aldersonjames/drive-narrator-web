import crypto from 'node:crypto';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: Coordinate | string;
  destination: Coordinate | string;
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular' | 'foot-walking';
  alternatives?: number;
  avoidanceCategories?: string[];
}

export interface RouteFeatureProperties {
  segments: Array<{
    distance: number;
    duration: number;
  }>;
  summary: {
    distance: number;
    duration: number;
  };
}

export interface RouteFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: RouteFeatureProperties;
}

export interface RouteResponse {
  type: string;
  features: RouteFeature[];
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export interface OpenRouteServiceClientOptions {
  apiKey?: string;
  baseUrl?: string;
  ttlMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

export class OpenRouteServiceClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly ttlMs: number;
  private readonly retries: number;
  private readonly cache = new Map<string, CacheEntry<RouteResponse>>();
  private readonly fetchImpl: typeof fetch;
  private readonly useMock: boolean;

  constructor(options: OpenRouteServiceClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.ORS_API_KEY ?? '';
    this.baseUrl = options.baseUrl ?? 'https://api.openrouteservice.org';
    this.ttlMs = options.ttlMs ?? Number(process.env.ORS_CACHE_TTL_MS ?? 900_000);
    this.retries = options.retries ?? 2;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.useMock = !this.apiKey;
  }

  async getRoutes(request: RouteRequest): Promise<RouteResponse> {
    if (this.useMock) {
      return this.buildMockResponse(request);
    }

    const originCoord = this.normalizeCoordinate(request.origin);
    const destinationCoord = this.normalizeCoordinate(request.destination);

    const normalized: RouteRequest = {
      ...request,
      origin: originCoord,
      destination: destinationCoord,
    };

    if (this.useMock) {
      return this.buildMockResponse(normalized);
    }

    const cacheKey = this.buildCacheKey(normalized);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const profile = normalized.profile ?? 'driving-car';
    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
    });

    const body = {
      coordinates: [
        [originCoord.lng, originCoord.lat],
        [destinationCoord.lng, destinationCoord.lat],
      ],
      format: 'json',
      elevation: false,
      extra_info: ['waytype'],
      options: {
        avoid_features: normalized.avoidanceCategories ?? [],
      },
      alternative_routes: {
        target_count: normalized.alternatives ?? 3,
        weight_factor: 1.2,
        share_factor: 0.6,
      },
    };

    const url = `${this.baseUrl}/v2/directions/${profile}/geojson?${searchParams.toString()}`;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.retries) {
      try {
        const response = await this.fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.apiKey,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouteService error ${response.status}: ${errorText}`);
        }

        const json = (await response.json()) as RouteResponse;
        this.cache.set(cacheKey, {
          value: json,
          expiresAt: now + this.ttlMs,
        });
        return json;
      } catch (error) {
        lastError = error;
        attempt += 1;
        if (attempt > this.retries) {
          break;
        }
        await this.backoff(attempt);
      }
    }

    throw lastError ?? new Error('Failed to fetch routes from OpenRouteService');
  }

  clearCache(): void {
    this.cache.clear();
  }

  private buildCacheKey(request: RouteRequest): string {
    const hash = crypto.createHash('sha1');
    hash.update(JSON.stringify(request));
    return hash.digest('hex');
  }

  private async backoff(attempt: number): Promise<void> {
    const baseDelay = 250;
    const jitter = Math.random() * 50;
    const delay = baseDelay * attempt + jitter;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private normalizeCoordinate(input: Coordinate | string | undefined): Coordinate {
    if (!input) {
      return { lat: 0, lng: 0 };
    }

    if (typeof input === 'string') {
      const hash = this.hashToNumber(input);
      return {
        lat: (hash % 90) - 45,
        lng: ((hash / 90) % 180) - 90,
      };
    }

    return input;
  }

  private buildMockResponse(request: RouteRequest): RouteResponse {
    const base = this.hashToNumber(JSON.stringify(request.origin ?? 'origin'));
    const generateCoords = (offset: number): number[][] => [
      [base + offset, base / 2 + offset],
      [base + offset + 0.5, base / 2 + offset + 0.25],
      [base + offset + 0.8, base / 2 + offset + 0.3],
    ];

    const features: RouteFeature[] = [0, 1, 2].map((index) => {
      const factor = 1 - index * 0.1;
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: generateCoords(index * 0.2),
        },
        properties: {
          segments: [
            {
              distance: 240000 * factor,
              duration: 3 * 3600 * factor,
            },
          ],
          summary: {
            distance: 240000 * factor,
            duration: 3 * 3600 * factor,
          },
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private hashToNumber(value: string): number {
    const hash = crypto.createHash('sha1').update(value).digest('hex');
    return parseInt(hash.slice(0, 6), 16) / 100000;
  }
}
