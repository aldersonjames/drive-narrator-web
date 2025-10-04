# Feature Specification: Drive Narrator Voice-First Companion

**Feature Branch**: `001-drive-narrator-voice-first`  
**Created**: 2025-10-04  
**Status**: Active Development  
**Input**: Voice-first, location-aware storytelling companion for drives

## Overview

Drive Narrator is a voice-first, location-aware storytelling companion that provides personalized narration about points of interest during drives. The app is designed to work through CarPlay/Android Auto with minimal visual interaction, focusing on conversational AI and real-time POI discovery.

## Core Concept

A location-aware storytelling companion that is separate from navigation apps. It's meant to turn on at any time - a trip to see friends, a grocery store trip, a place you have never been, etc. It doesn't even need to know where you are going, just what you are interested in.

It's like having grandpa in the car and driving through his hometown that you have never been to. He tells you stories about civil war battles that he was told about, he tells you about the best burger in town, tells you where the best views of the mountains are, but as you are coming up to them, not just disconnected stories.

## User Scenarios & Testing

### Primary User Story
A driver opens the app and selects "Narrate My Drive". The app reads their profile, greets them like a fond friend, and begins a voice-first conversational interaction. As they drive, the app alerts them to upcoming POIs based on their interests and provides engaging stories about local attractions, historical sites, and points of interest.

### Acceptance Scenarios
1. **Given** a driver opens the app and selects "Narrate My Drive", **When** the app loads their profile, **Then** it greets them personally and asks about their interests for the current drive.
2. **Given** a driver is traveling and approaching a POI of interest, **When** the app detects the POI within their alert radius, **Then** it provides an engaging story about the location in their chosen voice and persona.
3. **Given** a driver wants to change settings during their drive, **When** they use voice commands, **Then** the app responds conversationally and updates their preferences.
4. **Given** a driver completes their drive, **When** they end the session, **Then** the app saves the drive with rich media and conversation history.

### Edge Cases
- How does the system handle microphone denial or speech-recognition failure?
- What happens when no POIs match the driver's interests along their route?
- How does the companion behave when the driver is already near a POI at drive start?
- How does the system respond if the driver requests voice interaction while offline?
- How does the app handle interruptions from phone calls or navigation prompts?

## Requirements

### Functional Requirements

#### Voice-First Experience
- **FR-001**: System MUST operate primarily through voice interaction with minimal visual dependency
- **FR-002**: System MUST support CarPlay and Android Auto integration for hands-free operation
- **FR-003**: System MUST provide wake-up commands ("Hey Drive Narrator", "Drive Narrator", "Narrate my drive")
- **FR-004**: System MUST support comprehensive voice commands for all functionality
- **FR-005**: System MUST operate in "quiet mode" - silent until woken by command or POI alert

#### Location Awareness
- **FR-006**: System MUST track GPS location with high accuracy (2-second updates)
- **FR-007**: System MUST calculate speed and heading for POI alert timing
- **FR-008**: System MUST support configurable alert timing (1-25 minutes, default 5 minutes)
- **FR-009**: System MUST calculate dynamic radius based on speed and alert timing
- **FR-010**: System MUST only activate POI detection when speed ≥ 5 MPH

#### POI Detection & Content
- **FR-011**: System MUST integrate with OpenPOIService for Southeast US POI data
- **FR-012**: System MUST integrate with Foursquare for expanded POI coverage
- **FR-013**: System MUST integrate with Google Search for real-time events (food trucks, festivals)
- **FR-014**: System MUST filter POIs based on user interests and preferences
- **FR-015**: System MUST provide AI-generated stories about POIs using selected persona

#### Voice & Persona System
- **FR-016**: System MUST support 3 OpenAI Realtime API voices (alloy, echo, shimmer)
- **FR-017**: System MUST support 10+ narrator personas (adventure-seeker, local-expert, Shrek, Batman, etc.)
- **FR-018**: System MUST support 10+ accents (American, British, Scottish, French, etc.)
- **FR-019**: System MUST allow voice changes through voice commands
- **FR-020**: System MUST provide voice preview functionality for testing combinations

#### Learning & Personalization
- **FR-021**: System MUST learn from user preferences and choices over time
- **FR-022**: System MUST remember previous drives and reference them conversationally
- **FR-023**: System MUST adapt content based on user feedback and interactions
- **FR-024**: System MUST support interest management through voice commands
- **FR-025**: System MUST provide personalized greetings and conversation starters

#### Drive Management
- **FR-026**: System MUST save drives with rich media and conversation history
- **FR-027**: System MUST allow drive resumption and modification
- **FR-028**: System MUST support drive history browsing and management
- **FR-029**: System MUST provide drive sharing and export capabilities
- **FR-030**: System MUST maintain drive privacy and data retention controls

### Non-Functional Requirements

#### Performance
- **NFR-001**: System MUST respond to voice commands within 200ms
- **NFR-002**: System MUST load POI data within 500ms
- **NFR-003**: System MUST maintain 60fps UI performance during voice interaction
- **NFR-004**: System MUST operate efficiently on mobile devices with limited battery

#### Accessibility
- **NFR-005**: System MUST comply with WCAG 2.1 AA guidelines
- **NFR-006**: System MUST support screen readers and assistive technologies
- **NFR-007**: System MUST provide audio alternatives for all visual content
- **NFR-008**: System MUST support voice-only operation for drivers with visual impairments

#### Privacy & Security
- **NFR-009**: System MUST encrypt all stored user data
- **NFR-010**: System MUST provide clear privacy notices and consent mechanisms
- **NFR-011**: System MUST allow users to delete their data completely
- **NFR-012**: System MUST not store or transmit location data without consent

#### Reliability
- **NFR-013**: System MUST operate offline with cached content
- **NFR-014**: System MUST gracefully handle API failures and network issues
- **NFR-015**: System MUST maintain data consistency across sessions
- **NFR-016**: System MUST provide fallback mechanisms for voice recognition failures

## Key Entities

### User Profile
- **profileId**: Unique identifier for the user
- **assistantVoiceId**: Selected voice for conversational interaction
- **narratorVoiceId**: Selected voice for POI narration
- **narrationPersonaId**: Selected persona for storytelling
- **interestTags**: Array of user interests for POI filtering
- **alertMinutes**: POI alert timing preference (1-25 minutes)
- **detourPreference**: Willingness to detour (none/short/medium/long)
- **metadata**: Additional preferences and settings

### Drive Session
- **driveId**: Unique identifier for the drive
- **profileId**: Associated user profile
- **startTime**: Drive start timestamp
- **endTime**: Drive end timestamp (if completed)
- **status**: active, paused, completed, archived
- **conversationHistory**: Array of conversation turns
- **poiAlerts**: Array of POI alerts triggered
- **media**: Associated images and audio files

### POI Alert
- **alertId**: Unique identifier for the alert
- **poiId**: Associated POI identifier
- **driveId**: Associated drive session
- **triggerTime**: When the alert was triggered
- **alertMinutes**: How many minutes in advance
- **storyContent**: AI-generated story content
- **voiceSettings**: Voice and persona used for narration
- **userResponse**: How the user responded to the alert

### Conversation Turn
- **turnId**: Unique identifier for the turn
- **driveId**: Associated drive session
- **role**: traveler, assistant, narrator
- **voiceId**: Voice used for this turn
- **text**: Text content of the turn
- **audioUrl**: URL to audio file (if generated)
- **timestamp**: When the turn occurred
- **synopsis**: Brief summary of the turn

## Voice Commands

### Drive Control
- "Start my drive" - Begin drive narration
- "Pause narration" / "Pause drive" - Pause current narration
- "Resume narration" / "Continue" - Resume paused narration
- "Stop drive" / "End drive" - End current drive session
- "Save this drive" - Save current drive to history

### POI & Interest Management
- "Add [interest]" - Add new interest (e.g., "Add waterfalls")
- "Remove [interest]" - Remove interest (e.g., "Remove museums")
- "What am I interested in?" - List current interests
- "Tell me about that" - Get more info about current POI
- "Skip this one" - Skip current POI alert
- "Mark as favorite" - Save current POI as favorite

### Voice & Settings Control
- "Change my voice" - Switch to different voice
- "Change my accent" - Switch to different accent
- "Change my persona" - Switch narrator personality
- "What's my current voice?" - Confirm current voice settings
- "Set alert time to [X] minutes" - Change POI alert timing
- "Increase alert time" / "Decrease alert time" - Adjust timing
- "What are my settings?" - Review current settings

### Conversational Commands
- "What's coming up?" - Ask about upcoming POIs
- "Tell me a story" - Request general narration
- "What's interesting around here?" - Get local recommendations
- "Repeat that" - Repeat last narration
- "Speak slower" / "Speak faster" - Adjust narration speed
- "Volume up" / "Volume down" - Adjust audio volume

### System Commands
- "Help" - List available commands
- "What can you do?" - Explain app capabilities
- "Go to settings" - Access settings (requires screen interaction)
- "Show me the map" - Display map view (requires screen interaction)

## Data Sources

### OpenPOIService (Primary)
- **Coverage**: Southeast US region
- **Data Types**: Historical sites, restaurants, parks, museums, viewpoints
- **Advantages**: Fast local access, comprehensive coverage, reliable data
- **Categories**: 15+ predefined categories (tourism, leisure, amenities)

### Foursquare (Secondary)
- **Coverage**: National and international
- **Data Types**: Additional restaurants, venues, local businesses
- **Integration**: API integration for real-time POI data
- **Purpose**: Expand POI coverage beyond Southeast

### Google Search (Real-time Events)
- **Coverage**: Dynamic, location-based
- **Data Types**: Food trucks, festivals, pop-ups, seasonal events
- **Update Frequency**: Real-time or near-real-time
- **Purpose**: Live events and temporary attractions

## Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **State Management**: Context API for preferences and drive data
- **Voice Integration**: OpenAI GPT Realtime API WebSocket for end-to-end voice
- **Location Services**: Geolocation API with high accuracy
- **Platform**: Web app designed for iOS/Android embedding

### Backend
- **Runtime**: Node.js 20.x with Express
- **Database**: SQLite with Knex migrations
- **Voice Services**: OpenAI GPT Realtime API WebSocket integration
- **POI Services**: OpenPOIService, Foursquare, Google Search integration
- **Caching**: Redis for frequently accessed data
- **Deployment**: Containerized for cloud deployment

### Voice Pipeline
- **Unified Architecture**: OpenAI GPT Realtime API for end-to-end voice processing
- **Voice Selection**: 3 Realtime API voices (alloy, echo, shimmer) with consistent experience
- **Persona Integration**: 10+ distinct personas with unique speaking styles
- **Accent Support**: 10+ regional accents with authentic pronunciation
- **Real-time Processing**: WebSocket-based low-latency voice conversation
- **Voice Preview**: Real-time voice preview using same Realtime API
- **Fallback**: Text input when voice recognition fails

## Success Metrics

### User Engagement
- **Drive Completion Rate**: Percentage of started drives that are completed
- **POI Interaction Rate**: Percentage of POI alerts that receive user engagement
- **Voice Command Usage**: Frequency and variety of voice commands used
- **Session Duration**: Average length of drive sessions

### Content Quality
- **Story Engagement**: User feedback on story quality and relevance
- **POI Accuracy**: Accuracy of POI information and recommendations
- **Voice Satisfaction**: User preference for selected voices and personas
- **Learning Effectiveness**: Improvement in content relevance over time

### Technical Performance
- **Voice Response Time**: Latency from command to response
- **POI Detection Accuracy**: Correct identification of relevant POIs
- **System Reliability**: Uptime and error rates
- **Battery Efficiency**: Power consumption during drive sessions

## Future Enhancements

### Phase 2: Enhanced AI
- **Multi-modal Input**: Support for image and video input
- **Advanced Learning**: Machine learning for better personalization
- **Emotional Intelligence**: Detection and response to user mood
- **Predictive Content**: Anticipate user interests and preferences

### Phase 3: Social Features
- **Drive Sharing**: Share interesting drives with friends
- **Community Content**: User-generated stories and recommendations
- **Social Discovery**: Find drives and POIs from other users
- **Group Drives**: Multi-user drive experiences

### Phase 4: Platform Expansion
- **CarPlay UI**: Native CarPlay interface design
- **Android Auto UI**: Native Android Auto interface
- **Smart Home Integration**: Connect with home automation systems
- **Wearable Support**: Apple Watch and Android Wear integration

## Implementation Status

### Completed Features ✅
- Voice settings page with carousel selection
- OpenAI TTS integration with 3 voices
- Persona and accent system with 10+ options each
- Voice preview functionality
- Basic POI detection and filtering
- Location tracking and speed calculation
- User preferences management
- Drive history storage

### In Progress 🚧
- Real-time voice conversation system
- POI alert timing and radius calculation
- AI-generated story content
- Voice command processing
- CarPlay/Android Auto integration planning

### Planned Features 📋
- Advanced voice recognition and processing
- Enhanced POI data integration
- Offline content caching
- Drive sharing and export
- Advanced personalization and learning
- Native mobile app development
