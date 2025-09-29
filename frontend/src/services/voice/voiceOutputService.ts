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
  private audio = new Audio();

  constructor(private readonly options: VoiceOutputOptions = {}) {}

  async speak(segment: VoiceSegment): Promise<void> {
    try {
      this.options.onStart?.(segment);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.onend = () => this.options.onEnd?.(segment);
        utterance.onerror = (event) =>
          this.options.onError?.(segment, new Error(event.error ?? 'tts-error'));
        window.speechSynthesis.speak(utterance);
        return;
      }

      const blob = new Blob([segment.text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      this.audio.src = url;
      await this.audio.play();
      this.options.onEnd?.(segment);
    } catch (error) {
      this.options.onError?.(segment, error as Error);
    }
  }

  stop(): void {
    if (!this.audio.paused) {
      this.audio.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
