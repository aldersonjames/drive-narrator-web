import { URLSearchParams } from 'node:url';

interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  streetName?: string;
  streetNumber?: string;
  locality?: string;
  region?: string;
  label?: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface OpenRouteReverseGeocoderOptions {
  apiKey: string;
  ttlMs?: number;
  fetchImpl?: typeof fetch;
  logger?: { warn(message: string, meta?: Record<string, unknown>): void };
}

export class OpenRouteReverseGeocoder {
  private readonly apiKey: string;
  private readonly ttlMs: number;
  private readonly cache = new Map<string, CacheEntry<ReverseGeocodeResult>>();
  private readonly fetchImpl: typeof fetch;
  private readonly logger?: { warn(message: string, meta?: Record<string, unknown>): void };

  constructor(options: OpenRouteReverseGeocoderOptions) {
    this.apiKey = options.apiKey;
    this.ttlMs = options.ttlMs ?? 60_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.logger = options.logger;

    if (!this.apiKey) {
      throw new Error('OpenRouteReverseGeocoder requires ORS API key');
    }
  }

  async reverseGeocode({
    latitude,
    longitude,
  }: ReverseGeocodeRequest): Promise<ReverseGeocodeResult> {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const params = new URLSearchParams({
      api_key: this.apiKey,
      'point.lon': longitude.toString(),
      'point.lat': latitude.toString(),
      size: '1',
    });

    const url = `https://api.openrouteservice.org/geocode/reverse?${params.toString()}`;

    const response = await this.fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const message = await response.text();
      this.logger?.warn('reverse-geocode-failed', {
        status: response.status,
        message,
      });
      throw new Error(`Reverse geocode failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      features?: Array<{
        properties?: {
          name?: string;
          street?: string;
          housenumber?: string;
          locality?: string;
          region?: string;
          county?: string;
          label?: string;
        };
      }>;
    };

    const feature = data.features?.[0]?.properties ?? {};

    const result: ReverseGeocodeResult = {
      streetName: feature.street || feature.name,
      streetNumber: feature.housenumber,
      locality: feature.locality || feature.county,
      region: feature.region,
      label: feature.label,
    };

    if (!result.label) {
      const parts = [
        result.streetNumber ? `${result.streetNumber}` : undefined,
        result.streetName,
        result.locality,
        result.region,
      ].filter(Boolean);
      if (parts.length) {
        result.label = parts.join(', ');
      }
    }

    this.cache.set(cacheKey, {
      value: result,
      expiresAt: now + this.ttlMs,
    });

    return result;
  }
}

export default OpenRouteReverseGeocoder;
