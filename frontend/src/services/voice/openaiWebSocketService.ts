/**
 * OpenAI WebSocket Voice Service
 * Handles real-time voice conversations with OpenAI's Realtime API
 * Includes barge-in capabilities and voice activity detection
 */

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

export class OpenAIWebSocketService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private currentAudio: AudioBufferSourceNode | null = null;
  
  private config: VoiceConfig;
  private handlers: VoiceEventHandlers;
  private state: VoiceState = {
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false
  };

  // Voice Activity Detection
  private vadThreshold: number;
  private silenceDuration: number;
  private lastSpeechTime: number = 0;
  private audioQueue: ArrayBuffer[] = [];

  constructor(config: VoiceConfig, handlers: VoiceEventHandlers = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'alloy',
      instructions: 'You are a helpful voice assistant. Keep responses concise and natural.',
      vadThreshold: 0.01,
      silenceDuration: 1000,
      ...config
    };
    this.handlers = handlers;
    this.vadThreshold = this.config.vadThreshold!;
    this.silenceDuration = this.config.silenceDuration!;
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      throw new Error('Already connected');
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(
          `wss://api.openai.com/v1/realtime?model=${this.config.model}`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.apiKey}`,
              'OpenAI-Beta': 'realtime=v1'
            }
          }
        );

        this.ws.onopen = () => {
          this.updateState({ isConnected: true });
          this.initializeConversation();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          this.handlers.onError?.(new Error('WebSocket connection error'));
          reject(error);
        };

        this.ws.onclose = () => {
          this.updateState({ 
            isConnected: false, 
            isListening: false, 
            isSpeaking: false 
          });
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopListening();
    this.updateState({ 
      isConnected: false, 
      isListening: false, 
      isSpeaking: false 
    });
  }

  /**
   * Start listening for user input
   */
  async startListening(): Promise<void> {
    if (!this.state.isConnected) {
      throw new Error('Not connected to OpenAI');
    }

    if (this.state.isListening) {
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      this.audioProcessor.onaudioprocess = (event) => {
        this.processAudioInput(event);
      };

      this.updateState({ isListening: true });

    } catch (error) {
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening for user input
   */
  stopListening(): void {
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.updateState({ isListening: false });
  }

  /**
   * Send a text message to the conversation
   */
  sendMessage(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to OpenAI');
    }

    const textMessage = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: message
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(textMessage));
  }

  /**
   * Interrupt the current AI response
   */
  interrupt(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const interruptMessage = {
      type: 'response.interrupt'
    };

    this.ws.send(JSON.stringify(interruptMessage));
    this.handlers.onBargeIn?.();
  }

  /**
   * Get current voice state
   */
  getState(): VoiceState {
    return { ...this.state };
  }

  private updateState(updates: Partial<VoiceState>): void {
    this.state = { ...this.state, ...updates };
    this.handlers.onStateChange?.(this.state);
  }

  private initializeConversation(): void {
    if (!this.ws) return;

    const config = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions,
        voice: this.config.voice,
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
        }
      }
    };

    this.ws.send(JSON.stringify(config));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'session.created':
        case 'session.updated':
          // Session is ready
          break;

        case 'conversation.item.input_audio_buffer.speech_started':
          this.updateState({ isProcessing: true });
          break;

        case 'conversation.item.input_audio_buffer.transcript':
          this.handlers.onTranscript?.(message.transcript);
          break;

        case 'conversation.item.input_audio_buffer.speech_stopped':
          this.updateState({ isProcessing: false });
          break;

        case 'conversation.item.output_audio_buffer.speech_started':
          this.updateState({ isSpeaking: true });
          break;

        case 'conversation.item.output_audio_buffer.speech_stopped':
          this.updateState({ isSpeaking: false });
          break;

        case 'conversation.item.output_audio_buffer.audio':
          this.handleAudioOutput(message.audio);
          break;

        case 'error':
          this.handlers.onError?.(new Error(message.error.message));
          break;

        default:
          // Handle other message types as needed
          break;
      }
    } catch (error) {
      this.handlers.onError?.(error as Error);
    }
  }

  private handleAudioOutput(audioData: string): void {
    try {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      this.playAudio(bytes.buffer);
      this.handlers.onAudioData?.(bytes.buffer);
    } catch (error) {
      this.handlers.onError?.(error as Error);
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Decode PCM16 audio (OpenAI uses 24kHz sample rate)
      const audioData = new Int16Array(audioBuffer);
      const sampleRate = 24000;
      const length = audioData.length;
      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const channelData = buffer.getChannelData(0);

      // Convert PCM16 to float32
      for (let i = 0; i < length; i++) {
        channelData[i] = audioData[i] / 32768.0;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.currentAudio = null;
      };

      source.start(0);
      this.currentAudio = source;

    } catch (error) {
      this.handlers.onError?.(error as Error);
    }
  }

  private processAudioInput(event: AudioProcessingEvent): void {
    if (!this.state.isListening || !this.ws) return;

    const inputData = event.inputBuffer.getChannelData(0);

    // Voice Activity Detection for barge-in
    const isUserSpeaking = this.detectVoiceActivity(inputData);

    if (isUserSpeaking && this.state.isSpeaking) {
      this.interrupt();
    }

    // Convert float32 to PCM16 and send to OpenAI
    const pcm16Data = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      pcm16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
    }

    // Send audio data to OpenAI
    const audioMessage = {
      type: 'input_audio_buffer.append',
      audio: btoa(String.fromCharCode(...new Uint8Array(pcm16Data.buffer)))
    };

    this.ws.send(JSON.stringify(audioMessage));
  }

  private detectVoiceActivity(audioData: Float32Array): boolean {
    // Simple voice activity detection based on RMS energy
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);

    if (rms > this.vadThreshold) {
      this.lastSpeechTime = Date.now();
      return true;
    }

    return false;
  }
}

export default OpenAIWebSocketService;

