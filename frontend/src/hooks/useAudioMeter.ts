import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioMeterController {
  level: number;
  error?: string;
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

const RMS_SMOOTHING = 0.6;
const MIN_DECIBEL = -90;

export const useAudioMeter = (): AudioMeterController => {
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  type SampleArray = Parameters<AnalyserNode['getFloatTimeDomainData']>[0];
  const dataArrayRef = useRef<SampleArray | null>(null);
  const rafRef = useRef<number>();

  const update = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    analyser.getFloatTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
      sumSquares += dataArray[i] ** 2;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    const decibels = 20 * Math.log10(rms || 1e-8);
    const normalized = Math.max(0, Math.min(1, (decibels - MIN_DECIBEL) / -MIN_DECIBEL));

    setLevel((prev) => prev * RMS_SMOOTHING + normalized * (1 - RMS_SMOOTHING));
    rafRef.current = window.requestAnimationFrame(update);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) {
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(update);
      }
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('Media devices unavailable');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true },
        video: false,
      });
      const audioContext = new AudioContext();
      await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Float32Array(analyser.fftSize) as SampleArray;
      setError(undefined);
      rafRef.current = window.requestAnimationFrame(update);
    } catch (err) {
      const message = (err as Error).message || 'Unable to access microphone';
      setError(message);
    }
  }, [update]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    level,
    error,
    isActive: Boolean(streamRef.current),
    start,
    stop,
  };
};
