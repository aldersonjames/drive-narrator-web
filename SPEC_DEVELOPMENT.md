# Drive Narrator Web - Spec Development

## Purpose
Building a comprehensive spec for the Drive Narrator app based on what we've actually implemented and clarifying the true vision.

---

## Q1: What is this app really for? ✅ ANSWERED

**Answer:** This is a **location-aware storytelling companion** that is separate from navigation apps. It's meant to turn on at any time - a trip to see friends, a grocery store trip, a place you have never been, etc. It doesn't even need to know where you are going, just what you are interested in. 

It's like having grandpa in the car and driving through his hometown that you have never been to. He tells you stories about civil war battles that he was told about, he tells you about the best burger in town, tells you where the best views of the mountains are, but as you are coming up to them, not just disconnected stories. 

It's meant to be a companion for a drive to discover gems you never knew about, to alert you to an upcoming POI that you expressed an interest in hearing about.

**Key Characteristics:**
- Location-aware storytelling (not navigation)
- Interest-based content discovery
- Real-time POI alerts as you approach them
- Companion-like experience (like having a knowledgeable local in the car)
- Works for any drive, not just planned trips

---

## Q2: What have we actually implemented so far? ✅ ANSWERED

### Core App Structure:
- **Welcome Screen**: Landing page with steering wheel icon and "Drive Narrator" branding
- **Voice Conversation Screen**: Main interface with map, voice controls, and interest selection
- **Now Playing Screen**: Shows current narration/story
- **Drives Screen**: Shows past drives/trips
- **Settings Screen**: App configuration
- **Voice Settings Page**: Voice/persona/accent selection (recently built)

### Voice System (Recently Built):
- **3 Realtime API Voices**: Alloy, Echo, Shimmer
- **10+ Personas**: Adventure-seeker, Local-expert, Storyteller, Shrek, Batman, Pirate, Robot, Wizard, Cowboy, etc.
- **10 Accents**: American, British, Scottish, French, Spanish, etc.
- **Voice Preview**: TTS API integration for testing voice combinations
- **iOS-style Carousels**: For voice, persona, and accent selection

### Location & Interest System:
- **Interest Selection**: Users can choose what they're interested in (history, food, nature, etc.)
- **POI Categories**: Different types of points of interest
- **Location Tracking**: GPS-based location detection
- **Map Integration**: FollowDriveMap component for location awareness

### Backend Services:
- **Voice Services**: 8 voice-related service files
- **POI Services**: 4 point-of-interest service files
- **Preferences Service**: User preference management
- **Narration Service**: Story/narration generation
- **OpenAI Integration**: TTS API for voice generation

### Data & Content:
- **Voice Presets**: Comprehensive voice/persona/accent definitions
- **POI Categories**: Schema for different types of locations
- **Demo Data**: Mock data for testing
- **Narrator Personas**: Shared persona definitions

---

## Q3: What's the core user journey from opening the app to hearing their first story? ✅ ANSWERED

**Answer:** The core user journey is:

1. **App Opens** → User sees Welcome Screen with two options:
   - Watch Tutorial (to be built later)
   - "Narrate My Drive" button

2. **"Narrate My Drive" Selected** → App reads user profile:
   - Stored interests from previous sessions
   - Previously chosen voice/persona settings
   - User preferences and account details

3. **Voice-First Conversational Interaction Begins**:
   - App greets user like a fond friend
   - May reference memories from previous drives
   - Asks if there's anything specific they're interested in on this trip

4. **Settings Access** (if needed):
   - User can go to settings to change voice, persona, app details
   - Can return to active drive session

5. **Active Drive Experience**:
   - Shows first-person view of what's ahead that matches their interests
   - User can set alert timing (1-15 minutes) based on their speed
   - App alerts to upcoming POIs based on speed and timing setting

6. **Drive Recording & Memory**:
   - All interactions saved as a "drive" for later reference
   - Includes pictures from internet or other visual elements
   - Beautiful presentation of the journey

**Key Features:**
- Profile-based personalization
- Memory of previous interactions
- Conversational, friendly tone
- Real-time POI alerts with customizable timing
- Visual first-person perspective
- Drive history with rich media

---

## Q4: What specific types of content and stories does the app tell? ✅ ANSWERED

**Answer:** The app tells stories about a collection of both permanent and dynamic content:

### Content Categories:
1. **Historical Sites & Landmarks** - Civil war battles, historical events, cultural significance
2. **Local Businesses & Food** - Hidden gem restaurants, best burger in town, local favorites
3. **Natural Features & Scenic Viewpoints** - Best views of mountains, scenic overlooks
4. **Live Events & Activities** - Farmers markets, festivals, temporary events
5. **Cultural Sites & Attractions** - Museums, art installations, local culture

### Content Sources:
- **OpenPOIService** - For permanent POIs and categories
- **Google Search Integration** - For live events and dynamic content
- **Combined Data** - Merging permanent POI data with real-time information

### Learning & Personalization:
- **Adaptive Learning** - System learns from user preferences and choices
- **Conversational Discovery** - Asks "Do you want to hear about X?" and learns from responses
- **Follow-up Questions** - Asks quick questions to understand preferences better
- **Memory Building** - Remembers past interests and builds on them

### Content Decision Logic:
- **Interest-Based** - Primarily driven by user's expressed interests
- **Context-Aware** - Considers current location, time, and user profile
- **Proactive Suggestions** - Offers content before user asks
- **Interactive Learning** - Engages in conversation to refine preferences

---

## Q5: How does the technical architecture work for real-time location awareness and POI detection? ✅ ANSWERED

**Answer:** Based on the existing codebase, here's how the technical architecture works:

### Location Tracking:
- **GPS Integration**: Uses `navigator.geolocation.watchPosition()` with high accuracy
- **Update Frequency**: Every 2 seconds maximum age, 15 second timeout
- **Speed Calculation**: Computes speed from GPS coordinates using haversine distance
- **Heading Detection**: Uses GPS heading when available, falls back to coordinate-based bearing calculation
- **Speed Validation**: Only considers speeds ≥ 5 MPH as valid for POI calculations

### Alert Timing System:
- **User Setting**: Alert minutes (1-25 minutes, default 5 minutes)
- **Dynamic Radius**: Calculates radius based on speed: `radius = (alertMinutes * avgSpeedMph) / 60`
- **Speed Averaging**: Maintains rolling average of last 5 speed samples for stability
- **Minimum Speed**: Requires 5+ MPH to enable POI detection

### POI Detection & Filtering:
- **Data Sources**: OpenPOIService for permanent POIs, Google Search for live events
- **Interest Matching**: Filters POIs based on user's interest tags and categories
- **Category System**: 15+ predefined categories (viewpoints, restaurants, museums, etc.)
- **Relevance Scoring**: Sorts POIs by relevance to user interests
- **Token Matching**: Uses fuzzy matching on category tokens and keywords

### User Settings Available:
- **Voice Settings**: Assistant voice, narrator voice, persona selection
- **Alert Preferences**: New discovery alerts, approaching POI alerts
- **Detour Preferences**: None/Short/Medium/Long detour tolerance
- **Background Music**: Enable/disable background audio
- **Interest Tags**: Customizable list of interests for POI filtering
- **POI Provider**: Choice between OpenPOIService and Foursquare

### Technical Implementation:
- **Frontend**: React with real-time GPS tracking and WebSocket communication
- **Backend**: Node.js/Express with POI filtering and voice services
- **Data Flow**: GPS → Speed calculation → Radius calculation → POI search → Interest filtering → Alert generation
- **State Management**: Context-based state for preferences and drive data
- **Caching**: Local storage for user preferences and interest presets

---

## Q6: What's the visual experience like during a drive? ✅ ANSWERED

**Answer:** The app is designed as a **voice-first conversational experience** with minimal UI requirements:

### Target Platform:
- **iOS App**: Web app embedded in a native iOS app
- **CarPlay Integration**: Voice-only interaction through CarPlay (no UI needed initially)
- **Android Auto**: Voice-only interaction through Android Auto (no UI needed initially)
- **Future UI**: CarPlay/Android Auto UI can be added later

### Voice-First Experience:
- **Conversational Dialog**: Natural voice conversation between user and app
- **Voice Controls**: All interactions handled through voice commands
- **Voice Settings Changes**: User can change voice, persona, interests through voice
- **Drive Control**: Voice commands to pause/resume drive narration
- **No Visual Dependency**: App works entirely through voice interaction

### Current Web UI (Development/Setup):
- **Voice Settings Page**: For initial setup and voice selection
- **Settings Screen**: For configuring preferences
- **Map View**: For development/testing purposes
- **Voice Conversation Screen**: Main interface during development

### Key Design Principle:
- **Voice-First**: The app is designed to be used without looking at the screen
- **Car Integration**: Optimized for in-car use through CarPlay/Android Auto
- **Conversational**: Natural, friendly dialogue that feels like talking to a knowledgeable companion
- **Hands-Free**: All functionality accessible through voice commands

---

## Q7: What are the key voice commands and conversational flows? ✅ ANSWERED

**Answer:** Here's a comprehensive voice command system for full hands-free control:

### Wake-Up Commands:
- **"Hey Drive Narrator"** - Primary wake phrase
- **"Drive Narrator"** - Alternative wake phrase
- **"Narrate my drive"** - Direct start command

### Drive Control Commands:
- **"Start my drive"** - Begin drive narration
- **"Pause narration"** / **"Pause drive"** - Pause current narration
- **"Resume narration"** / **"Continue"** - Resume paused narration
- **"Stop drive"** / **"End drive"** - End current drive session
- **"Save this drive"** - Save current drive to history

### POI & Interest Management:
- **"Add [interest]"** - Add new interest (e.g., "Add waterfalls", "Add coffee shops")
- **"Remove [interest]"** - Remove interest (e.g., "Remove museums")
- **"What am I interested in?"** - List current interests
- **"Tell me about that"** - Get more info about current POI
- **"Skip this one"** - Skip current POI alert
- **"Mark as favorite"** - Save current POI as favorite

### Voice & Settings Control:
- **"Change my voice"** - Switch to different voice
- **"Change my accent"** - Switch to different accent
- **"Change my persona"** - Switch narrator personality
- **"What's my current voice?"** - Confirm current voice settings
- **"Set alert time to [X] minutes"** - Change POI alert timing
- **"Increase alert time"** / **"Decrease alert time"** - Adjust timing
- **"What are my settings?"** - Review current settings

### Conversational Commands:
- **"What's coming up?"** - Ask about upcoming POIs
- **"Tell me a story"** - Request general narration
- **"What's interesting around here?"** - Get local recommendations
- **"Repeat that"** - Repeat last narration
- **"Speak slower"** / **"Speak faster"** - Adjust narration speed
- **"Volume up"** / **"Volume down"** - Adjust audio volume

### System Commands:
- **"Help"** - List available commands
- **"What can you do?"** - Explain app capabilities
- **"Go to settings"** - Access settings (requires screen interaction)
- **"Show me the map"** - Display map view (requires screen interaction)

### Conversation Flow Examples:

#### Starting a Drive:
```
User: "Hey Drive Narrator, start my drive"
App: "Welcome back! I see you're interested in historic sites and local restaurants. 
      I'll keep an eye out for interesting places along your route. 
      Is there anything specific you'd like to hear about today?"
User: "Tell me about any waterfalls or scenic views"
App: "Perfect! I'll alert you to waterfalls and scenic viewpoints. 
      Your drive is now active and I'll let you know when something interesting is coming up."
```

#### POI Alert:
```
App: "Coming up on your left in about 3 minutes - the historic Old Mill Bridge. 
      It was built in 1892 and is one of the last covered bridges in the county. 
      Would you like to hear more about it?"
User: "Yes, tell me more"
App: [Provides detailed story about the bridge]
```

#### Settings Change:
```
User: "Hey Drive Narrator, change my voice to something more energetic"
App: "I can switch you to a more energetic voice. Would you like to hear a preview first?"
User: "Yes"
App: [Plays voice preview]
User: "That's perfect, use that one"
App: "Great! I've updated your voice settings. Your new energetic voice is now active."
```

### Physical Interaction Requirements:
- **Initial Setup**: Voice settings, initial interests (done via web UI)
- **Emergency Override**: Physical button to immediately stop all narration
- **Settings Access**: Complex settings changes via web UI
- **App Launch**: Physical tap to open app initially

### Quiet Mode Behavior:
- **Silent Operation**: App runs quietly in background
- **Wake on Alert**: Automatically speaks when POI approaches
- **Wake on Command**: Responds only to wake phrases
- **Battery Optimization**: Minimal processing when not actively narrating

---

## Q8: What's the data and content strategy for the stories and POI information? ✅ ANSWERED

**Answer:** Here's the comprehensive data and content strategy:

### Primary Data Sources:

#### 1. OpenPOIService (Current Implementation):
- **Local Instance**: Running locally with full Southeast US database
- **Coverage**: Comprehensive POI data for the Southeast region
- **Data Types**: Historical sites, restaurants, parks, museums, viewpoints, etc.
- **Advantages**: Fast local access, comprehensive coverage, reliable data
- **Categories**: 15+ predefined categories (tourism, leisure, amenities, etc.)

#### 2. Foursquare Integration (Future):
- **Purpose**: Expand POI coverage beyond Southeast
- **Data Types**: Additional restaurants, venues, local businesses
- **Integration**: API integration for real-time POI data
- **Coverage**: National and international POI coverage

#### 3. Google Search Integration (Real-time Events):
- **Purpose**: Dynamic, temporary events and activities
- **Examples**: Food trucks, circus, farmers markets, festivals, pop-up events
- **Search Strategy**: Location-based Google searches for live events
- **Update Frequency**: Real-time or near-real-time updates
- **Content Types**: Events, temporary attractions, seasonal activities

### Content Generation Strategy:

#### AI-Generated Stories:
- **Base Data**: POI information from OpenPOIService and Foursquare
- **AI Enhancement**: GPT models to create engaging, personalized stories
- **Persona Integration**: Stories tailored to selected narrator persona
- **Context Awareness**: Stories adapted to user interests and location

#### Story Quality Control:
- **Fact-Checking**: Cross-reference historical data with multiple sources
- **Accuracy Validation**: Verify dates, names, and historical facts
- **Engagement Focus**: Stories designed to be conversational and interesting
- **Length Control**: Appropriate length for driving context (30-60 seconds)

#### Regional Knowledge:
- **Local Expertise**: Southeast database provides deep local knowledge
- **Cultural Context**: Stories include local culture and history
- **Seasonal Awareness**: Content adapted to time of year and local events
- **Community Insights**: Local recommendations and hidden gems

### Data Architecture:

#### Static POI Data (OpenPOIService):
- **Historical Sites**: Museums, monuments, landmarks
- **Natural Features**: Parks, viewpoints, hiking trails
- **Businesses**: Restaurants, cafes, shops, breweries
- **Cultural Sites**: Theaters, galleries, music venues

#### Dynamic Event Data (Google Search):
- **Temporary Events**: Festivals, markets, pop-ups
- **Mobile Businesses**: Food trucks, traveling shows
- **Seasonal Activities**: Holiday events, seasonal attractions
- **Community Events**: Local gatherings, special occasions

#### Content Curation:
- **Interest Matching**: Content filtered by user interests
- **Relevance Scoring**: POIs ranked by user preference alignment
- **Distance Filtering**: Content within user's alert radius
- **Timing Optimization**: Content appropriate for current time/season

### Technical Implementation:
- **Local Database**: Fast access to Southeast POI data
- **API Integration**: Foursquare and Google Search APIs
- **Caching Strategy**: Cache frequently accessed POI data
- **Real-time Updates**: Live event data refreshed regularly
- **Fallback System**: Graceful degradation if external APIs fail

---

## Q9: What's the monetization and business model strategy? ✅ ANSWERED

**Answer:** This is currently a **learning project** with future commercial potential:

### Current Phase (Learning):
- **Purpose**: Personal AI learning and development project
- **Focus**: Understanding AI integration, voice systems, and location-based apps
- **Scope**: Southeast US region with local OpenPOIService database
- **Goal**: Build and refine the core technology and user experience

### Future Commercial Phase:
- **iOS App Store**: Native iOS app with embedded web technology
- **Android Play Store**: Native Android app with embedded web technology
- **Monetization**: To be determined based on learning phase results
- **Expansion**: Broader geographic coverage and enhanced features

### Learning Objectives:
- **AI Integration**: Master OpenAI APIs for voice and content generation
- **Voice Technology**: Understand real-time voice processing and synthesis
- **Location Services**: Learn GPS tracking and POI detection systems
- **Mobile Development**: Experience with iOS/Android app development
- **User Experience**: Design voice-first, hands-free interfaces

### Technical Foundation:
- **Web Technology**: React/Node.js for rapid development and testing
- **Voice APIs**: OpenAI TTS and Realtime APIs for voice generation
- **Location Services**: GPS tracking and POI detection
- **Data Sources**: OpenPOIService, Foursquare, Google Search integration
- **Mobile Ready**: Architecture designed for iOS/Android embedding

---

## SPEC SUMMARY

Based on our comprehensive discussion, here's the complete Drive Narrator Web specification:

### **Core Concept:**
A voice-first, location-aware storytelling companion that provides personalized narration about points of interest during drives, designed to work through CarPlay/Android Auto with minimal visual interaction.

### **Key Features:**
- **Voice-First Experience**: Hands-free operation through voice commands
- **Location Awareness**: Real-time GPS tracking and POI detection
- **Personalized Content**: AI-generated stories based on user interests
- **Adaptive Learning**: System learns from user preferences over time
- **Multiple Personas**: Various narrator personalities and voices
- **Real-time Events**: Integration with live events and temporary attractions

### **Technical Architecture:**
- **Frontend**: React web app (embedded in native iOS/Android apps)
- **Backend**: Node.js/Express with voice and POI services
- **Voice**: OpenAI TTS and Realtime APIs with 3 voice options
- **Data**: OpenPOIService (Southeast US), Foursquare, Google Search
- **Platform**: iOS App Store and Android Play Store (future)

### **User Journey:**
1. App opens → "Narrate My Drive" button
2. Voice conversation begins with personalized greeting
3. Real-time POI alerts based on interests and location
4. Conversational interaction throughout the drive
5. Drive saved to history with rich media

### **Current Status:**
- **Phase**: Learning and development
- **Coverage**: Southeast US region
- **Focus**: AI integration and voice technology mastery
- **Goal**: Build foundation for future commercial release

---

## SPEC KIT INTEGRATION STATUS

### **Current Issue:**
The existing spec kit in `/specs/001-product-overview-the/` is still focused on the **"Trip Narrator"** concept, but the app has evolved into a **"Drive Narrator"** with fundamentally different architecture and user experience.

### **Key Differences:**
- **Old Spec**: Trip planning with multiple routes, destination-based
- **New Spec**: Location-aware storytelling, no destination required
- **Old Spec**: Web PWA with visual map interface
- **New Spec**: Voice-first, CarPlay/Android Auto focused
- **Old Spec**: Route scoring and comparison
- **New Spec**: Real-time POI alerts and conversational interaction

### **Required Updates:**
1. **Update spec.md** - Replace trip planning focus with drive narration focus
2. **Update plan.md** - Reflect current implementation status and new architecture
3. **Update data-model.md** - Align with current data structures
4. **Update db-schema.md** - Match current database design
5. **Update openapi.yaml** - Reflect current API endpoints
6. **Create new spec files** - For voice commands, CarPlay integration, etc.

### **Next Steps:**
- Update existing spec files to match current "Drive Narrator" concept
- Add new spec sections for voice-first experience and CarPlay integration
- Align technical architecture with current React/Node.js implementation
- Document the learning objectives and future commercial roadmap

---

## Notes
- App is currently running on localhost:5173 (frontend) and localhost:41234 (backend)
- Voice system is working with OpenAI TTS API
- All "trip" references have been migrated to "drive" terminology
- Voice settings page is fully functional with carousel selection
