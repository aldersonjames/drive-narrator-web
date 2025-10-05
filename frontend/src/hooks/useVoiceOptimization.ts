/**
 * Hook for voice optimization
 * Provides optimized audio constraints and VAD settings
 */

import { useState, useCallback, useEffect } from 'react';
import { voiceOptimization, OPTIMIZATION_PRESETS } from '../services/voice/voiceOptimization';

export function useVoiceOptimization(preset: keyof typeof OPTIMIZATION_PRESETS = 'car-mode') {
  const [currentPreset, setCurrentPreset] = useState(preset);
  const [metrics, setMetrics] = useState(voiceOptimization.getMetrics());

  // Update optimization service when preset changes
  useEffect(() => {
    voiceOptimization.setPreset(currentPreset);
  }, [currentPreset]);

  const getAudioConstraints = useCallback(() => {
    return voiceOptimization.getAudioConstraints();
  }, []);

  const getVadThreshold = useCallback(() => {
    return voiceOptimization.getVadThreshold();
  }, []);

  const detectVoiceActivity = useCallback((audioData: Float32Array) => {
    return voiceOptimization.detectVoiceActivity(audioData);
  }, []);

  const recordLatency = useCallback((latencyMs: number) => {
    voiceOptimization.recordLatency(latencyMs);
    setMetrics(voiceOptimization.getMetrics());
  }, []);

  const recordVadFalsePositive = useCallback(() => {
    voiceOptimization.recordVadFalsePositive();
    setMetrics(voiceOptimization.getMetrics());
  }, []);

  const recordVadMissedSpeech = useCallback(() => {
    voiceOptimization.recordVadMissedSpeech();
    setMetrics(voiceOptimization.getMetrics());
  }, []);

  const resetMetrics = useCallback(() => {
    voiceOptimization.resetMetrics();
    setMetrics(voiceOptimization.getMetrics());
  }, []);

  const changePreset = useCallback((newPreset: keyof typeof OPTIMIZATION_PRESETS) => {
    setCurrentPreset(newPreset);
  }, []);

  const getConfig = useCallback(() => {
    return voiceOptimization.getConfig();
  }, []);

  return {
    currentPreset,
    metrics,
    getAudioConstraints,
    getVadThreshold,
    detectVoiceActivity,
    recordLatency,
    recordVadFalsePositive,
    recordVadMissedSpeech,
    resetMetrics,
    changePreset,
    getConfig,
  };
}
