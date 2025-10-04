# Data Model: Drive Narrator Voice-First Companion

**Branch**: `001-drive-narrator-voice-first` | **Date**: 2025-10-04

## Overview

This document defines the data models for the Drive Narrator voice-first companion app. The data model supports voice-first interaction, location-aware storytelling, and drive session management.

## Core Entities

### User Profile
Represents a user's preferences, settings, and learning data.

```typescript
interface UserProfile {
  profileId: string;                    // Unique identifier
  assistantVoiceId: string;            // Voice for conversational interaction
  narratorVoiceId: string;             // Voice for POI narration
  narrationPersonaId: string;          // Persona for storytelling
  narrationAccentId: string;           // Accent for narration
  interestTags: string[];              // User interests for POI filtering
  alertMinutes: number;                // POI alert timing (1-25 minutes)
  detourPreference: DetourLevel;       // Willingness to detour
  backgroundMusic: boolean;            // Background music preference
  newDiscoveryAlerts: boolean;         // New discovery notifications
  approachingPoiAlerts: boolean;       // Approaching POI notifications
  metadata: UserMetadata;              // Additional preferences
  createdAt: string;                   // Profile creation timestamp
  updatedAt: string;                   // Last update timestamp
}

interface UserMetadata {
  favoritePoiIds: string[];            // User's favorite POIs
  learnedInterests: string[];          // AI-learned interests
  conversationPatterns: ConversationPattern[]; // Learning data
  voicePreferences: VoicePreference[]; // Voice usage patterns
  driveStatistics: DriveStatistics;    // Usage statistics
  [key: string]: unknown;              // Extensible metadata
}

interface ConversationPattern {
  patternId: string;
  context: string;                     // Conversation context
  userInput: string;                  // User's input pattern
  systemResponse: string;             // System's response pattern
  effectiveness: number;              // Response effectiveness score
  frequency: number;                  // Pattern frequency
  lastUsed: string;                   // Last usage timestamp
}

interface VoicePreference {
  voiceId: string;
  personaId: string;
  accentId: string;
  usageCount: number;
  satisfactionScore: number;
  lastUsed: string;
}

interface DriveStatistics {
  totalDrives: number;
  totalDuration: number;              // Total drive time in minutes
  totalDistance: number;              // Total distance in miles
  averageDriveDuration: number;       // Average drive time
  favoritePoiTypes: string[];         // Most interacted POI types
  voiceUsagePatterns: VoiceUsage[];   // Voice usage patterns
  lastDriveDate: string;              // Last drive timestamp
}

interface VoiceUsage {
  voiceId: string;
  personaId: string;
  accentId: string;
  usageCount: number;
  satisfactionScore: number;
}
```

### Drive Session
Represents a single drive session with conversation history and POI interactions.

```typescript
interface DriveSession {
  driveId: string;                    // Unique identifier
  profileId: string;                  // Associated user profile
  startTime: string;                  // Drive start timestamp
  endTime?: string;                   // Drive end timestamp (if completed)
  status: DriveStatus;                // Current drive status
  origin?: Location;                  // Drive origin (if specified)
  destination?: Location;             // Drive destination (if specified)
  totalDistance: number;              // Total distance traveled
  totalDuration: number;              // Total drive duration
  conversationHistory: ConversationTurn[]; // All conversation turns
  poiAlerts: PoiAlert[];             // POI alerts triggered
  media: DriveMedia[];               // Associated media files
  settings: DriveSettings;           // Drive-specific settings
  statistics: DriveSessionStatistics; // Drive statistics
  createdAt: string;                 // Session creation timestamp
  updatedAt: string;                 // Last update timestamp
}

type DriveStatus = 'active' | 'paused' | 'completed' | 'archived' | 'cancelled';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;                   // Human-readable address
  city?: string;
  state?: string;
  country?: string;
  timestamp: string;                  // Location timestamp
}

interface DriveSettings {
  alertMinutes: number;               // POI alert timing
  detourPreference: DetourLevel;      // Detour willingness
  voiceSettings: VoiceSettings;       // Voice configuration
  interestTags: string[];             // Drive-specific interests
  backgroundMusic: boolean;           // Background music
  autoPlay: boolean;                  // Auto-play narration
}

interface VoiceSettings {
  assistantVoiceId: string;
  narratorVoiceId: string;
  personaId: string;
  accentId: string;
  volume: number;                     // Volume level (0-100)
  speed: number;                      // Speech speed (0.5-2.0)
  pitch: number;                      // Voice pitch (-20 to 20)
}

interface DriveSessionStatistics {
  totalConversationTurns: number;
  totalPoiAlerts: number;
  totalPoiInteractions: number;
  averageResponseTime: number;        // Average voice response time
  voiceCommandCount: number;          // Number of voice commands
  poiSkipCount: number;               // Number of POIs skipped
  poiFavoriteCount: number;           // Number of POIs favorited
  totalNarrationTime: number;         // Total narration time
  averagePoiEngagement: number;       // Average POI engagement score
}

interface DriveMedia {
  mediaId: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  poiId?: string;                     // Associated POI
  timestamp: string;                  // Media creation timestamp
  metadata: MediaMetadata;           // Media metadata
}

type MediaType = 'image' | 'audio' | 'video';

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;                  // For audio/video
  fileSize: number;
  format: string;
  source: string;                     // Media source
  attribution?: string;               // Attribution info
}
```

### Conversation Turn
Represents a single turn in a conversation between user and system.

```typescript
interface ConversationTurn {
  turnId: string;                     // Unique identifier
  driveId: string;                    // Associated drive session
  role: ConversationRole;             // Speaker role
  voiceId?: string;                   // Voice used (if applicable)
  text: string;                       // Text content
  audioUrl?: string;                  // Audio file URL (if generated)
  audioDuration?: number;             // Audio duration in seconds
  timestamp: string;                  // Turn timestamp
  synopsis?: string;                  // Brief summary
  metadata: TurnMetadata;             // Turn metadata
  context: ConversationContext;       // Conversation context
}

type ConversationRole = 'traveler' | 'assistant' | 'narrator';

interface TurnMetadata {
  confidence?: number;                // Voice recognition confidence
  language?: string;                  // Detected language
  emotion?: string;                   // Detected emotion
  intent?: string;                    // Detected intent
  entities?: Entity[];                // Extracted entities
  processingTime?: number;            // Processing time in ms
  errorCode?: string;                 // Error code if failed
  retryCount?: number;                // Number of retries
}

interface Entity {
  type: string;                       // Entity type
  value: string;                      // Entity value
  confidence: number;                 // Extraction confidence
  startIndex: number;                 // Start position in text
  endIndex: number;                   // End position in text
}

interface ConversationContext {
  previousTurn?: string;              // Previous turn ID
  nextTurn?: string;                  // Next turn ID
  topic?: string;                     // Current conversation topic
  mood?: string;                      // Conversation mood
  location?: Location;                // User location
  poiContext?: PoiContext;           // POI context
  userIntent?: string;                // User's intent
  systemState?: string;               // System state
}

interface PoiContext {
  poiId: string;
  poiName: string;
  distance: number;                   // Distance to POI
  eta: number;                        // Estimated time to arrival
  alertType: string;                  // Type of POI alert
  storyContext?: string;              // Story context
}
```

### POI Alert
Represents a POI alert triggered during a drive session.

```typescript
interface PoiAlert {
  alertId: string;                    // Unique identifier
  driveId: string;                    // Associated drive session
  poiId: string;                      // Associated POI
  triggerTime: string;                // Alert trigger timestamp
  alertMinutes: number;               // Minutes in advance
  distance: number;                   // Distance to POI
  eta: number;                        // Estimated time to arrival
  storyContent: PoiStory;             // Generated story content
  voiceSettings: VoiceSettings;       // Voice configuration used
  userResponse?: UserResponse;        // User's response to alert
  status: AlertStatus;                // Alert status
  metadata: AlertMetadata;            // Alert metadata
  createdAt: string;                  // Alert creation timestamp
  updatedAt: string;                  // Last update timestamp
}

type AlertStatus = 'triggered' | 'delivered' | 'acknowledged' | 'skipped' | 'favorited' | 'expired';

interface PoiStory {
  storyId: string;
  title: string;                      // Story title
  content: string;                    // Story content
  duration: number;                   // Story duration in seconds
  persona: string;                    // Persona used
  accent: string;                     // Accent used
  voiceId: string;                    // Voice used
  audioUrl?: string;                  // Generated audio URL
  images: PoiImage[];                 // Associated images
  metadata: StoryMetadata;            // Story metadata
}

interface PoiImage {
  imageId: string;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  source: string;                     // Image source
  attribution?: string;               // Attribution info
  width?: number;
  height?: number;
}

interface StoryMetadata {
  wordCount: number;
  readingLevel: number;
  topics: string[];                   // Story topics
  keywords: string[];                 // Story keywords
  sentiment: string;                  // Story sentiment
  culturalContext: string[];          // Cultural context
  historicalPeriod?: string;          // Historical period
  locationContext: string;            // Location context
  userRelevance: number;              // Relevance to user interests
}

interface UserResponse {
  responseType: UserResponseType;
  text?: string;                      // User's spoken response
  audioUrl?: string;                  // User's audio response
  timestamp: string;                  // Response timestamp
  satisfaction?: number;              // User satisfaction (1-5)
  feedback?: string;                  // User feedback
  actions: UserAction[];              // Actions taken
}

type UserResponseType = 'acknowledged' | 'interested' | 'not_interested' | 'skip' | 'favorite' | 'repeat' | 'more_info' | 'less_info';

interface UserAction {
  actionType: string;
  parameters: Record<string, unknown>;
  timestamp: string;
}

interface AlertMetadata {
  triggerReason: string;              // Why alert was triggered
  relevanceScore: number;             // POI relevance score
  userInterestMatch: number;          // Interest match score
  timingScore: number;                // Timing appropriateness score
  qualityScore: number;               // Overall quality score
  learningData: LearningData;         // Learning data
}

interface LearningData {
  userEngagement: number;             // User engagement level
  responseTime: number;               // User response time
  followUpActions: string[];          // Follow-up actions taken
  satisfactionScore: number;          // User satisfaction
  improvementSuggestions: string[];   // AI improvement suggestions
}
```

### Point of Interest (POI)
Represents a point of interest that can be discovered and narrated.

```typescript
interface PointOfInterest {
  poiId: string;                      // Unique identifier
  name: string;                       // POI name
  description: string;                // POI description
  category: string;                   // Primary category
  categories: string[];               // All categories
  location: Location;                 // POI location
  relevance: number;                  // Relevance score (0-1)
  summary: string;                    // Brief summary
  narrationPreview?: string;          // Narration preview
  attribution: PoiAttribution;        // Data attribution
  images: PoiImage[];                 // POI images
  metadata: PoiMetadata;              // POI metadata
  createdAt: string;                  // POI creation timestamp
  updatedAt: string;                  // Last update timestamp
}

interface PoiAttribution {
  provider: string;                   // Data provider
  sourceUrl?: string;                 // Source URL
  license?: string;                   // Data license
  lastUpdated?: string;               // Last data update
}

interface PoiMetadata {
  osmId?: string;                     // OpenStreetMap ID
  foursquareId?: string;              // Foursquare ID
  googlePlaceId?: string;             // Google Places ID
  rating?: number;                    // Average rating
  reviewCount?: number;               // Number of reviews
  priceLevel?: number;                // Price level (1-4)
  openingHours?: OpeningHours;        // Opening hours
  contactInfo?: ContactInfo;          // Contact information
  amenities: string[];                // Available amenities
  accessibility: AccessibilityInfo;   // Accessibility information
  culturalSignificance?: string;      // Cultural significance
  historicalContext?: string;         // Historical context
  seasonalInfo?: SeasonalInfo;        // Seasonal information
}

interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  specialHours?: SpecialHours[];
}

interface DayHours {
  open: string;                       // Opening time
  close: string;                      // Closing time
  isOpen24Hours?: boolean;
}

interface SpecialHours {
  date: string;                       // Special date
  hours: DayHours;
  description?: string;               // Special occasion
}

interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: SocialMedia[];
}

interface SocialMedia {
  platform: string;
  url: string;
  handle?: string;
}

interface AccessibilityInfo {
  wheelchairAccessible: boolean;
  audioDescription: boolean;
  signLanguage: boolean;
  otherAccommodations: string[];
}

interface SeasonalInfo {
  bestTimeToVisit: string[];
  seasonalEvents: SeasonalEvent[];
  weatherConsiderations: string[];
}

interface SeasonalEvent {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  recurring: boolean;
}
```

## Data Relationships

### One-to-Many Relationships
- **UserProfile** → **DriveSession** (1:N)
- **DriveSession** → **ConversationTurn** (1:N)
- **DriveSession** → **PoiAlert** (1:N)
- **DriveSession** → **DriveMedia** (1:N)
- **PoiAlert** → **PoiStory** (1:1)
- **PoiStory** → **PoiImage** (1:N)

### Many-to-Many Relationships
- **UserProfile** ↔ **PointOfInterest** (via favorites)
- **DriveSession** ↔ **PointOfInterest** (via POI alerts)

## Data Validation Rules

### User Profile Validation
- `profileId`: Required, unique, UUID format
- `assistantVoiceId`: Required, must be valid voice ID
- `narratorVoiceId`: Required, must be valid voice ID
- `narrationPersonaId`: Required, must be valid persona ID
- `narrationAccentId`: Required, must be valid accent ID
- `interestTags`: Array of strings, max 50 tags
- `alertMinutes`: Integer between 1 and 25
- `detourPreference`: Must be valid DetourLevel enum value

### Drive Session Validation
- `driveId`: Required, unique, UUID format
- `profileId`: Required, must reference existing profile
- `startTime`: Required, valid ISO timestamp
- `endTime`: Optional, must be after startTime if provided
- `status`: Required, must be valid DriveStatus enum value
- `totalDistance`: Non-negative number
- `totalDuration`: Non-negative number

### Conversation Turn Validation
- `turnId`: Required, unique, UUID format
- `driveId`: Required, must reference existing drive session
- `role`: Required, must be valid ConversationRole enum value
- `text`: Required, non-empty string, max 10,000 characters
- `timestamp`: Required, valid ISO timestamp

### POI Alert Validation
- `alertId`: Required, unique, UUID format
- `driveId`: Required, must reference existing drive session
- `poiId`: Required, must reference existing POI
- `triggerTime`: Required, valid ISO timestamp
- `alertMinutes`: Integer between 1 and 25
- `distance`: Non-negative number
- `eta`: Non-negative number

## Data Storage Strategy

### Primary Storage
- **SQLite**: Local development and testing
- **PostgreSQL**: Production database
- **Redis**: Caching and session storage

### File Storage
- **Local Storage**: Development media files
- **AWS S3**: Production media storage
- **CDN**: Media delivery optimization

### Data Retention
- **User Profiles**: Permanent (until deletion requested)
- **Drive Sessions**: 2 years (configurable)
- **Conversation Turns**: 1 year (configurable)
- **POI Alerts**: 6 months (configurable)
- **Media Files**: 1 year (configurable)

## Data Privacy & Security

### Personal Data
- **Location Data**: Encrypted, user consent required
- **Voice Data**: Encrypted, user consent required
- **Conversation Data**: Encrypted, user consent required
- **Usage Data**: Anonymized, aggregated only

### Data Access
- **User Access**: Full access to own data
- **Admin Access**: Limited to system maintenance
- **API Access**: Rate limited, authenticated
- **Third-party Access**: None without explicit consent

### Data Deletion
- **User Request**: Complete data deletion within 30 days
- **Account Closure**: Automatic data deletion
- **Legal Request**: Compliance with legal requirements
- **System Cleanup**: Automatic deletion of expired data

## Performance Considerations

### Indexing Strategy
- **Primary Keys**: Clustered indexes
- **Foreign Keys**: Non-clustered indexes
- **Search Fields**: Full-text indexes
- **Timestamp Fields**: Range indexes

### Query Optimization
- **Frequent Queries**: Optimized with proper indexes
- **Complex Queries**: Query plan analysis
- **Batch Operations**: Bulk insert/update operations
- **Connection Pooling**: Efficient connection management

### Caching Strategy
- **User Profiles**: Redis cache, 1 hour TTL
- **POI Data**: Redis cache, 24 hour TTL
- **Voice Settings**: Memory cache, session lifetime
- **Drive Sessions**: Redis cache, 30 minutes TTL

## Migration Strategy

### Version Control
- **Schema Versioning**: Incremental version numbers
- **Migration Scripts**: Automated migration execution
- **Rollback Support**: Ability to rollback changes
- **Data Validation**: Post-migration validation

### Deployment
- **Blue-Green Deployment**: Zero-downtime deployments
- **Feature Flags**: Gradual feature rollouts
- **Monitoring**: Real-time deployment monitoring
- **Alerting**: Automated error detection and alerting
