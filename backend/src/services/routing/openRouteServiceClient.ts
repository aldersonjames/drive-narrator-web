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
  departureTime?: string;
  preference?: 'recommended' | 'fastest' | 'shortest' | 'green';
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

    if (this.useMock) {
      console.warn('OpenRouteServiceClient: running in mock mode (no ORS_API_KEY provided).');
    } else {
      console.info('OpenRouteServiceClient: using OpenRouteService API.');
    }
  }

  async getRoutes(request: RouteRequest): Promise<RouteResponse> {
    const originCoord = this.normalizeCoordinate(request.origin);
    const destinationCoord = this.normalizeCoordinate(request.destination);

    const normalized: RouteRequest = {
      ...request,
      origin: originCoord,
      destination: destinationCoord,
      preference: request.preference ?? 'recommended',
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

    const estimatedDistance = this.estimateDistanceMeters(originCoord, destinationCoord);
    let allowAlternatives = (normalized.alternatives ?? 3) > 1 && estimatedDistance <= 140_000;

    const url = `${this.baseUrl}/v2/directions/${profile}/geojson?${searchParams.toString()}`;

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.retries) {
      try {
        const body = {
          coordinates: [
            [originCoord.lng, originCoord.lat],
            [destinationCoord.lng, destinationCoord.lat],
          ],
          format: 'json',
          elevation: false,
          extra_info: ['waytype'],
          preference: normalized.preference ?? 'recommended',
          options: {
            avoid_features: normalized.avoidanceCategories ?? [],
          },
          alternative_routes: allowAlternatives
            ? {
                target_count: Math.min(normalized.alternatives ?? 3, 3),
                weight_factor: 1.1,
                share_factor: 0.7,
              }
            : undefined,
        };

        const response = await this.fetchImpl(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.apiKey,
          },
          body: JSON.stringify(body),
        });

        const raw = await response.text();

        if (!response.ok) {
          if (response.status === 400) {
            try {
              const parsed = JSON.parse(raw) as { error?: { code?: number } };
              if (parsed?.error?.code === 2004) {
                if (allowAlternatives) {
                  console.warn(
                    'OpenRouteServiceClient: distance limit hit, retrying without alternatives.',
                  );
                  allowAlternatives = false;
                  continue;
                }
                console.warn(
                  'OpenRouteServiceClient: distance limit hit, falling back to mock route.',
                );
                return this.buildMockResponse(normalized);
              }
            } catch (parseError) {
              console.warn('OpenRouteServiceClient: unable to parse ORS error payload', parseError);
            }
          }
          throw new Error(`OpenRouteService error ${response.status}: ${raw}`);
        }

        const json = JSON.parse(raw) as RouteResponse;
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
      const trimmed = input.trim();
      const match = trimmed.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (match) {
        const first = Number.parseFloat(match[1]);
        const second = Number.parseFloat(match[2]);
        if (Number.isFinite(first) && Number.isFinite(second)) {
          if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
            return { lat: first, lng: second };
          }
          if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
            return { lat: second, lng: first };
          }
        }
      }

      const hash = this.hashToNumber(trimmed || '0');
      return {
        lat: (hash % 90) - 45,
        lng: ((hash / 90) % 180) - 90,
      };
    }

    return input;
  }

  private buildMockResponse(request: RouteRequest): RouteResponse {
    const origin =
      typeof request.origin === 'string'
        ? this.normalizeCoordinate(request.origin)
        : request.origin;
    const destination =
      typeof request.destination === 'string'
        ? this.normalizeCoordinate(request.destination)
        : request.destination;

    const originCoord = origin ?? { lat: 0, lng: 0 };
    const destinationCoord = destination ?? { lat: 0.5, lng: 0.5 };

    const variations = [0, 0.2, -0.2];

    const features: RouteFeature[] = variations.map((variation, index) => {
      const steps = 12;
      const coords: number[][] = [];
      for (let i = 0; i < steps; i += 1) {
        const t = i / (steps - 1);
        const bulge = variation * Math.sin(Math.PI * t);
        const lat = originCoord.lat + (destinationCoord.lat - originCoord.lat) * t + bulge * 0.3;
        const lng = originCoord.lng + (destinationCoord.lng - originCoord.lng) * t + bulge * 0.6;
        coords.push([lng, lat]);
      }

      const distanceMeters = 200_000 * (1 - index * 0.07);
      const durationSeconds = 2.5 * 3600 * (1 - index * 0.08);

      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {
          segments: [
            {
              distance: distanceMeters,
              duration: durationSeconds,
            },
          ],
          summary: {
            distance: distanceMeters,
            duration: durationSeconds,
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

  private estimateDistanceMeters(a: Coordinate, b: Coordinate): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000;
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }
}
