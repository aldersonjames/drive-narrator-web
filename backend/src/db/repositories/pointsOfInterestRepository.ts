import type { Knex } from 'knex';

export interface PointOfInterestRecord {
  poi_id: string;
  route_id: string;
  external_id: string | null;
  provider: string;
  category: string;
  relevance: number;
  coordinates_lat: number;
  coordinates_lng: number;
  summary: string;
  narration_script: string;
  narration_preview: string;
  eta_offset_seconds: number;
  attribution: string;
  created_at: string;
}

export interface PointOfInterestCreate {
  poiId: string;
  routeId: string;
  externalId?: string | null;
  provider: string;
  category: string;
  relevance: number;
  coordinatesLat: number;
  coordinatesLng: number;
  summary: string;
  narrationScript: string;
  narrationPreview: string;
  etaOffsetSeconds: number;
  attribution: Record<string, unknown>;
  createdAt?: string;
}

export class PointsOfInterestRepository {
  private readonly table = 'points_of_interest';

  constructor(private readonly db: Knex) {}

  async insertMany(pois: PointOfInterestCreate[]): Promise<void> {
    if (!pois.length) return;

    const now = new Date().toISOString();

    const records: PointOfInterestRecord[] = pois.map((poi) => ({
      poi_id: poi.poiId,
      route_id: poi.routeId,
      external_id: poi.externalId ?? null,
      provider: poi.provider,
      category: poi.category,
      relevance: poi.relevance,
      coordinates_lat: poi.coordinatesLat,
      coordinates_lng: poi.coordinatesLng,
      summary: poi.summary,
      narration_script: poi.narrationScript,
      narration_preview: poi.narrationPreview,
      eta_offset_seconds: poi.etaOffsetSeconds,
      attribution: JSON.stringify(poi.attribution),
      created_at: poi.createdAt ?? now,
    }));

    await this.db<PointOfInterestRecord>(this.table).insert(records);
  }

  async findByRouteId(routeId: string): Promise<PointOfInterestRecord[]> {
    return this.db<PointOfInterestRecord>(this.table)
      .where({ route_id: routeId })
      .orderBy('eta_offset_seconds', 'asc');
  }

  async deleteByRouteId(routeId: string): Promise<void> {
    await this.db<PointOfInterestRecord>(this.table).where({ route_id: routeId }).del();
  }
}
