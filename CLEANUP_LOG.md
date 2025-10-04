# Trip Narrator Web - Cleanup Log

## Overview
This document tracks all files moved, organized, and cleaned up during the project reorganization.

## Directory Structure Created

### Backup Directories
- `backup/duplicates/` - Duplicate files with different implementations
- `backup/unused/` - Unused files that might be needed later
- `backup/old-versions/` - Old versions of files before major changes
- `backup/experimental/` - Experimental code and prototypes

### Parking Directories
- `parking/voice-services/` - Voice-related services and hooks not currently used
- `parking/components/` - Unused React components
- `parking/old-implementations/` - Old implementations that might be referenced
- `parking/chatgpt-fixes/` - ChatGPT-generated fixes and improvements

### Documentation Directories
- `docs/voice-integration/` - Voice integration guides and examples

## Files Moved

### Duplicates Resolved
1. **NarrationTimeline.tsx**
   - **Kept**: `frontend/src/components/voice/NarrationTimeline.tsx` (more complete, uses RouteSummary)
   - **Moved to backup**: `backup/duplicates/NarrationTimeline_timeline_version.tsx` (simpler timeline implementation)
   - **Removed**: `frontend/src/components/timeline/` (entire directory)

2. **DiscoveryScreen.tsx**
   - **Moved to parking**: `parking/components/DiscoveryScreen.tsx` (removed from app, no longer needed)
   - **Moved to backup**: `backup/duplicates/DiscoveryScreen_chatgpt_version.tsx` (ChatGPT version)

### Unused Files Moved to Parking

#### Voice Services
- `parking/voice-services/openaiWebSocketServiceWithTokens.ts` - Unused token-based service
- `parking/voice-services/useOpenAIVoice.ts` - Unused hook
- `parking/voice-services/useDemoVoice.ts` - Unused demo hook

#### Components
- `parking/components/DiscoveryScreen.tsx` - Removed from app (no longer needed)
- `parking/components/OpenAIVoiceChat.tsx` - Unused OpenAI voice chat component
- `parking/components/LaunchExperience.tsx` - Unused launch experience page
- `parking/components/launchTimelineUtils.ts` - Unused launch timeline utilities
- `parking/components/PreferencesPage.tsx` - Unused preferences page

#### ChatGPT Fixes
- `parking/chatgpt-fixes/` - Entire directory moved from `fromChatGPT/`

### Documentation Organized
- `docs/voice-integration/ElevenLabs_Voice_Integration_Guide.md`
- `docs/voice-integration/OpenAI_Voice_WebSocket_Complete_Guide.md`
- `docs/voice-integration/VOICE_WEBSOCKET_README.md`
- `docs/voice-integration/voice-websocket-example.html`

### UI Navigation Changes
1. **Created AppNavigation Component**
   - **New file**: `frontend/src/components/navigation/AppNavigation.tsx`
   - **Features**: Reusable navigation component with top/bottom positioning
   - **Removed**: Discover button from navigation
   - **Updated**: All remaining pages now have consistent top and bottom navigation

2. **Updated All Stitch Screens**
   - **VoiceConversationScreen**: Added top navigation, updated bottom navigation
   - **NowPlayingScreen**: Added top navigation, updated bottom navigation  
   - **TripsScreen**: Added top navigation, updated bottom navigation
   - **SettingsScreen**: Added top navigation, updated bottom navigation
   - **WelcomeScreen**: Left unchanged (landing page doesn't need navigation)

3. **Routing Updates**
   - **Removed**: `/discoveries` route from App.tsx
   - **Removed**: DiscoveryScreen import from App.tsx
   - **Result**: Cleaner routing with only active pages

## Current Clean Structure

### Frontend Components
```
frontend/src/components/
├── landing/
│   └── LandingIntro.tsx
├── map/
│   ├── FollowDriveMap.tsx
│   ├── HeroMap.tsx
│   └── MapRoutes.tsx
├── routes/
│   ├── RouteCarousel.tsx
│   └── StoryHighlights.tsx
├── system/
│   └── ErrorBoundary.tsx
├── transcript/
│   └── TranscriptRibbon.tsx
├── voice/
│   ├── BreathingOrb.tsx
│   ├── ConversationConsole.tsx
│   └── NarrationTimeline.tsx
└── ThemeToggle.tsx
```

### Voice Services (Active)
```
frontend/src/services/voice/
├── openaiWebSocketService.ts (used by useOpenAIVoice hook)
├── voiceOutputService.ts (used by DiscoveryScreen and useInterestVoiceGuide)
└── voiceSessionManager.ts (used by useVoiceConversation)
```

### Hooks (Active)
```
frontend/src/hooks/
├── useAudioMeter.ts
├── useInterestVoiceGuide.ts
├── useVoiceConversation.ts
└── useVoiceInput.ts
```

### Pages (Active)
```
frontend/src/pages/
├── LandingPage.tsx
└── TripPlannerPage.tsx
```

### Stitch Screens (Active)
```
frontend/src/stitch/
├── DiscoveryScreen.tsx
├── NowPlayingScreen.tsx
├── SettingsScreen.tsx
├── TripsScreen.tsx
├── VoiceConversationScreen.tsx
└── WelcomeScreen.tsx
```

## Benefits of Cleanup

1. **Reduced Confusion**: Eliminated duplicate files with different implementations
2. **Clearer Structure**: Organized files into logical directories
3. **Easier Maintenance**: Removed unused code that was cluttering the project
4. **Better Documentation**: Moved guides to proper documentation directory
5. **Preserved History**: All removed files are backed up and can be restored if needed

## Next Steps

1. **Review parked files**: Go through parking directories to see if any files should be restored
2. **Consolidate voice services**: Consider merging similar voice services
3. **Update imports**: Ensure all remaining files have correct import paths
4. **Test functionality**: Verify that all active components still work after cleanup
5. **Document APIs**: Create proper API documentation for the cleaned services

## Files That Can Be Safely Deleted Later

After confirming everything works:
- `backup/duplicates/` - If the kept versions work correctly
- `parking/voice-services/useDemoVoice.ts` - Demo code not needed in production
- `parking/components/LaunchExperience.tsx` - If launch experience is handled elsewhere

## Files to Review for Potential Restoration

- `parking/voice-services/openaiWebSocketServiceWithTokens.ts` - Might be needed for production token handling
- `parking/components/PreferencesPage.tsx` - Might be needed for user preferences UI
- `parking/chatgpt-fixes/` - Contains potentially useful improvements

---

**Cleanup completed on**: $(date)
**Total files moved**: 15+ files
**Directories cleaned**: 6 directories
**Documentation organized**: 4 files moved to docs/
