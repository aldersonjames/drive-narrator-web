export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PoiAttribution {
  provider: string;
  sourceUrl?: string;
}

export interface PoiSummary {
  id: string;
  name: string;
  category: string;
  categories: string[];
  relevance: number;
  coordinates: Coordinates;
  summary: string;
  attribution: PoiAttribution;
}

export interface RouteSummary {
  routeId: string;
  polyline: string;
  durationMinutes: number;
  distanceKm: number;
  score: number;
  scoreBreakdown: {
    poiCount: number;
    interestAlignment: number;
    diversity: number;
    durationPenalty: number;
  };
  pois: PoiSummary[];
  attribution: {
    source: string;
  };
}

export interface TripRequestPayload {
  profileId: string;
  origin: string;
  destination: string;
  departureTime?: string;
  interestTags: string[];
}

export interface TripSummary {
  tripId: string;
  profileId: string;
  origin: string;
  destination: string;
  departureTime: string;
  interestTags: string[];
  status: 'draft' | 'planned' | 'completed' | 'archived' | 'pending_deletion';
  createdAt: string;
  updatedAt: string;
}

export interface PreferencesPayload {
  profileId: string;
  assistantVoiceId: string;
  narrationVoiceId: string;
  interestTags: string[];
  transcriptOptIn: boolean;
  retentionDays?: number;
}

export interface VoiceDefinition {
  voiceId: string;
  provider: string;
  displayName: string;
  locale: string;
  styleTags: string[];
  sampleUrl?: string;
}
