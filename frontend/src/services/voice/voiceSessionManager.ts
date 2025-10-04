import { v4 as uuid } from 'uuid';

import type { ConversationAudioSegment } from '../../../../shared/types/tripNarrator';

export type VoiceSessionState = 'idle' | 'connecting' | 'ready' | 'speaking' | 'error';

interface VoiceSessionInfo {
  provider: string;
  transport: 'webrtc' | 'websocket';
  ephemeralToken: string;
  model: string;
  voice: {
    id: string;
    lang: string;
    rate: number;
    style?: string;
  };
  region: string;
  expiresAt: string;
}

type VoiceSessionEvent =
  | { type: 'state'; state: VoiceSessionState }
  | { type: 'error'; message: string }
  | { type: 'output-level'; level: number }
  | { type: 'response-started'; responseId: string }
  | { type: 'response-completed'; responseId: string };

type VoiceSessionListener = (event: VoiceSessionEvent) => void;

const DEVICE_STORAGE_KEY = 'drive-narrator:voice-device-id';
const MIN_OUTPUT_INTERVAL_MS = 30;

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const pcm16ToFloat32 = (pcm16: Int16Array): Float32Array => {
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i += 1) {
    float32[i] = pcm16[i] / 32768;
  }
  return float32;
};

const resolveDeviceId = (): string => {
  if (typeof window === 'undefined') return uuid();
  try {
    const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) return existing;
    const next = uuid();
    window.localStorage.setItem(DEVICE_STORAGE_KEY, next);
    return next;
  } catch (error) {
    console.warn('drive-narrator: unable to persist device id', error);
    return uuid();
  }
};

export interface VoiceSessionManagerOptions {
  transport?: 'websocket' | 'webrtc';
  deviceId?: string;
}

interface ResponseContext {
  id: string;
  samplesEmitted: number;
  sampleRate: number;
}

export class VoiceSessionManager {
  private deviceId: string;
  private listeners: Set<VoiceSessionListener> = new Set();
  private session: VoiceSessionInfo | null = null;
  private websocket: WebSocket | null = null;
  private state: VoiceSessionState = 'idle';
  private options: VoiceSessionManagerOptions;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private outputTimer?: number;
  private playCursor = 0;
  private currentResponse: ResponseContext | null = null;
  private lastPlayedChunks: Array<() => void> = [];

  constructor(options: VoiceSessionManagerOptions = {}) {
    this.deviceId = options.deviceId ?? resolveDeviceId();
    this.options = options;
  }

  addListener(listener: VoiceSessionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: VoiceSessionEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  private setState(next: VoiceSessionState): void {
    if (this.state === next) return;
    this.state = next;
    this.emit({ type: 'state', state: next });
  }

  private ensureAudioGraph():void {
    if (this.audioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    gain.gain.value = 1;
    gain.connect(analyser);
    analyser.connect(context.destination);
    this.audioContext = context;
    this.gainNode = gain;
    this.analyser = analyser;
    this.scheduleOutputMeter();
  }

  private scheduleOutputMeter(): void {
    if (!this.analyser) return;
    if (this.outputTimer) window.clearTimeout(this.outputTimer);

    const sample = () => {
      const analyser = this.analyser;
      if (!analyser) return;
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        sum += data[i] * data[i];
      }
      const rms = Math.sqrt(sum / data.length);
      this.emit({ type: 'output-level', level: rms });
      this.outputTimer = window.setTimeout(sample, MIN_OUTPUT_INTERVAL_MS);
    };

    this.outputTimer = window.setTimeout(sample, MIN_OUTPUT_INTERVAL_MS);
  }

  private async ensureSession(): Promise<void> {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      return;
    }

    this.setState('connecting');

    const res = await fetch('/api/voice/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': this.deviceId,
      },
      body: JSON.stringify({ transport: this.options.transport ?? 'websocket' }),
    });

    if (!res.ok) {
      const message = await res.text();
      this.setState('error');
      this.emit({ type: 'error', message: message || 'Unable to create voice session.' });
      throw new Error(message || 'Unable to create voice session');
    }

    const payload = await res.json();
    this.session = payload;

    await this.openWebSocket();
  }

  private async openWebSocket(): Promise<void> {
    if (!this.session) throw new Error('voice session missing');
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.setState('ready');
      return;
    }

    this.ensureAudioGraph();

    const { model, ephemeralToken } = this.session;
    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`;

    const protocols = [
      'realtime',
      `openai-insecure-api-key.${ephemeralToken}`,
      'openai-beta.realtime-v1',
    ];

    const ws = new WebSocket(url, protocols);
    this.websocket = ws;

    ws.onopen = () => {
      this.setState('ready');
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        this.handleJsonMessage(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        this.handleBinaryMessage(event.data);
      }
    };

    ws.onerror = () => {
      this.setState('error');
      this.emit({ type: 'error', message: 'Voice streaming error.' });
    };

    ws.onclose = () => {
      this.websocket = null;
      this.setState('idle');
    };
  }

  private handleJsonMessage(raw: string): void {
    try {
      const message = JSON.parse(raw);
      if (!message?.type) return;

      switch (message.type) {
        case 'response.created': {
          this.currentResponse = {
            id: message.response?.id ?? message.response?.response_id ?? uuid(),
            samplesEmitted: 0,
            sampleRate: message.response?.output_audio_format?.sample_rate ?? 24000,
          };
          this.emit({
            type: 'response-started',
            responseId: this.currentResponse.id,
          });
          this.setState('speaking');
          break;
        }
        case 'response.output_audio.delta': {
          this.enqueueAudioChunk(message.delta, message.output_audio_format?.sample_rate ?? 24000);
          break;
        }
        case 'response.completed': {
          const responseId = message.response?.id ?? this.currentResponse?.id ?? uuid();
          this.emit({ type: 'response-completed', responseId });
          this.currentResponse = null;
          this.setState('ready');
          break;
        }
        case 'error': {
          this.setState('error');
          this.emit({ type: 'error', message: message.error?.message ?? 'Voice runtime error.' });
          break;
        }
        default:
          break;
      }
    } catch (error) {
      console.warn('drive-narrator: failed to parse realtime message', error, raw);
    }
  }

  private handleBinaryMessage(buffer: ArrayBuffer): void {
    // Some transports may send raw PCM frames. Assume 16-bit little endian PCM at 24000 Hz.
    const pcm16 = new Int16Array(buffer);
    this.enqueuePcmSamples(pcm16, 24000);
  }

  private enqueueAudioChunk(base64Chunk: string, sampleRate: number): void {
    const arrayBuffer = base64ToArrayBuffer(base64Chunk);
    const pcm16 = new Int16Array(arrayBuffer);
    this.enqueuePcmSamples(pcm16, sampleRate);
  }

  private enqueuePcmSamples(pcm16: Int16Array, sampleRate: number): void {
    if (!this.audioContext || !this.gainNode) {
      return;
    }
    const context = this.audioContext;
    const gain = this.gainNode;
    const float32 = pcm16ToFloat32(pcm16);
    const buffer = context.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    const startTime = Math.max(context.currentTime + 0.01, this.playCursor || context.currentTime + 0.01);
    source.start(startTime);
    this.playCursor = startTime + buffer.duration;

    if (this.currentResponse) {
      this.currentResponse.samplesEmitted += buffer.length;
      this.currentResponse.sampleRate = sampleRate;
    }

    this.lastPlayedChunks.push(() => {
      try {
        source.stop();
      } catch (error) {
        // ignore
      }
    });

    source.onended = () => {
      this.lastPlayedChunks = this.lastPlayedChunks.filter((stopper) => stopper !== source.stop);
    };
  }

  async playSegments(segments: ConversationAudioSegment[], opts?: { resumeFromSamples?: number }): Promise<void> {
    if (!segments.length) return;
    await this.ensureSession();
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      this.emit({ type: 'error', message: 'Voice connection unavailable.' });
      return;
    }

    const text = segments.map((segment) => segment.text).join('\n');
    const voiceId = segments[0]?.voiceId;

    const responseId = uuid();
    const payload = {
      type: 'response.create',
      response: {
        id: responseId,
        instructions: text,
        modalities: ['text', 'audio'],
        metadata: {
          source: 'drive-narrator',
        },
        audio: {
          voice: voiceId,
          format: 'pcm16',
        },
        resume_from: opts?.resumeFromSamples,
      },
    };

    try {
      this.websocket.send(JSON.stringify(payload));
      this.setState('speaking');
    } catch (error) {
      this.emit({ type: 'error', message: (error as Error).message });
      this.setState('error');
    }
  }

  cancel(): void {
    if (!this.websocket || !this.currentResponse) {
      this.stopPlayback();
      return;
    }

    const { id, samplesEmitted } = this.currentResponse;
    const payload = {
      type: 'response.cancel',
      response: {
        id,
        sample_offset: samplesEmitted,
      },
    };

    try {
      this.websocket.send(JSON.stringify(payload));
    } catch (error) {
      console.warn('drive-narrator: cancel failed', error);
    }

    this.stopPlayback();
    this.currentResponse = null;
    this.setState('ready');
  }

  stop(): void {
    this.cancel();
  }

  resumeLast(): void {
    if (!this.currentResponse?.id) return;
    const { id, samplesEmitted } = this.currentResponse;
    if (!this.websocket) return;
    const payload = {
      type: 'response.resume',
      response: {
        id,
        sample_offset: samplesEmitted,
      },
    };
    try {
      this.websocket.send(JSON.stringify(payload));
    } catch (error) {
      console.warn('drive-narrator: resume failed', error);
    }
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  getCurrentResponseSampleOffset(): number {
    if (!this.currentResponse) return 0;
    return this.currentResponse.samplesEmitted;
  }

  private stopPlayback(): void {
    this.lastPlayedChunks.forEach((stopper) => stopper());
    this.lastPlayedChunks = [];
    this.playCursor = this.audioContext ? this.audioContext.currentTime : 0;
  }

  destroy(): void {
    if (this.outputTimer) {
      window.clearTimeout(this.outputTimer);
      this.outputTimer = undefined;
    }
    this.stopPlayback();
    if (this.websocket) {
      try {
        this.websocket.close();
      } catch (error) {
        // ignore
      }
      this.websocket = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => undefined);
      this.audioContext = null;
      this.gainNode = null;
      this.analyser = null;
    }
    this.setState('idle');
  }
}

export default VoiceSessionManager;
