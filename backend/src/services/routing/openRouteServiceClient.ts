import crypto from 'node:crypto';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: Coordinate;
  destination: Coordinate;
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

  constructor(options: OpenRouteServiceClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.ORS_API_KEY ?? '';
    if (!this.apiKey) {
      throw new Error('ORS_API_KEY is required');
    }

    this.baseUrl = options.baseUrl ?? 'https://api.openrouteservice.org';
    this.ttlMs = options.ttlMs ?? Number(process.env.ORS_CACHE_TTL_MS ?? 900_000);
    this.retries = options.retries ?? 2;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getRoutes(request: RouteRequest): Promise<RouteResponse> {
    const cacheKey = this.buildCacheKey(request);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const profile = request.profile ?? 'driving-car';
    const searchParams = new URLSearchParams({
      api_key: this.apiKey,
    });

    const body = {
      coordinates: [
        [request.origin.lng, request.origin.lat],
        [request.destination.lng, request.destination.lat],
      ],
      format: 'json',
      elevation: false,
      extra_info: ['waytype'],
      options: {
        avoid_features: request.avoidanceCategories ?? [],
      },
      alternative_routes: {
        target_count: request.alternatives ?? 3,
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
}
