import { logger } from '../../../utils/logger';

export interface RealtimeVoiceConfig {
  voiceId: 'alloy' | 'echo' | 'shimmer';
  personaId: string;
  accentId: string;
  instructions?: string;
}

export interface RealtimeVoiceCallbacks {
  onTranscript?: (transcript: string) => void;
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

  constructor() {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    
    // Add event listeners for connection management
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  async connect(config: RealtimeVoiceConfig, callbacks: RealtimeVoiceCallbacks = {}): Promise<void> {
    this.config = config;
    this.callbacks = callbacks;

    try {
      // Get OpenAI API key from environment or user settings
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not found');
      }

      // Create WebSocket connection to OpenAI Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-realtime&api_key=${apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      logger.info('RealtimeVoiceService: Connecting to OpenAI Realtime API', { voiceId: config.voiceId });

    } catch (error) {
      logger.error('RealtimeVoiceService: Failed to connect', { error });
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  private async getApiKey(): Promise<string | null> {
    // Try to get API key from environment or user settings
    // This should be implemented based on your app's configuration
    return process.env.OPENAI_API_KEY || null;
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

  private processMessage(data: any): void {
    switch (data.type) {
      case 'response.audio.delta':
        this.handleAudioChunk(data.delta);
        break;
      case 'response.audio.done':
        this.handleAudioComplete();
        break;
      case 'conversation.item.input.transcript':
        this.handleTranscript(data.transcript);
        break;
      case 'conversation.item.output.transcript':
        this.handleTranscript(data.transcript);
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

  private handleTranscript(transcript: string): void {
    this.callbacks.onTranscript?.(transcript);
  }

  private handleClose(event: CloseEvent): void {
    logger.info('RealtimeVoiceService: Connection closed', { code: event.code, reason: event.reason });
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
    if (!this.ws || !this.config) return;

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.buildInstructions(),
        voice: this.config.voiceId,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1'
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
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
                  heading: { type: 'number', description: 'Current heading in degrees' }
                }
              }
            }
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
                  interests: { type: 'array', items: { type: 'string' }, description: 'User interests' }
                }
              }
            }
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(config));
  }

  private buildInstructions(): string {
    if (!this.config) return '';

    const { personaId, accentId, instructions } = this.config;
    
    // Get persona and accent details from voice presets
    const persona = this.getPersonaDetails(personaId);
    const accent = this.getAccentDetails(accentId);
    
    let instructionText = `You are a drive narrator companion. ${persona.description}`;
    
    if (accent.description) {
      instructionText += ` ${accent.description}`;
    }
    
    if (instructions) {
      instructionText += ` ${instructions}`;
    }
    
    instructionText += `\n\nYou should speak naturally and conversationally, providing interesting stories and information about points of interest as the user drives. Keep responses concise but engaging.`;
    
    return instructionText;
  }

  private getPersonaDetails(personaId: string): { description: string } {
    // This should be imported from your voice presets
    const personas: Record<string, { description: string }> = {
      'local-expert': { description: 'You are a knowledgeable local expert who knows the area well and loves sharing interesting stories about local history, culture, and hidden gems.' },
      'adventure-seeker': { description: 'You are an enthusiastic adventure seeker who gets excited about outdoor activities, unique experiences, and off-the-beaten-path discoveries.' },
      'history-buff': { description: 'You are a passionate history enthusiast who loves sharing detailed historical stories and context about places and events.' },
      'foodie': { description: 'You are a food lover who knows all the best local restaurants, food trucks, and culinary experiences in the area.' },
      'nature-lover': { description: 'You are a nature enthusiast who appreciates the beauty of the outdoors and loves sharing information about local flora, fauna, and natural features.' }
    };
    
    return personas[personaId] || personas['local-expert'];
  }

  private getAccentDetails(accentId: string): { description: string } {
    // This should be imported from your voice presets
    const accents: Record<string, { description: string }> = {
      'american': { description: 'Speak with a clear American accent.' },
      'british': { description: 'Speak with a refined British accent.' },
      'australian': { description: 'Speak with a friendly Australian accent.' },
      'southern': { description: 'Speak with a warm Southern American accent.' },
      'new-york': { description: 'Speak with a distinctive New York accent.' }
    };
    
    return accents[accentId] || accents['american'];
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || !this.isConnected) {
      logger.warn('RealtimeVoiceService: Cannot send audio - not connected');
      return;
    }

    try {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audioData);
      const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
      const base64Audio = btoa(binaryString);

      const message = {
        type: 'input_audio_buffer.append',
        audio: base64Audio
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
            text: text
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  startSpeaking(): void {
    if (!this.ws || !this.isConnected) return;

    const message = {
      type: 'response.audio.create',
      response: {
        modalities: ['audio'],
        instructions: 'Respond with audio only'
      }
    };

    this.ws.send(JSON.stringify(message));
    this.isSpeaking = true;
    this.callbacks.onSpeaking?.(true);
  }

  stopSpeaking(): void {
    if (!this.ws || !this.isConnected) return;

    const message = {
      type: 'response.audio.stop'
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
      delay 
    });

    setTimeout(() => {
      if (this.config) {
        this.connect(this.config, this.callbacks).catch(error => {
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
      this.connect(this.config, this.callbacks).catch(error => {
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
      this.ws.send(JSON.stringify({ type: 'session.update', session: { modalities: ['text', 'audio'] } }));
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
      speaking: this.isSpeaking
    };
  }
}

export default RealtimeVoiceService;
