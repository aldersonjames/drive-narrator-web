interface NarrationPoiContext {
  poiId: string;
  etaOffsetSeconds: number;
}

export interface NarrationScheduleRequest {
  tripStart: string; // ISO timestamp
  pois: NarrationPoiContext[];
  minimumLeadTimeSeconds?: number;
  maximumLeadTimeSeconds?: number;
}

export interface NarrationEvent {
  poiId: string;
  scheduledAt: string;
  mode: 'scheduled' | 'immediate';
}

export interface NarrationScheduleResult {
  events: NarrationEvent[];
  queuedImmediately: string[]; // POI IDs queued immediately due to short lead time
}

const DEFAULT_MIN_LEAD = 120; // 2 minutes
const DEFAULT_MAX_LEAD = 900; // 15 minutes

export class NarrationScheduler {
  schedule(request: NarrationScheduleRequest): NarrationScheduleResult {
    if (!request.tripStart) {
      throw new Error('tripStart is required');
    }

    const tripStartTime = new Date(request.tripStart).getTime();
    if (Number.isNaN(tripStartTime)) {
      throw new Error('tripStart must be a valid ISO timestamp');
    }

    const minLead = request.minimumLeadTimeSeconds ?? DEFAULT_MIN_LEAD;
    const maxLead = request.maximumLeadTimeSeconds ?? DEFAULT_MAX_LEAD;

    const scheduled: NarrationEvent[] = [];
    const immediateQueue: string[] = [];

    request.pois
      .slice()
      .sort((a, b) => a.etaOffsetSeconds - b.etaOffsetSeconds)
      .forEach((poi) => {
        const etaMs = poi.etaOffsetSeconds * 1000;
        const desiredStart = tripStartTime + etaMs - minLead * 1000;
        const now = Date.now();

        // If narration would start in the past (or within min lead), queue immediately
        if (desiredStart <= now) {
          immediateQueue.push(poi.poiId);
          scheduled.push({
            poiId: poi.poiId,
            scheduledAt: new Date(now).toISOString(),
            mode: 'immediate',
          });
          return;
        }

        // Cap maximum lead time so narration never fires too early
        const earliestAllowed = tripStartTime + etaMs - maxLead * 1000;
        const adjustedStart = Math.max(desiredStart, earliestAllowed);

        scheduled.push({
          poiId: poi.poiId,
          scheduledAt: new Date(adjustedStart).toISOString(),
          mode: 'scheduled',
        });
      });

    return {
      events: scheduled,
      queuedImmediately: immediateQueue,
    };
  }
}
