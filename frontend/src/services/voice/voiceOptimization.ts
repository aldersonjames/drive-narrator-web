/**
 * Voice Response Optimization Service
 * Handles VAD tuning, audio quality optimization, and latency reduction
 */

export interface VoiceOptimizationConfig {
  // Voice Activity Detection
  vadThreshold: number; // 0.0 - 1.0, lower = more sensitive
  vadSilenceDuration: number; // milliseconds
  vadMinSpeechDuration: number; // milliseconds
  vadAdaptive: boolean; // Auto-adjust based on noise level

  // Audio Quality
  sampleRate: number; // 16000, 24000, 48000 Hz
  channels: number; // 1 = mono, 2 = stereo
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;

  // Latency Optimization
  bufferSize: number; // Audio buffer size (lower = less latency)
  maxLatency: number; // Maximum acceptable latency in ms
  prefetchEnabled: boolean; // Pre-fetch common responses

  // Quality/Latency Trade-off
  mode: 'low-latency' | 'balanced' | 'high-quality';
}

export const OPTIMIZATION_PRESETS: Record<string, VoiceOptimizationConfig> = {
  'low-latency': {
    vadThreshold: 0.02,
    vadSilenceDuration: 800,
    vadMinSpeechDuration: 200,
    vadAdaptive: true,
    sampleRate: 16000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: false, // Reduces processing time
    autoGainControl: true,
    bufferSize: 2048,
    maxLatency: 300,
    prefetchEnabled: true,
    mode: 'low-latency',
  },
  balanced: {
    vadThreshold: 0.015,
    vadSilenceDuration: 1000,
    vadMinSpeechDuration: 250,
    vadAdaptive: true,
    sampleRate: 24000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    bufferSize: 4096,
    maxLatency: 500,
    prefetchEnabled: true,
    mode: 'balanced',
  },
  'high-quality': {
    vadThreshold: 0.01,
    vadSilenceDuration: 1200,
    vadMinSpeechDuration: 300,
    vadAdaptive: false, // Consistent quality
    sampleRate: 24000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    bufferSize: 8192,
    maxLatency: 800,
    prefetchEnabled: false,
    mode: 'high-quality',
  },
  'car-mode': {
    // Optimized for car environment with road noise
    vadThreshold: 0.03, // Higher threshold for noisy environment
    vadSilenceDuration: 900,
    vadMinSpeechDuration: 300, // Longer to avoid road noise
    vadAdaptive: true,
    sampleRate: 16000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true, // Important for car noise
    autoGainControl: true,
    bufferSize: 4096,
    maxLatency: 400,
    prefetchEnabled: true,
    mode: 'balanced',
  },
};

export class VoiceOptimizationService {
  private config: VoiceOptimizationConfig;
  private noiseLevel: number = 0;
  private adaptiveVadThreshold: number;
  private performanceMetrics: {
    averageLatency: number;
    peakLatency: number;
    falsePositives: number; // VAD triggered when no speech
    missedSpeech: number; // Speech not detected
  } = {
    averageLatency: 0,
    peakLatency: 0,
    falsePositives: 0,
    missedSpeech: 0,
  };

  constructor(preset: keyof typeof OPTIMIZATION_PRESETS = 'balanced') {
    this.config = { ...OPTIMIZATION_PRESETS[preset] };
    this.adaptiveVadThreshold = this.config.vadThreshold;
  }

  /**
   * Get current optimization config
   */
  getConfig(): VoiceOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization config
   */
  updateConfig(updates: Partial<VoiceOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.adaptiveVadThreshold = this.config.vadThreshold;
  }

  /**
   * Switch to a different optimization preset
   */
  setPreset(preset: keyof typeof OPTIMIZATION_PRESETS): void {
    this.config = { ...OPTIMIZATION_PRESETS[preset] };
    this.adaptiveVadThreshold = this.config.vadThreshold;
  }

  /**
   * Get optimized audio constraints for getUserMedia
   */
  getAudioConstraints(): MediaStreamConstraints {
    return {
      audio: {
        sampleRate: { ideal: this.config.sampleRate },
        channelCount: { ideal: this.config.channels },
        echoCancellation: { ideal: this.config.echoCancellation },
        noiseSuppression: { ideal: this.config.noiseSuppression },
        autoGainControl: { ideal: this.config.autoGainControl },
        latency: { ideal: this.config.maxLatency / 1000 },
      },
      video: false,
    };
  }

  /**
   * Get current VAD threshold (adaptive or fixed)
   */
  getVadThreshold(): number {
    return this.config.vadAdaptive ? this.adaptiveVadThreshold : this.config.vadThreshold;
  }

  /**
   * Update adaptive VAD threshold based on ambient noise
   */
  updateNoiseLevel(audioData: Float32Array): void {
    // Calculate RMS (Root Mean Square) of audio data
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);

    // Exponential moving average for smooth noise level tracking
    const alpha = 0.1;
    this.noiseLevel = alpha * rms + (1 - alpha) * this.noiseLevel;

    // Adapt VAD threshold if enabled
    if (this.config.vadAdaptive) {
      // Set threshold 2x above noise floor, with min/max bounds
      const adaptedThreshold = Math.max(
        this.config.vadThreshold,
        Math.min(0.1, this.noiseLevel * 2),
      );
      this.adaptiveVadThreshold = adaptedThreshold;
    }
  }

  /**
   * Detect voice activity in audio buffer
   */
  detectVoiceActivity(audioData: Float32Array): {
    isSpeech: boolean;
    energy: number;
    confidence: number;
  } {
    // Calculate audio energy
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const energy = Math.sqrt(sum / audioData.length);

    // Simple threshold-based VAD
    const threshold = this.getVadThreshold();
    const isSpeech = energy > threshold;

    // Calculate confidence (how much above/below threshold)
    const confidence = isSpeech ? Math.min(energy / threshold, 2.0) : 0;

    // Update noise level for adaptive VAD
    if (!isSpeech) {
      this.updateNoiseLevel(audioData);
    }

    return { isSpeech, energy, confidence };
  }

  /**
   * Record latency measurement
   */
  recordLatency(latencyMs: number): void {
    // Update moving average
    const alpha = 0.2;
    this.performanceMetrics.averageLatency =
      alpha * latencyMs + (1 - alpha) * this.performanceMetrics.averageLatency;

    // Update peak
    if (latencyMs > this.performanceMetrics.peakLatency) {
      this.performanceMetrics.peakLatency = latencyMs;
    }

    // Auto-adjust if latency consistently too high
    if (
      this.config.mode === 'balanced' &&
      this.performanceMetrics.averageLatency > this.config.maxLatency
    ) {
      this.autoAdjustForLatency();
    }
  }

  /**
   * Record VAD performance metrics
   */
  recordVadFalsePositive(): void {
    this.performanceMetrics.falsePositives++;
    // If too many false positives, increase threshold
    if (this.performanceMetrics.falsePositives > 10) {
      this.config.vadThreshold = Math.min(0.1, this.config.vadThreshold * 1.1);
      this.adaptiveVadThreshold = this.config.vadThreshold;
      this.performanceMetrics.falsePositives = 0;
    }
  }

  recordVadMissedSpeech(): void {
    this.performanceMetrics.missedSpeech++;
    // If missing speech, lower threshold
    if (this.performanceMetrics.missedSpeech > 5) {
      this.config.vadThreshold = Math.max(0.005, this.config.vadThreshold * 0.9);
      this.adaptiveVadThreshold = this.config.vadThreshold;
      this.performanceMetrics.missedSpeech = 0;
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      currentNoiseLevel: this.noiseLevel,
      adaptiveVadThreshold: this.adaptiveVadThreshold,
      config: this.config,
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      averageLatency: 0,
      peakLatency: 0,
      falsePositives: 0,
      missedSpeech: 0,
    };
  }

  /**
   * Auto-adjust settings based on performance
   */
  private autoAdjustForLatency(): void {
    console.log('VoiceOptimization: Auto-adjusting for high latency');

    // Reduce quality slightly to improve latency
    if (this.config.sampleRate > 16000) {
      this.config.sampleRate = 16000;
    }
    if (this.config.bufferSize > 2048) {
      this.config.bufferSize = Math.max(2048, this.config.bufferSize / 2);
    }

    // Reset metrics after adjustment
    this.performanceMetrics.averageLatency = 0;
    this.performanceMetrics.peakLatency = 0;
  }

  /**
   * Optimize audio buffer for playback
   */
  optimizeAudioBuffer(audioBuffer: AudioBuffer): AudioBuffer {
    // If already at target sample rate, return as-is
    if (audioBuffer.sampleRate === this.config.sampleRate) {
      return audioBuffer;
    }

    // Note: In a real implementation, you would resample the audio here
    // For now, we just return the original buffer
    // Resampling would require additional libraries or Web Audio API processing
    return audioBuffer;
  }

  /**
   * Get recommended settings based on environment
   */
  static getRecommendedPreset(
    environment: 'quiet' | 'moderate' | 'noisy' | 'car',
  ): keyof typeof OPTIMIZATION_PRESETS {
    switch (environment) {
      case 'quiet':
        return 'high-quality';
      case 'moderate':
        return 'balanced';
      case 'noisy':
        return 'low-latency';
      case 'car':
        return 'car-mode';
      default:
        return 'balanced';
    }
  }
}

// Export singleton instance
export const voiceOptimization = new VoiceOptimizationService('car-mode'); // Default to car-mode for Drive Narrator
