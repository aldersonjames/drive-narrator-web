export interface VoiceSegment {
  id: string;
  text: string;
  voiceId: string;
}

export interface VoiceOutputOptions {
  onStart?: (segment: VoiceSegment) => void;
  onEnd?: (segment: VoiceSegment) => void;
  onError?: (segment: VoiceSegment, error: Error) => void;
}

export class VoiceOutputService {
  private readonly audio = new Audio();
  private chain: Promise<void> = Promise.resolve();

  constructor(private readonly options: VoiceOutputOptions = {}) {}

  async speak(segment: VoiceSegment): Promise<void> {
    this.chain = this.chain.catch(() => undefined).then(() => this.playSegment(segment));
    return this.chain;
  }

  stop(): void {
    if (!this.audio.paused) {
      this.audio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  private playSegment(segment: VoiceSegment): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.options.onStart?.(segment);

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(segment.text);
          const targetVoice = this.resolveVoice(segment.voiceId);
          if (targetVoice) {
            utterance.voice = targetVoice;
          }
          utterance.onend = () => {
            this.options.onEnd?.(segment);
            resolve();
          };
          utterance.onerror = (event) => {
            const error = new Error(event.error ?? 'tts-error');
            this.options.onError?.(segment, error);
            reject(error);
          };
          window.speechSynthesis.speak(utterance);
          return;
        }

        const blob = new Blob([segment.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        this.audio.src = url;
        this.audio.onended = () => {
          URL.revokeObjectURL(url);
          this.options.onEnd?.(segment);
          resolve();
        };
        this.audio.onerror = () => {
          URL.revokeObjectURL(url);
          const error = new Error('audio-playback-error');
          this.options.onError?.(segment, error);
          reject(error);
        };
        void this.audio.play();
      } catch (error) {
        this.options.onError?.(segment, error as Error);
        reject(error);
      }
    });
  }

  private resolveVoice(voiceId: string): SpeechSynthesisVoice | undefined {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return undefined;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      return undefined;
    }

    const matchByName = voices.find((voice) => voice.name.toLowerCase() === voiceId.toLowerCase());
    if (matchByName) {
      return matchByName;
    }

    return voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));
  }
}
