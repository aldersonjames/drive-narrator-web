import type { Knex } from 'knex';

export interface RouteOptionRecord {
  route_id: string;
  trip_id: string;
  source: string;
  polyline: string;
  duration_minutes: number;
  distance_km: number;
  score: number;
  score_breakdown: string;
  warnings: string;
  created_at: string;
}

export interface RouteOptionCreate {
  routeId: string;
  tripId: string;
  source: 'ors' | 'cache';
  polyline: string;
  durationMinutes: number;
  distanceKm: number;
  score: number;
  scoreBreakdown: Record<string, number>;
  warnings?: string[];
  createdAt?: string;
}

export class RouteOptionsRepository {
  private readonly table = 'route_options';

  constructor(private readonly db: Knex) {}

  async insertMany(values: RouteOptionCreate[]): Promise<void> {
    if (!values.length) return;

    const now = new Date().toISOString();

    const records: RouteOptionRecord[] = values.map((value) => ({
      route_id: value.routeId,
      trip_id: value.tripId,
      source: value.source,
      polyline: value.polyline,
      duration_minutes: value.durationMinutes,
      distance_km: value.distanceKm,
      score: value.score,
      score_breakdown: JSON.stringify(value.scoreBreakdown),
      warnings: JSON.stringify(value.warnings ?? []),
      created_at: value.createdAt ?? now,
    }));

    await this.db<RouteOptionRecord>(this.table).insert(records);
  }

  async findByTripId(tripId: string): Promise<RouteOptionRecord[]> {
    return this.db<RouteOptionRecord>(this.table)
      .where({ trip_id: tripId })
      .orderBy('score', 'desc');
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.db<RouteOptionRecord>(this.table).where({ trip_id: tripId }).del();
  }
}
