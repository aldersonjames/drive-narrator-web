# Changelog

All notable changes to the Drive Narrator project will be documented in this file.

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
