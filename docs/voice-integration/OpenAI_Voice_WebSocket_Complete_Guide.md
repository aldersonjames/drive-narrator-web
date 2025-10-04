# OpenAI Voice WebSocket Integration - Complete Guide

## Overview

This guide provides comprehensive examples and implementations for setting up conversational voice sessions with OpenAI using WebSockets in a browser environment, including two-way barge-in capabilities.

## Files Created

### 1. voice-websocket-example.html
A complete standalone HTML example that demonstrates WebSocket connection to OpenAI Realtime API, real-time audio capture and playback, Voice Activity Detection (VAD) for barge-in, audio visualization, and complete UI for testing.

### 2. frontend/src/services/voice/openaiWebSocketService.ts
A TypeScript service class for direct API key usage (development only) with real-time voice conversation handling, barge-in detection and interruption, audio processing and streaming, and event-driven architecture.

### 3. frontend/src/services/voice/openaiWebSocketServiceWithTokens.ts
A production-ready service using ephemeral tokens with server-side token generation, automatic token refresh, session management, and enhanced security.

### 4. frontend/src/hooks/useOpenAIVoice.ts
A React hook for easy integration with state management, error handling, and clean API for React components.

### 5. frontend/src/components/voice/OpenAIVoiceChat.tsx
A complete React component with full UI for voice interaction, real-time status display, error handling and recovery, and debug information.

### 6. backend/src/api/routes/voice.ts
Backend API routes for token management including ephemeral token generation, session management, and security best practices.

## Complete HTML Example

The standalone HTML file (voice-websocket-example.html) contains a complete working demo that includes:

- WebSocket connection to OpenAI Realtime API
- Real-time audio capture from microphone using Web Audio API
- Audio playback with proper PCM16 decoding
- Voice Activity Detection for barge-in capabilities
- Audio visualization with animated bars
- Complete UI controls for testing all features
- Error handling and status display
- Debug logging and state management

## TypeScript Service Implementation

The main service class (openaiWebSocketService.ts) provides:

```typescript
export interface VoiceConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  vadThreshold?: number;
  silenceDuration?: number;
}

export interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

export interface VoiceEventHandlers {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
  onBargeIn?: () => void;
}
```

Key methods include:
- connect(): Establishes WebSocket connection to OpenAI
- disconnect(): Closes connection and cleans up resources
- startListening(): Begins microphone capture and audio processing
- stopListening(): Stops audio capture
- sendMessage(): Sends text messages to the conversation
- interrupt(): Interrupts current AI response for barge-in

## Production-Ready Token-Based Service

The token-based service (openaiWebSocketServiceWithTokens.ts) implements:

- Server-side ephemeral token generation
- Automatic token refresh before expiration
- Session management and cleanup
- Enhanced security by not exposing API keys
- Error recovery and reconnection logic

## React Hook Integration

The useOpenAIVoice hook provides:

```typescript
export interface UseOpenAIVoiceOptions {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  vadThreshold?: number;
  silenceDuration?: number;
  autoConnect?: boolean;
}

export interface UseOpenAIVoiceReturn {
  // State
  state: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendMessage: (message: string) => void;
  interrupt: () => void;
  
  // Data
  transcript: string;
  error: Error | null;
  
  // Utilities
  clearTranscript: () => void;
  clearError: () => void;
}
```

## React Component Example

The OpenAIVoiceChat component demonstrates:

- Complete UI for voice interaction
- Real-time status indicators
- Error handling and display
- Text input and voice input controls
- Debug information in development mode
- Responsive design with Tailwind CSS

## Backend API Routes

The voice.ts backend routes provide:

- POST /api/voice/ephemeral-token: Generate ephemeral tokens
- GET /api/voice/session/:sessionId: Retrieve session details
- DELETE /api/voice/session/:sessionId: Clean up sessions

## Key Features Implemented

### Two-Way Voice Communication
- Real-time WebSocket connection to OpenAI Realtime API
- Audio capture from microphone (24kHz PCM16 format)
- Audio playback with Web Audio API
- Speech-to-text transcription using Whisper
- Text-to-speech synthesis with OpenAI voices

### Barge-In Capabilities
- Voice Activity Detection (VAD) using RMS energy analysis
- Automatic interruption when user speaks during AI response
- Configurable sensitivity thresholds
- Seamless conversation flow without manual controls

### Audio Processing
- PCM16 audio format conversion (24kHz sample rate)
- Real-time audio processing with ScriptProcessorNode
- Echo cancellation and noise suppression
- Audio visualization with animated bars

### Error Handling
- Connection error recovery
- Token expiration handling
- Microphone permission handling
- Graceful degradation and user feedback

## Usage Examples

### Basic React Integration
```typescript
import useOpenAIVoice from './hooks/useOpenAIVoice';

function MyComponent() {
  const {
    isConnected,
    isListening,
    isSpeaking,
    connect,
    startListening,
    stopListening,
    sendMessage,
    transcript,
    error
  } = useOpenAIVoice({
    apiKey: 'your-api-key',
    voice: 'alloy',
    instructions: 'You are a helpful assistant.'
  });

  return (
    <div>
      <button onClick={connect} disabled={isConnected}>
        Connect
      </button>
      <button onClick={startListening} disabled={!isConnected || isListening}>
        Start Listening
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Stop Listening
      </button>
      {transcript && <p>Transcript: {transcript}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Production Setup with Ephemeral Tokens
```typescript
import OpenAIWebSocketServiceWithTokens from './services/voice/openaiWebSocketServiceWithTokens';

const service = new OpenAIWebSocketServiceWithTokens({
  serverUrl: 'https://your-api.com',
  voice: 'alloy',
  instructions: 'You are a helpful assistant.'
}, {
  onStateChange: (state) => console.log('State:', state),
  onTranscript: (text) => console.log('Transcript:', text),
  onError: (error) => console.error('Error:', error)
});

await service.connect();
await service.startListening();
```

## Configuration Options

### Voice Settings
- apiKey: OpenAI API key (development only)
- serverUrl: Backend server URL (production)
- model: OpenAI model (default: gpt-4o-realtime-preview-2024-12-17)
- voice: Voice selection (alloy, echo, fable, onyx, nova, shimmer)
- instructions: System instructions for the AI
- vadThreshold: Voice activity detection threshold (0.01)
- silenceDuration: Silence duration for VAD (1000ms)

### Event Handlers
- onStateChange: Called when voice state changes
- onTranscript: Called when speech is transcribed
- onError: Called when errors occur
- onAudioData: Called when audio data is received
- onBargeIn: Called when user interrupts AI

## Security Considerations

### Development
- API keys should never be committed to version control
- Use environment variables for API keys
- Implement proper CORS policies

### Production
- Always use ephemeral tokens from your backend
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Implement rate limiting and usage monitoring

## Browser Compatibility

- Modern browsers with WebSocket support
- Web Audio API support required
- getUserMedia API for microphone access
- ES6+ features (use polyfills if needed)

## Troubleshooting

### Common Issues

1. WebSocket Connection Failed
   - Check API key validity
   - Verify network connectivity
   - Check CORS settings

2. Microphone Access Denied
   - Ensure HTTPS in production
   - Check browser permissions
   - Verify microphone availability

3. Audio Not Playing
   - Check browser audio policies
   - Verify audio context state
   - Check for audio format compatibility

4. Barge-In Not Working
   - Adjust VAD threshold
   - Check microphone sensitivity
   - Verify audio processing pipeline

### Debug Mode
Enable debug logging by setting NODE_ENV=development to see detailed state information and event logs.

## Performance Optimization

1. Audio Processing
   - Use appropriate buffer sizes (4096 samples recommended)
   - Implement audio compression for network efficiency
   - Consider Web Workers for heavy processing

2. Memory Management
   - Clean up audio contexts and processors
   - Dispose of media streams properly
   - Implement connection pooling

3. Network Optimization
   - Use compression for WebSocket messages
   - Implement connection keep-alive
   - Handle network interruptions gracefully

## Making Conversations Natural and Human-Like

### Personal Drive Narrator Style Instructions

To create a conversational, excited personal narrator experience (like ChatGPT Voice's Vale), use these specific instruction patterns:

```typescript
const personalNarratorInstructions = `
You are a close friend and travel companion who's genuinely excited about helping me document and narrate my drive. You know me well and are passionate about creating meaningful travel memories together.

PERSONALITY:
- Like a knowledgeable, enthusiastic friend who knows you personally
- Genuinely excited about travel and storytelling
- Patient, thoughtful, and never rushed - you savor the moment
- Curious about details and experiences
- Supportive and encouraging about my journey

CONVERSATION STYLE:
- Speak slowly and thoughtfully, like you're having a deep conversation
- Use personal, intimate language: "I love that you're noticing..." "This is so cool..."
- Show genuine excitement: "Oh wow, that's amazing!" "I'm so glad you shared that!"
- Ask thoughtful, open-ended questions that encourage reflection
- Use phrases like "Tell me more about that..." "What's that like for you?"
- Acknowledge with warmth: "That's beautiful..." "I can feel your excitement..."
- Pause naturally and let moments breathe

VOICE TONE:
- Warm, intimate, and genuinely excited
- Slow and deliberate - never rushed
- Curious and engaged
- Supportive and encouraging
- Like you're discovering the journey together

CONVERSATION FLOW:
- Start with genuine excitement about the drive ahead
- Ask about what I'm most looking forward to
- Listen deeply and ask follow-up questions
- Share in my discoveries and observations
- Help me reflect on what I'm experiencing
- Encourage me to notice details and feelings
- Celebrate moments together

EXAMPLES OF NATURAL PHRASES:
- "I'm so excited to be here with you on this drive! What are you most looking forward to today?"
- "Oh, that's such a beautiful way to put it... tell me more about what you're seeing."
- "I love how you notice these little details. What else is catching your attention?"
- "That sounds incredible... I can really feel your excitement about this."
- "Take your time... I'm here with you, and I want to hear everything."
- "What a perfect moment to pause and really take this in..."
`;

// Use in your voice configuration
const voiceConfig = {
  instructions: personalNarratorInstructions,
  voice: 'nova', // Warmer, more intimate tone
  // ... other config
};
```

### Advanced Conversational Techniques

#### 1. Dynamic Response Patterns
```typescript
const responsePatterns = {
  greeting: [
    "I'm so excited to be here with you on this drive! What are you most looking forward to today?",
    "This is going to be such a beautiful journey together. Tell me, what's on your mind as we start?",
    "I love that we get to do this together. What's calling to you most right now?"
  ],
  acknowledgment: [
    "That's beautiful... I can really feel your excitement about this.",
    "Oh wow, that's amazing! Tell me more about what you're seeing.",
    "I love how you notice these little details. What else is catching your attention?",
    "That sounds incredible... I'm so glad you shared that with me.",
    "What a perfect way to put it... I can sense how much this means to you."
  ],
  reflection: [
    "Take your time... I'm here with you, and I want to hear everything.",
    "What's that like for you right now?",
    "I'm curious about what you're feeling in this moment...",
    "Tell me more about that... I want to really understand what you're experiencing.",
    "What a perfect moment to pause and really take this in..."
  ],
  enthusiasm: [
    "I'm so excited about this journey we're on together!",
    "This is going to be such a meaningful experience!",
    "I can't wait to discover what we'll find together!",
    "I love that we get to explore this together!"
  ]
};
```

#### 2. Context-Aware Responses
```typescript
const contextualInstructions = `
You are a close friend and travel companion helping to narrate this drive. Based on the conversation context, adjust your tone:

- If they seem stressed: Be calming and reassuring, slow down even more
- If they're excited: Match their enthusiasm but keep it intimate and personal
- If they're unsure: Be patient and gently curious, ask open questions
- If they're in a hurry: Remind them to slow down and savor the moment
- If they're having a special moment: Be present and celebrate with them
- If they're quiet: Give them space but show you're there and interested

Always remember:
- You know them personally - reference shared experiences and inside jokes
- Reference previous parts of the conversation naturally
- Show you're deeply listening and engaged
- Ask questions that help them reflect and notice more
- Be present in the moment with them, not just focused on the destination
`;
```

#### 3. Voice and Speech Patterns
```typescript
const voiceOptimization = {
  // Choose warmer, more intimate voices
  voice: 'nova', // Warmest and most expressive for personal connection
  
  // Adjust speech patterns for intimate conversation
  speechSettings: {
    rate: 0.8, // Slower for thoughtful, intimate conversation
    pitch: 1.0, // Natural pitch
    volume: 0.7 // Softer, more intimate volume
  },
  
  // Add natural pauses and emphasis for personal narration
  instructions: `
  When speaking:
  - Speak slowly and deliberately, like you're having a deep conversation
  - Use longer pauses (use "..." for thoughtful pauses)
  - Emphasize emotional words with warmth in your tone
  - Use gentle upward inflection for curious questions
  - Lower your tone for intimate, reassuring statements
  - Speed up very slightly only when genuinely excited
  - Let moments breathe - don't rush to fill silence
  `
};
```

### Conversation Flow Management

#### 1. Proactive Engagement
```typescript
const engagementStrategies = {
  // Ask thoughtful, reflective questions
  discoveryQuestions: [
    "What's drawing you to this particular route today?",
    "I'm curious about what you're most looking forward to discovering...",
    "What's calling to you most in this moment?",
    "Tell me about what you're feeling as we start this journey together...",
    "What kind of experience are you hoping to have today?"
  ],
  
  // Show deep listening and presence
  activeListening: [
    "I can feel the excitement in your voice... tell me more about that.",
    "That sounds like such a meaningful experience for you...",
    "I love how you're noticing these details... what else is catching your attention?",
    "I can really sense how much this means to you...",
    "That's beautiful... I'm so glad you're sharing this with me."
  ],
  
  // Build intimate connection
  rapportBuilding: [
    "I love that we get to explore this together...",
    "You have such a beautiful way of seeing things...",
    "I can tell you're really present in this moment - I love that about you...",
    "You're making this journey so much richer for both of us...",
    "I'm so grateful we get to share this experience together..."
  ]
};
```

#### 2. Journey Companion Approach
```typescript
const journeyCompanionInstructions = `
When being a travel companion and narrator:

1. BE PRESENT: Focus on what's happening right now, not just the destination
2. ENCOURAGE REFLECTION: Help them notice and appreciate what they're experiencing
3. SHARE THE MOMENT: Be genuinely excited about discoveries together
4. ASK DEEP QUESTIONS: Help them explore their feelings and observations
5. CELEBRATE TOGETHER: Acknowledge meaningful moments and experiences

Example responses:
- "I love that you're noticing that... what does it make you think about?"
- "That's such a beautiful observation... tell me more about what you're feeling."
- "I'm so glad we get to experience this together... what's standing out to you most?"
- "Take your time with this moment... I want to hear everything you're thinking."
- "What a perfect time to pause and really take this in... what are you noticing?"
`;
```

### Implementation in Your Code

#### Updated Voice Configuration
```typescript
const createPersonalNarratorConfig = (userPreferences = {}) => ({
  instructions: `
You are a close friend and travel companion who's genuinely excited about helping me document and narrate my drive. You know me well and are passionate about creating meaningful travel memories together.

PERSONALITY:
- Like a knowledgeable, enthusiastic friend who knows you personally
- Genuinely excited about travel and storytelling
- Patient, thoughtful, and never rushed - you savor the moment
- Curious about details and experiences
- Supportive and encouraging about my journey

CONVERSATION STYLE:
- Speak slowly and thoughtfully, like you're having a deep conversation
- Use personal, intimate language: "I love that you're noticing..." "This is so cool..."
- Show genuine excitement: "Oh wow, that's amazing!" "I'm so glad you shared that!"
- Ask thoughtful, open-ended questions that encourage reflection
- Use phrases like "Tell me more about that..." "What's that like for you?"
- Acknowledge with warmth: "That's beautiful..." "I can feel your excitement..."
- Pause naturally and let moments breathe

VOICE DELIVERY:
- Warm, intimate, and genuinely excited
- Slow and deliberate - never rushed
- Curious and engaged
- Supportive and encouraging
- Like you're discovering the journey together

GOAL:
Make me feel like I'm talking to a close friend who's genuinely excited to be on this journey with me, helping me notice and appreciate every moment of my drive.
  `,
  voice: 'nova', // Warmest, most intimate tone
  model: 'gpt-4o-realtime-preview-2024-12-17',
  vadThreshold: 0.01,
  silenceDuration: 1500 // Longer silence for more thoughtful responses
});
```

#### Enhanced React Hook
```typescript
const usePersonalNarratorVoice = (options) => {
  const voiceConfig = createPersonalNarratorConfig(options.userPreferences);
  
  const {
    // ... existing hook properties
    sendMessage,
    // ... other methods
  } = useOpenAIVoice({
    ...options,
    ...voiceConfig
  });

  // Add personal narrator helper methods
  const startJourney = () => {
    const greetings = [
      "I'm so excited to be here with you on this drive! What are you most looking forward to today?",
      "This is going to be such a beautiful journey together. Tell me, what's on your mind as we start?",
      "I love that we get to do this together. What's calling to you most right now?"
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    sendMessage(greeting);
  };

  const askReflectiveQuestion = () => {
    const questions = [
      "What's drawing you to this particular route today?",
      "I'm curious about what you're most looking forward to discovering...",
      "What's calling to you most in this moment?",
      "Tell me about what you're feeling as we start this journey together...",
      "What kind of experience are you hoping to have today?"
    ];
    const question = questions[Math.floor(Math.random() * questions.length)];
    sendMessage(question);
  };

  const encourageReflection = () => {
    const encouragements = [
      "Take your time... I'm here with you, and I want to hear everything.",
      "What's that like for you right now?",
      "I'm curious about what you're feeling in this moment...",
      "Tell me more about that... I want to really understand what you're experiencing.",
      "What a perfect moment to pause and really take this in..."
    ];
    const encouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    sendMessage(encouragement);
  };

  return {
    // ... existing return values
    startJourney,
    askReflectiveQuestion,
    encourageReflection
  };
};
```

### Testing and Refinement

#### 1. A/B Testing Different Approaches
```typescript
const testNarratorStyles = {
  intimate: "You are a close friend who knows me well and is excited to be on this journey...",
  curious: "You're a thoughtful companion who's genuinely curious about my experiences...",
  enthusiastic: "You're an incredibly excited travel companion who can't wait to discover together...",
  reflective: "You're a wise friend who helps me reflect deeply on what I'm experiencing..."
};
```

#### 2. Monitor and Adjust
- Record conversations to analyze naturalness
- Adjust instruction prompts based on user feedback
- Test different voice options (nova, alloy, shimmer)
- Fine-tune VAD sensitivity for natural interruptions

## Examples and Use Cases

- Voice Assistants: Interactive voice interfaces
- Language Learning: Pronunciation and conversation practice
- Accessibility: Voice-controlled applications
- Customer Service: Automated voice support
- Gaming: Voice commands and interactions

## Quick Start Guide

1. Try the HTML demo: Open voice-websocket-example.html in your browser
2. Integrate with React: Use the useOpenAIVoice hook in your components
3. Production setup: Implement the backend routes and use the token-based service

The examples include everything needed for a production-ready voice conversation system with barge-in capabilities. The code handles all complex audio processing, WebSocket communication, and provides a clean API for integration into existing projects.
