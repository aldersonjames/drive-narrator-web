# Voice Settings Page Design for Drive Narrator

## Overview
This document outlines the design and implementation plan for integrating a comprehensive Voice Settings page into the Drive Narrator app. The page will allow users to customize voice preferences, test different voices, and configure audio settings for their driving experience.

**Key Features from OpenAI TTS Integration:**
- **12 OpenAI Voice Options**: Alloy, Echo, Fable, Nova, Onyx, Shimmer, etc.
- **Real-time Voice Testing**: Play/stop previews with custom text
- **Voice Customization**: Speed, pitch, and personality prompts
- **Dual Voice System**: Separate settings for Assistant and Narrator voices
- **Persistent Storage**: Voice preferences saved to user profile
- **Audio Generation**: Live TTS generation using OpenAI API

## Design System Integration

### Color Palette
- **Primary**: `#18a2aa` (teal)
- **Accent**: `#f59e0b` (amber)
- **Background Light**: `#f6f8f8`
- **Background Dark**: `#112021`
- **Text**: `#1f2937` (light), `#f8fafc` (dark)

### Typography
- **Display**: Space Grotesk
- **Serif**: Newsreader
- **Body**: Noto Sans

### Component Styling
- **Cards**: `rounded-xl` with glassmorphism effects
- **Buttons**: Rounded with hover states
- **Toggles**: Custom switch components matching Drive Narrator style
- **Icons**: Material Symbols Outlined

## Page Structure

### 1. Main Voice Settings Page
**File**: `frontend/src/pages/VoiceSettingsPage.tsx`

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header (Back + Title)               │
├─────────────────────────────────────┤
│ Voice Selection Section             │
│ ├─ Assistant Voice Card             │
│ └─ Narrator Voice Card              │
├─────────────────────────────────────┤
│ Voice Customization Section         │
│ ├─ Personality Presets              │
│ ├─ Speed/Pitch Controls             │
│ └─ Custom Prompt Input              │
├─────────────────────────────────────┤
│ Audio Settings Section              │
│ ├─ Volume Control                   │
│ ├─ Speed Control                    │
│ └─ Background Music Toggle          │
├─────────────────────────────────────┤
│ Voice Testing Section               │
│ ├─ Test Input Field                 │
│ ├─ Play/Stop Controls               │
│ └─ Audio Waveform Display           │
└─────────────────────────────────────┘
```

#### Key Features
- **Voice Selection**: Two main voice types (Assistant & Narrator)
- **Voice Preview**: Play/stop buttons for each voice
- **Personality Presets**: Pre-configured voice personalities
- **Custom Controls**: Speed, pitch, and custom prompts
- **Audio Settings**: Volume, speed, background music
- **Testing Interface**: Real-time voice testing with waveform

### 2. Voice Selection Components

#### Voice Card Component
**File**: `frontend/src/components/voice/VoiceCard.tsx`

```tsx
interface VoiceCardProps {
  title: string;
  description: string;
  selectedVoice: VoiceDefinition | null;
  onVoiceChange: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
  isPreviewing: boolean;
  voices: VoiceDefinition[];
  disabled?: boolean;
}
```

#### Voice Definition Type
**File**: `frontend/src/types/voice.ts`

```tsx
interface VoiceDefinition {
  voiceId: string;
  displayName: string;
  provider: 'openai' | 'elevenlabs' | 'azure';
  locale: string;
  styleTags: string[];
  sampleUrl?: string;
  isAvailable: boolean;
}
```

### 3. Voice Customization Components

#### Personality Preset Selector
**File**: `frontend/src/components/voice/PersonalityPresetSelector.tsx`

```tsx
interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  voiceSettings: {
    speed: number;
    pitch: number;
    prompt: string;
  };
  icon: string;
}
```

#### Voice Controls
**File**: `frontend/src/components/voice/VoiceControls.tsx`

- Speed slider (0.5x - 2.0x)
- Pitch slider (-50% to +50%)
- Custom prompt textarea
- Reset to defaults button

### 4. Audio Settings Components

#### Audio Settings Panel
**File**: `frontend/src/components/voice/AudioSettingsPanel.tsx`

```tsx
interface AudioSettings {
  volume: number;
  speed: number;
  backgroundMusic: boolean;
  autoPlay: boolean;
}
```

### 5. Voice Testing Components

#### Voice Tester
**File**: `frontend/src/components/voice/VoiceTester.tsx`

```tsx
interface VoiceTesterProps {
  selectedVoice: VoiceDefinition;
  customPrompt?: string;
  onTestComplete: (audioBlob: Blob) => void;
}
```

#### Audio Waveform Display
**File**: `frontend/src/components/voice/AudioWaveform.tsx`

- Real-time waveform visualization
- Play/pause controls
- Progress indicator
- Download test audio

## File Structure

### New Files to Create

```
frontend/src/
├── pages/
│   └── VoiceSettingsPage.tsx          # Main voice settings page
├── components/
│   └── voice/
│       ├── VoiceCard.tsx              # Voice selection card
│       ├── VoiceControls.tsx          # Speed/pitch controls
│       ├── PersonalityPresetSelector.tsx # Personality presets
│       ├── AudioSettingsPanel.tsx     # Audio settings
│       ├── VoiceTester.tsx            # Voice testing interface
│       ├── AudioWaveform.tsx          # Waveform visualization
│       └── VoicePreviewButton.tsx     # Play/stop preview button
├── hooks/
│   ├── useVoicePreview.ts             # Voice preview logic
│   ├── useVoiceSettings.ts            # Voice settings management
│   └── useAudioRecorder.ts            # Audio recording for tests
├── services/
│   └── voice/
│       ├── voiceApi.ts                # Voice API calls
│       ├── voiceStorage.ts            # Local voice settings storage
│       └── voicePreview.ts            # Voice preview generation
├── types/
│   └── voice.ts                       # Voice-related type definitions
└── data/
    └── voicePresets.ts                # Predefined voice personalities
```

### Updated Files

```
frontend/src/
├── App.tsx                            # Add VoiceSettings route
├── components/
│   └── stitch/
│       └── SettingsScreen.tsx         # Add Voice Settings link
└── context/
    └── VoiceSettingsContext.tsx       # Voice settings state management
```

## Page Sections Detail

### 1. Voice Selection Section

#### Assistant Voice Card
- **Purpose**: Voice for UI interactions and conversations
- **Features**:
  - Dropdown with available voices
  - Preview button with play/stop states
  - Voice metadata display (provider, locale, style tags)
  - Loading states and error handling

#### Narrator Voice Card
- **Purpose**: Voice for driving narration and storytelling
- **Features**:
  - Separate voice selection from assistant
  - Enhanced preview with sample text
  - Voice personality indicators
  - Save/cancel functionality

### 2. Voice Customization Section

#### Personality Presets
- **Adventure Seeker**: Energetic, curious, excited about discoveries
- **Local Expert**: Knowledgeable, friendly, insider tips
- **Storyteller**: Dramatic, engaging, narrative-driven
- **Minimalist**: Clear, concise, no-nonsense
- **Custom**: User-defined personality settings

#### Voice Controls
- **Speed Control**: 0.5x to 2.0x with 0.1x increments
- **Pitch Control**: -50% to +50% with 5% increments
- **Custom Prompt**: Rich text editor for personality instructions
- **Reset Button**: Restore default settings

### 3. Audio Settings Section

#### Volume Control
- **Master Volume**: 0-100% with visual indicator
- **Voice Volume**: Separate from background music
- **Background Music**: Toggle with volume control

#### Playback Settings
- **Auto-play**: Automatically start narration
- **Pause on Phone**: Pause when receiving calls
- **Speed Adjustment**: Global speed multiplier

### 4. Voice Testing Section

#### Test Interface
- **Input Field**: Text area for testing different content
- **Voice Selector**: Quick voice switching for comparison
- **Play Controls**: Play, pause, stop, restart
- **Progress Bar**: Visual feedback during playback

#### Audio Visualization
- **Waveform Display**: Real-time audio visualization
- **Frequency Analysis**: Visual representation of voice characteristics
- **Download Option**: Save test audio for later reference

#### Voice Testing Features (from OpenAI TTS)
- **Live Audio Generation**: Real-time TTS using OpenAI API
- **Custom Test Text**: Pre-filled with sample driving scenarios
- **Voice Comparison**: Side-by-side testing of different voices
- **Audio Quality**: High-quality 24kHz audio output
- **Error Handling**: Graceful fallback for API failures
- **Loading States**: Visual feedback during audio generation

## Navigation Integration

### Settings Screen Update
Add Voice Settings link to existing settings:

```tsx
<NavLink
  to="/voice-settings"
  className="flex w-full items-center justify-between gap-4 px-4 py-3"
>
  <div className="flex items-center gap-3">
    <span className="material-symbols-outlined text-primary">record_voice_over</span>
    <span className="font-medium text-gray-900 dark:text-white">Voice Settings</span>
  </div>
  <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
    chevron_right
  </span>
</NavLink>
```

### Routing
```tsx
// In App.tsx
<Route path="/voice-settings" element={<VoiceSettingsPage />} />
```

## State Management

### Voice Settings Context
```tsx
interface VoiceSettingsState {
  assistantVoice: VoiceDefinition | null;
  narratorVoice: VoiceDefinition | null;
  personalityPreset: string;
  customPrompt: string;
  audioSettings: AudioSettings;
  isPreviewing: boolean;
  previewVoiceId: string | null;
  availableVoices: VoiceDefinition[];
  isLoading: boolean;
  error: string | null;
}

interface VoiceDefinition {
  voiceId: string;
  displayName: string;
  provider: 'openai' | 'elevenlabs' | 'azure';
  locale: string;
  styleTags: string[];
  sampleUrl?: string;
  isAvailable: boolean;
  // OpenAI specific
  openaiVoiceId: string; // 'alloy', 'echo', 'fable', etc.
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'middle' | 'mature';
}
```

### Actions
- `setAssistantVoice(voice: VoiceDefinition)`
- `setNarratorVoice(voice: VoiceDefinition)`
- `setPersonalityPreset(presetId: string)`
- `updateAudioSettings(settings: Partial<AudioSettings>)`
- `previewVoice(voiceId: string, text: string)`
- `saveSettings()`
- `resetToDefaults()`
- `loadVoices()` - Load available voices from API
- `testVoice(voiceId: string, text: string)` - Generate test audio

## Voice Storage & Persistence

### Local Storage
```typescript
interface StoredVoiceSettings {
  assistantVoiceId: string;
  narratorVoiceId: string;
  personalityPreset: string;
  customPrompt: string;
  audioSettings: AudioSettings;
  lastUpdated: string;
  version: string;
}
```

### Backend Storage
- **User Profile**: Voice preferences stored in user's profile
- **Sync Across Devices**: Settings sync when user logs in
- **Backup/Restore**: Voice settings included in data export
- **Version Control**: Track settings changes over time

### Voice Cache
- **Audio Samples**: Cached locally for quick previews
- **Voice Metadata**: Cached for offline access
- **TTL**: 24 hours for voice samples, 7 days for metadata
- **Storage Limit**: 50MB max for voice cache

## OpenAI TTS Integration

### Available OpenAI Voices
```typescript
const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral', age: 'young', style: 'conversational' },
  { id: 'echo', name: 'Echo', gender: 'male', age: 'middle', style: 'authoritative' },
  { id: 'fable', name: 'Fable', gender: 'male', age: 'mature', style: 'storytelling' },
  { id: 'nova', name: 'Nova', gender: 'female', age: 'young', style: 'energetic' },
  { id: 'onyx', name: 'Onyx', gender: 'male', age: 'mature', style: 'deep' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', age: 'young', style: 'bright' }
];
```

### Voice Testing Implementation
```typescript
// Voice preview generation using OpenAI TTS
const generateVoicePreview = async (voiceId: string, text: string) => {
  const response = await fetch('/api/voices/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      voice: voiceId,
      input: text,
      model: 'tts-1',
      response_format: 'mp3'
    })
  });
  
  if (!response.ok) throw new Error('Voice generation failed');
  return response.blob();
};
```

### Voice Settings Storage
```typescript
// Save voice preferences to user profile
const saveVoiceSettings = async (settings: VoiceSettings) => {
  await fetch('/api/user/voice-settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assistantVoiceId: settings.assistantVoice?.voiceId,
      narratorVoiceId: settings.narratorVoice?.voiceId,
      personalityPreset: settings.personalityPreset,
      customPrompt: settings.customPrompt,
      audioSettings: settings.audioSettings,
      lastUpdated: new Date().toISOString()
    })
  });
};
```

## API Integration

### Voice API Endpoints
```typescript
// GET /api/voices - Get available voices
interface GetVoicesResponse {
  voices: VoiceDefinition[];
  total: number;
}

// POST /api/voices/preview - Generate voice preview
interface PreviewVoiceRequest {
  voiceId: string;
  text: string;
  settings?: VoiceSettings;
}

// POST /api/voices/settings - Save voice settings
interface SaveVoiceSettingsRequest {
  assistantVoiceId: string;
  narratorVoiceId: string;
  personalityPreset: string;
  customPrompt: string;
  audioSettings: AudioSettings;
}

// GET /api/user/voice-settings - Get user's voice preferences
interface GetVoiceSettingsResponse {
  assistantVoice: VoiceDefinition;
  narratorVoice: VoiceDefinition;
  personalityPreset: string;
  customPrompt: string;
  audioSettings: AudioSettings;
  lastUpdated: string;
}
```

## Mobile Responsiveness

### Breakpoints
- **Mobile**: Single column, full-width cards
- **Tablet**: Two-column layout for voice cards
- **Desktop**: Three-column layout with sidebar

### Touch Interactions
- **Swipe Gestures**: Swipe between voice options
- **Haptic Feedback**: Vibration on voice preview
- **Touch Targets**: Minimum 44px touch targets
- **Safe Areas**: Proper handling of iPhone notches

## Accessibility

### ARIA Labels
- All interactive elements have proper ARIA labels
- Voice cards are announced as "Voice option: [name]"
- Preview buttons indicate current state (playing/stopped)

### Keyboard Navigation
- Tab order follows logical flow
- Space/Enter to activate preview buttons
- Arrow keys for slider controls
- Escape to close modals/overlays

### Screen Reader Support
- Voice metadata is properly announced
- Audio controls have descriptive labels
- Progress indicators are announced
- Error states are clearly communicated

## Performance Considerations

### Lazy Loading
- Voice previews are generated on-demand
- Audio samples are cached locally
- Large voice lists are virtualized

### Caching Strategy
- Voice settings cached in localStorage
- Audio previews cached with TTL
- Voice metadata cached for 24 hours

### Bundle Optimization
- Voice components are code-split
- Audio processing libraries are dynamic imports
- Voice samples are loaded progressively

## Testing Strategy

### Unit Tests
- Voice selection logic
- Settings persistence
- Audio preview generation
- Error handling

### Integration Tests
- Voice API integration
- Settings synchronization
- Audio playback functionality
- Mobile responsiveness

### E2E Tests
- Complete voice setup flow
- Voice preview functionality
- Settings persistence across sessions
- Mobile device testing

## Implementation Phases

### Phase 1: Core Structure
1. Create basic page layout
2. Implement voice selection cards
3. Add basic voice preview functionality
4. Integrate with existing settings navigation

### Phase 2: Voice Customization
1. Add personality presets
2. Implement voice controls (speed/pitch)
3. Add custom prompt functionality
4. Create voice testing interface

### Phase 3: Audio Settings
1. Implement audio settings panel
2. Add volume and speed controls
3. Integrate background music toggle
4. Add audio visualization

### Phase 4: Polish & Optimization
1. Add animations and transitions
2. Implement proper error handling
3. Add accessibility features
4. Performance optimization

## Success Metrics

### User Engagement
- Time spent on voice settings page
- Number of voice previews played
- Settings changes made per session
- Voice customization completion rate

### Technical Performance
- Page load time < 2 seconds
- Voice preview generation < 3 seconds
- Settings save time < 1 second
- Audio playback latency < 500ms

### User Satisfaction
- Voice settings completion rate > 80%
- User preference retention > 90%
- Voice preview usage > 60%
- Overall settings page satisfaction > 4.5/5

This design provides a comprehensive, user-friendly voice settings experience that seamlessly integrates with the Drive Narrator app's existing design system while offering powerful voice customization capabilities.
