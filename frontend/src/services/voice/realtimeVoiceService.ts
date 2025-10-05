import { logger } from '../../utils/logger';
import { DEFAULT_PERSONA_ID, NARRATOR_PERSONAS } from '../../../../shared/data/narratorPersonas';

export interface RealtimeVoiceConfig {
  voiceId: 'alloy' | 'echo' | 'shimmer';
  personaId: string;
  instructions?: string;
}

export interface RealtimeVoiceCallbacks {
  onTranscript?: (transcript: string, role: 'user' | 'assistant') => void;
  onAudioChunk?: (audioChunk: ArrayBuffer) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSpeaking?: (isSpeaking: boolean) => void;
}

export class RealtimeVoiceService {
  private ws: WebSocket | null = null;
  private config: RealtimeVoiceConfig | null = null;
  private callbacks: RealtimeVoiceCallbacks = {};
  private isConnected = false;
  private isSpeaking = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionData: {
    session: { ephemeralToken: string; model: string; voice: { id: string } };
  } | null = null;

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);

    // Add event listeners for connection management
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  async connect(
    config: RealtimeVoiceConfig,
    callbacks: RealtimeVoiceCallbacks = {},
  ): Promise<void> {
    this.config = config;
    this.callbacks = callbacks;

    try {
      // Get ephemeral token from backend
      const ephemeralToken = await this.getApiKey();
      if (!ephemeralToken) {
        throw new Error('Failed to obtain ephemeral token. Please check voice settings.');
      }

      // Create WebSocket connection to OpenAI Realtime API with proper subprotocols
      const model = this.sessionData?.model || 'gpt-4o-realtime-preview-2024-10-01';
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      const protocols = [
        'realtime',
        `openai-insecure-api-key.${ephemeralToken}`,
        'openai-beta.realtime-v1',
      ];
      this.ws = new WebSocket(wsUrl, protocols);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      logger.info('RealtimeVoiceService: Connecting to OpenAI Realtime API', {
        voiceId: config.voiceId,
        model,
      });
    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to connect', { error });
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async getApiKey(): Promise<string | null> {
    try {
      // Get voice session from backend instead of direct API key
      const response = await fetch('/api/voice/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.getDeviceId(),
        },
        body: JSON.stringify({
          transport: 'websocket',
          voiceId: this.config?.voiceId,
          personaId: this.config?.personaId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice session request failed: ${response.statusText}`);
      }

      const sessionData = await response.json();

      // Store session data directly
      this.sessionData = sessionData;

      // Return the ephemeral token for WebSocket connection
      return sessionData.ephemeralToken;
    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to get voice session', { error });
      return null;
    }
  }

  private getDeviceId(): string {
    // Generate or retrieve device ID
    let deviceId = localStorage.getItem('drive-narrator-device-id');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('drive-narrator-device-id', deviceId);
    }
    return deviceId;
  }

  private handleOpen(): void {
    logger.info('RealtimeVoiceService: Connected to OpenAI Realtime API');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.callbacks.onConnected?.();

    // Send initial configuration
    this.sendConfiguration();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.processMessage(data);
    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to parse message', { error });
    }
  }

  private processMessage(data: { type: string; delta?: string; [key: string]: unknown }): void {
    switch (data.type) {
      case 'response.audio.delta':
        this.handleAudioChunk(data.delta);
        break;
      case 'response.audio.done':
        this.handleAudioComplete();
        break;
      case 'conversation.item.input.transcript':
        this.handleTranscript(String(data.transcript ?? ''), 'user');
        break;
      case 'conversation.item.output.transcript':
        this.handleTranscript(String(data.transcript ?? ''), 'assistant');
        break;
      case 'conversation.item.output.audio':
        this.handleAudioChunk(data.audio);
        break;
      case 'error':
        this.handleError(new Error(data.error?.message || 'Unknown error'));
        break;
      default:
        logger.debug('RealtimeVoiceService: Unhandled message type', { type: data.type });
    }
  }

  private handleAudioChunk(audioData: string): void {
    try {
      // Convert base64 audio data to ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.callbacks.onAudioChunk?.(bytes.buffer);
    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to process audio chunk', { error });
    }
  }

  private handleAudioComplete(): void {
    this.isSpeaking = false;
    this.callbacks.onSpeaking?.(false);
  }

  private handleTranscript(transcript: string, role: 'user' | 'assistant'): void {
    this.callbacks.onTranscript?.(transcript, role);
  }

  private handleClose(event: CloseEvent): void {
    logger.info('RealtimeVoiceService: Connection closed', {
      code: event.code,
      reason: event.reason,
    });
    this.isConnected = false;
    this.isSpeaking = false;
    this.callbacks.onDisconnected?.();

    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    logger.error('RealtimeVoiceService: WebSocket error', { error });
    this.callbacks.onError?.(new Error('WebSocket connection error'));
  }

  private sendConfiguration(): void {
    if (!this.ws || !this.config || !this.sessionData) return;

    // Get persona-specific VAD profile
    const persona =
      NARRATOR_PERSONAS.find((p) => p.id === this.config?.personaId) ||
      NARRATOR_PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID);

    const vadProfile = persona?.vadProfile || {
      threshold: 0.5,
      prefixPaddingMs: 300,
      silenceDurationMs: 200,
    };

    logger.info('RealtimeVoiceService: Applying persona VAD profile', {
      personaId: this.config?.personaId,
      personaName: persona?.name,
      vocalQuality: persona?.emotional?.vocalQuality,
      energyLevel: persona?.emotional?.energyLevel,
      vadProfile,
    });

    const session = this.sessionData.session;
    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.buildInstructions(),
        voice: session.voice.id,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: vadProfile.threshold,
          prefix_padding_ms: vadProfile.prefixPaddingMs,
          silence_duration_ms: vadProfile.silenceDurationMs,
        },
        tools: [
          {
            type: 'function',
            function: {
              name: 'get_current_location',
              description: 'Get the current location and speed of the vehicle',
              parameters: {
                type: 'object',
                properties: {
                  latitude: { type: 'number', description: 'Current latitude' },
                  longitude: { type: 'number', description: 'Current longitude' },
                  speed: { type: 'number', description: 'Current speed in MPH' },
                  heading: { type: 'number', description: 'Current heading in degrees' },
                },
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'get_nearby_pois',
              description: 'Get nearby points of interest based on current location and interests',
              parameters: {
                type: 'object',
                properties: {
                  latitude: { type: 'number', description: 'Current latitude' },
                  longitude: { type: 'number', description: 'Current longitude' },
                  radius: { type: 'number', description: 'Search radius in miles' },
                  interests: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'User interests',
                  },
                },
              },
            },
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(config));
  }

  private buildInstructions(): string {
    if (!this.config) return '';

    const { personaId, instructions } = this.config;

    // Get persona details from voice presets
    const persona = this.getPersonaDetails(personaId);

    let instructionText = `You are a drive narrator companion. ${persona.description}`;

    if (instructions) {
      instructionText += ` ${instructions}`;
    }

    instructionText += `\n\nYou should speak naturally and conversationally, providing interesting stories and information about points of interest as the user drives. Keep responses concise but engaging.`;

    return instructionText;
  }

  private getPersonaDetails(personaId: string): { description: string } {
    // Fallback persona details for backward compatibility
    // Real personas are now loaded from shared/data/narratorPersonas
    const personas: Record<string, { description: string }> = {
      'aurora-companion': {
        description:
          'You are Aurora, a close friend and road-trip companion who delights in helping notice the beauty of every mile.',
      },
      'daybreak-host': {
        description:
          'You are Daybreak, an energetic radio DJ who brings high energy and enthusiasm to every mile.',
      },
    };

    return personas[personaId] || personas[DEFAULT_PERSONA_ID] || personas['aurora-companion'];
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || !this.isConnected) {
      logger.warn('RealtimeVoiceService: Cannot send audio - not connected');
      return;
    }

    try {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audioData);
      const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
      const base64Audio = btoa(binaryString);

      const message = {
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      };

      this.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to send audio', { error });
    }
  }

  sendText(text: string): void {
    if (!this.ws || !this.isConnected) {
      logger.warn('RealtimeVoiceService: Cannot send text - not connected');
      return;
    }

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  startSpeaking(): void {
    if (!this.ws || !this.isConnected) return;

    const message = {
      type: 'response.audio.create',
      response: {
        modalities: ['audio'],
        instructions: 'Respond with audio only',
      },
    };

    this.ws.send(JSON.stringify(message));
    this.isSpeaking = true;
    this.callbacks.onSpeaking?.(true);
  }

  stopSpeaking(): void {
    if (!this.ws || !this.isConnected) return;

    const message = {
      type: 'response.audio.stop',
    };

    this.ws.send(JSON.stringify(message));
    this.isSpeaking = false;
    this.callbacks.onSpeaking?.(false);
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info('RealtimeVoiceService: Scheduling reconnect', {
      attempt: this.reconnectAttempts,
      delay,
    });

    setTimeout(() => {
      if (this.config) {
        this.connect(this.config, this.callbacks).catch((error) => {
          logger.error('RealtimeVoiceService: Reconnect failed', { error });
        });
      }
    }, delay);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page is hidden, pause connection
      this.pause();
    } else {
      // Page is visible, resume connection
      this.resume();
    }
  }

  private handleOnline(): void {
    logger.info('RealtimeVoiceService: Network online, attempting to reconnect');
    if (this.config && !this.isConnected) {
      this.connect(this.config, this.callbacks).catch((error) => {
        logger.error('RealtimeVoiceService: Reconnect on online failed', { error });
      });
    }
  }

  private handleOffline(): void {
    logger.info('RealtimeVoiceService: Network offline');
    this.disconnect();
  }

  pause(): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({ type: 'session.update', session: { modalities: [] } }));
    }
  }

  resume(): void {
    if (this.ws && this.isConnected) {
      this.ws.send(
        JSON.stringify({ type: 'session.update', session: { modalities: ['text', 'audio'] } }),
      );
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User requested disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.isSpeaking = false;
  }

  destroy(): void {
    this.disconnect();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  getConnectionStatus(): { connected: boolean; speaking: boolean } {
    return {
      connected: this.isConnected,
      speaking: this.isSpeaking,
    };
  }
}

export default RealtimeVoiceService;
