# OpenAI Voice WebSocket Integration

This directory contains examples and implementations for setting up conversational voice sessions with OpenAI using WebSockets in a browser environment, including two-way barge-in capabilities.

## Files Overview

### 1. `voice-websocket-example.html`
A complete standalone HTML example that demonstrates:
- WebSocket connection to OpenAI Realtime API
- Real-time audio capture and playback
- Voice Activity Detection (VAD) for barge-in
- Audio visualization
- Complete UI for testing

### 2. `frontend/src/services/voice/openaiWebSocketService.ts`
A TypeScript service class for direct API key usage (development only):
- Real-time voice conversation handling
- Barge-in detection and interruption
- Audio processing and streaming
- Event-driven architecture

### 3. `frontend/src/services/voice/openaiWebSocketServiceWithTokens.ts`
A production-ready service using ephemeral tokens:
- Server-side token generation
- Automatic token refresh
- Session management
- Enhanced security

### 4. `frontend/src/hooks/useOpenAIVoice.ts`
A React hook for easy integration:
- State management
- Error handling
- Clean API for React components

### 5. `frontend/src/components/voice/OpenAIVoiceChat.tsx`
A complete React component:
- Full UI for voice interaction
- Real-time status display
- Error handling and recovery
- Debug information

### 6. `backend/src/api/routes/voice.ts`
Backend API routes for token management:
- Ephemeral token generation
- Session management
- Security best practices

## Quick Start

### Option 1: Standalone HTML Example

1. Open `voice-websocket-example.html` in a browser
2. Enter your OpenAI API key when prompted
3. Click "Connect" to establish WebSocket connection
4. Click "Start Listening" to begin voice interaction
5. Speak naturally - the AI will respond with voice
6. Interrupt the AI by speaking while it's talking (barge-in)

### Option 2: React Integration

1. Install dependencies:
```bash
npm install openai
```

2. Use the React hook in your component:
```tsx
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
    apiKey: 'your-api-key', // In production, use ephemeral tokens
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

### Option 3: Production Setup with Ephemeral Tokens

1. Set up backend routes (see `backend/src/api/routes/voice.ts`)
2. Use the token-based service:
```tsx
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

## Key Features

### Two-Way Voice Communication
- Real-time audio streaming to and from OpenAI
- Automatic speech-to-text transcription
- Text-to-speech synthesis
- Low-latency audio processing

### Barge-In Capabilities
- Voice Activity Detection (VAD) to detect user speech
- Automatic interruption of AI responses
- Seamless conversation flow
- Configurable sensitivity thresholds

### Audio Processing
- PCM16 audio format (24kHz sample rate)
- Real-time audio conversion
- Echo cancellation and noise suppression
- Audio visualization

### Error Handling
- Connection error recovery
- Token expiration handling
- Microphone permission handling
- Graceful degradation

## Configuration Options

### Voice Settings
```typescript
interface VoiceConfig {
  apiKey?: string;           // OpenAI API key (dev only)
  serverUrl?: string;        // Backend server URL (production)
  model?: string;            // OpenAI model (default: gpt-4o-realtime-preview-2024-12-17)
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;     // System instructions for the AI
  vadThreshold?: number;     // Voice activity detection threshold (0.01)
  silenceDuration?: number;  // Silence duration for VAD (1000ms)
}
```

### Event Handlers
```typescript
interface VoiceEventHandlers {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
  onBargeIn?: () => void;
}
```

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

1. **WebSocket Connection Failed**
   - Check API key validity
   - Verify network connectivity
   - Check CORS settings

2. **Microphone Access Denied**
   - Ensure HTTPS in production
   - Check browser permissions
   - Verify microphone availability

3. **Audio Not Playing**
   - Check browser audio policies
   - Verify audio context state
   - Check for audio format compatibility

4. **Barge-In Not Working**
   - Adjust VAD threshold
   - Check microphone sensitivity
   - Verify audio processing pipeline

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` to see detailed state information and event logs.

## Performance Optimization

1. **Audio Processing**
   - Use appropriate buffer sizes (4096 samples recommended)
   - Implement audio compression for network efficiency
   - Consider Web Workers for heavy processing

2. **Memory Management**
   - Clean up audio contexts and processors
   - Dispose of media streams properly
   - Implement connection pooling

3. **Network Optimization**
   - Use compression for WebSocket messages
   - Implement connection keep-alive
   - Handle network interruptions gracefully

## Examples and Use Cases

- **Voice Assistants**: Interactive voice interfaces
- **Language Learning**: Pronunciation and conversation practice
- **Accessibility**: Voice-controlled applications
- **Customer Service**: Automated voice support
- **Gaming**: Voice commands and interactions

## License

This code is provided as examples for educational and development purposes. Please ensure compliance with OpenAI's usage policies and terms of service.

