# Changelog

All notable changes to the Drive Narrator project will be documented in this file.

## [2025-10-05] - Critical Fixes and Code Quality Improvements

### Fixed

#### Build Errors

- **drivesController.ts**: Fixed incorrect import from nonexistent `drivesRepository` to `tripsRepository`
- **memoryRepositories.ts**: Fixed incorrect import from nonexistent `drivesRepository` to `tripsRepository`
- **drivesController.ts**: Fixed schema validation using `createDriveSchema` instead of `createTripSchema`

#### API Integration Issues

- **voicePreviewController.ts**: Removed unsupported `instructions` field from OpenAI TTS API call
- **CombinedPreview.tsx**: Fixed hardcoded localhost URL, now uses relative path `/api/voices/preview`
- **realtimeVoiceService.ts**: Fixed WebSocket connection format to match OpenAI Realtime API docs
  - Updated URL to `wss://api.openai.com/v1/realtime?model=${model}`
  - Fixed subprotocols array: `['realtime', 'openai-insecure-api-key.${token}', 'openai-beta.realtime-v1']`
  - Removed api_key query parameter
- **VoiceSettingsPage.tsx**: Fixed `updatePreferences` call signature (now passes profileId as first argument)

#### Data Consistency

- **openaiAdapter.ts**: Replaced hardcoded persona map with import from `shared/data/narratorPersonas`
- **realtimeVoiceService.ts**: Updated default persona from stale 'local-expert' to `DEFAULT_PERSONA_ID`
- **useVoiceConversation.ts**: Updated default persona to use `DEFAULT_PERSONA_ID`
- **VoiceSettingsPage.tsx**: Updated initial persona selection to use `DEFAULT_PERSONA_ID`
- **RealtimeVoiceInterface.tsx**: Updated default persona to use `DEFAULT_PERSONA_ID`
- **VoiceConversationInterface.tsx**: Updated default persona to use `DEFAULT_PERSONA_ID`

#### Pre-existing Issues

- **memoryRepositories.ts**: Fixed 8 linter errors related to `drive_id`/`driveId` vs `trip_id`/`tripId` field naming

### Added

- **shared/data/voices.ts**: Centralized voice catalog as single source of truth for voice options
  - Contains only 3 voices compatible with OpenAI Realtime API: alloy, echo, shimmer
  - Exports `DEFAULT_VOICES` and `DEFAULT_VOICE_ID` constants

### Changed

- **voicesController.ts**: Now imports `DEFAULT_VOICES` from shared location instead of defining locally
- **preferencesController.ts**: Updated to import `DEFAULT_VOICES` from shared location
- Voice system locked to 3 voices (alloy, echo, shimmer) for OpenAI Realtime API compatibility

### Technical Details

- **Architecture**: Maintained OpenAI Realtime API (WebSocket) for voice conversations
- **Voice Preview**: Uses TTS API for quick previews, Realtime API for conversations
- **Testing**: All fixes verified via browser-based smoke testing
- **Linter**: All TypeScript linter errors resolved

## [2025-10-05] - Comprehensive Persona System

### Added

- **12 Detailed Personas**: 10 standard + 2 quirky personas with unique conversation instructions
- **Persona System Guide**: Complete documentation for persona customization and usage
- **Enhanced PersonaCarousel**: Updated UI with labels, descriptions, and preview sentences
- **Conversation Instructions**: Detailed speaking style, vocabulary, and personality traits for each persona
- **Preview Sentences**: Character-specific sample phrases that showcase each persona's style

### Changed

- **Voice Settings Page**: Completely redesigned to focus on persona selection
- **Removed Accent System**: Replaced with robust persona-based voice customization
- **Backend Integration**: Updated to use persona conversation instructions with OpenAI Realtime API
- **Type Definitions**: Removed accentId from all interfaces and API calls
- **CombinedPreview**: Now uses persona preview sentences and conversation instructions

### Personas Added

- **Standard**: Aurora (Companion), Daybreak (Radio DJ), Sage (Wise), Scout (Adventure), Bard (Storyteller), Zen (Mindful), Historian (Educational), Foodie (Culinary), Naturalist (Environmental), Tech (Modern)
- **Quirky**: Naughty Merkle (Wizard), Jarvis (Sarcastic AI)

### Technical Details

- **Frontend**: Updated PersonaCarousel, VoiceSettingsPage, and CombinedPreview components
- **Backend**: Modified OpenAI adapter to use hardcoded persona data and conversation instructions
- **Shared**: Enhanced narratorPersonas.ts with detailed persona definitions
- **Accessibility**: Added proper keyboard navigation and ARIA attributes to persona selection

## [2025-10-04] - Realtime API Integration

### Added

- **RealtimeVoiceService**: Complete WebSocket integration with OpenAI Realtime API
- **RealtimeVoiceInterface**: Full conversation UI with voice controls and real-time streaming
- **Voice Activity Detection**: Semantic VAD for natural conversation flow
- **Interruption Handling**: Proper handling of user interruptions during conversation
- **Auto-reconnection**: Exponential backoff reconnection logic for WebSocket connections
- **Network Monitoring**: Automatic reconnection on network status changes

### Changed

- **Voice Preview**: Updated to use Realtime API WebSocket instead of TTS API
- **Voice Settings**: Now uses unified Realtime API for both preview and conversation
- **VoiceConversationScreen**: Simplified to use RealtimeVoiceInterface component
- **Architecture**: Unified voice system using single Realtime API for consistency

### Technical Details

- **WebSocket Management**: Full connection lifecycle with error handling
- **Audio Streaming**: Real-time audio chunk processing and playback
- **Transcript Handling**: Real-time user and assistant transcript display
- **Persona Integration**: Dynamic persona and accent integration with Realtime API
- **Function Calling**: Location and POI data integration for drive context

### Benefits

- **Unified Voice Experience**: Same voice system for settings and conversations
- **Lower Latency**: WebSocket-based real-time communication
- **Better Quality**: Realtime API designed for conversational AI
- **Simplified Architecture**: Single voice service instead of mixed TTS/Realtime
- **Real-time Features**: Live voice generation, interruption handling, VAD

### Files Modified

- `frontend/src/services/voice/realtimeVoiceService.ts` (new)
- `frontend/src/hooks/useRealtimeVoice.ts` (new)
- `frontend/src/components/voice/RealtimeVoiceInterface.tsx` (new)
- `frontend/src/components/voice/CombinedPreview.tsx` (updated)
- `frontend/src/stitch/VoiceConversationScreen.tsx` (simplified)
- `frontend/src/utils/logger.ts` (new)
- `specs/001-drive-narrator-voice-first/` (documentation updated)

## [2025-10-03] - Voice System Foundation

### Added

- **Voice Settings Page**: iOS-style carousels for voice, persona, and accent selection
- **Voice Preview**: Real-time voice testing with OpenAI TTS API
- **Persona System**: 10+ narrator personalities with distinct characteristics
- **Accent System**: 10+ accent options with detailed prompts
- **Settings Persistence**: User preferences saved and loaded

### Technical Details

- **OpenAI Integration**: TTS API with instructions parameter for persona/accent
- **UI Components**: VoiceCarousel, PersonaCarousel, AccentCarousel, CombinedPreview
- **Voice Data**: Comprehensive voice characteristics and sample texts
- **Error Handling**: Graceful fallbacks for API failures

## [2025-10-02] - Location & POI System

### Added

- **GPS Tracking**: High-accuracy location tracking with 2-second updates
- **Speed Calculation**: Real-time speed calculation from GPS coordinates
- **POI Filtering**: Interest-based POI filtering and relevance scoring
- **Alert Timing**: Configurable alert minutes with dynamic radius calculation

### Technical Details

- **Location Services**: Geolocation API with high accuracy settings
- **POI Integration**: OpenPOIService API with interest matching
- **Distance Calculation**: Haversine formula for accurate distance calculations
- **Speed Validation**: Minimum speed requirements for alert timing

## [2025-10-01] - Project Initialization

### Added

- **Project Structure**: Monorepo with frontend, backend, and shared workspaces
- **React Frontend**: TypeScript-based React application with Vite
- **Node.js Backend**: Express server with SQLite database
- **Voice Integration**: OpenAI API integration for voice features
- **Location Services**: Basic GPS tracking and POI detection
- **UI Foundation**: Modern UI with Tailwind CSS and dark mode support

### Technical Details

- **Monorepo**: npm workspaces for efficient dependency management
- **TypeScript**: Full TypeScript support across frontend and backend
- **Database**: SQLite with Knex migrations for data persistence
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Context API for application state
