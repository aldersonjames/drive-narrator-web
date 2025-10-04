import type { LineString, Point } from 'geojson';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PoiAttribution {
  provider: string;
  sourceUrl?: string;
}

export interface PoiImage {
  url: string;
  altText?: string;
  provider?: string;
}

export interface PoiSummary {
  id: string;
  poiId?: string;
  name: string;
  category: string;
  categories: string[];
  relevance: number;
  coordinates: Coordinates;
  geometry: Point;
  summary: string;
  narrationPreview?: string;
  attribution: PoiAttribution;
  images?: PoiImage[];
}

export interface RouteSummary {
  routeId: string;
  polyline: string;
  geometry: LineString;
  durationMinutes: number;
  distanceKm: number;
  score: number;
  scoreNormalized: number;
  scoreRank: number;
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

export type ConversationRole = 'traveler' | 'assistant' | 'narrator';

export interface ConversationTurn {
  id: string;
  role: ConversationRole;
  voiceId?: string;
  text: string;
  createdAt: string;
  synopsis?: string;
}

export type VoiceProviderId = 'openai' | 'elevenlabs';

export interface ConversationAudioSegment {
  id: string;
  voiceId: string;
  text: string;
  provider?: VoiceProviderId;
  format?: 'pcm16' | 'mp3' | 'opus' | 'aac';
  streamingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface VoicePipelineConfig {
  asrProvider: VoiceProviderId;
  ttsProvider: VoiceProviderId;
  narrationProvider: VoiceProviderId;
  metadata?: Record<string, unknown>;
}

export interface ConversationReplyPayload {
  turn: ConversationTurn;
  followUps: string[];
  audioSegments: ConversationAudioSegment[];
  voicePipeline?: VoicePipelineConfig;
}

export interface ConversationRequestPayload {
  profileId?: string;
  message: string;
  routeId?: string;
  routeName?: string;
  interestTags?: string[];
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

export type PoiProviderId = 'ops' | 'foursquare';

export interface ProviderCapability {
  available: boolean;
  locked: boolean;
  label: string;
  description: string;
}

export interface ProviderCapabilityMap {
  ops: ProviderCapability;
  foursquare: ProviderCapability;
}

export interface PreferencesPayload {
  profileId: string;
  assistantVoiceId: string;
  narrationVoiceId: string;
  interestTags: string[];
  transcriptOptIn: boolean;
  retentionDays?: number;
  poiProvider: PoiProviderId;
  providerCapabilities: ProviderCapabilityMap;
  /**
   * Arbitrary metadata associated with the traveler's preferences.  This allows
   * clients to persist UI‑specific flags (like notification toggles,
   * background music settings, detour distance preferences or favourites)
   * without having to expand the top‑level preferences schema.  The
   * structure of this object is intentionally open‑ended; however, known
   * properties are declared on the {@link PreferencesMetadata} type for
   * convenience and type safety.
   */
  metadata?: PreferencesMetadata | null;
}

/**
 * Additional per‑traveler preference values that are not part of the core
 * Trip Narrator contract.  These fields are considered extension points for
 * UI state and should not affect server logic.  Any unknown keys will be
 * preserved when preferences are updated.
 */
export interface PreferencesMetadata {
  /** Whether the traveler wants to receive alerts when new discoveries are available. */
  newDiscoveryAlerts?: boolean;
  /** Whether the traveler wants to be notified when approaching points of interest. */
  approachingPoiAlerts?: boolean;
  /** Whether background music should accompany narrations. */
  backgroundMusic?: boolean;
  /** Maximum detour distance preference represented as an index (0‑3). */
  maxDetourPreference?: number;
  /** List of favourited POI IDs. */
  favoritePoiIds?: string[];
  /** Additional arbitrary metadata. */
  [key: string]: unknown;
}

export interface VoiceDefinition {
  voiceId: string;
  provider: string;
  displayName: string;
  locale: string;
  styleTags: string[];
  sampleUrl?: string;
}
