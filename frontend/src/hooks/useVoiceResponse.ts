import { useState, useCallback, useRef } from 'react';

export interface VoiceResponseOptions {
  voiceId: string;
  personaId: string;
  accentId: string;
  speed?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export const useVoiceResponse = (options: VoiceResponseOptions) => {
  const {
    voiceId,
    personaId,
    accentId,
    speed = 1.0,
    volume = 1.0,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentText, setCurrentText] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add to queue
    queueRef.current.push(text);

    // Process queue if not already processing
    if (!isProcessingRef.current) {
      processQueue();
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) return;

    isProcessingRef.current = true;
    setIsLoading(true);

    const text = queueRef.current.shift();
    if (!text) {
      isProcessingRef.current = false;
      setIsLoading(false);
      return;
    }

    setCurrentText(text);
    onStart?.();

    try {
      // Generate voice using OpenAI TTS
      const response = await fetch('/api/voices/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId,
          input: text,
          instructions: `Use ${personaId} persona with ${accentId} accent. Speak naturally and conversationally.`,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voice generation failed: ${response.statusText}`);
      }

      // Create audio element and play
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      const audio = new Audio(audioUrl);
      audio.volume = volume;
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentText('');
        onEnd?.();
        
        // Clean up
        URL.revokeObjectURL(audioUrl);
        
        // Process next item in queue
        isProcessingRef.current = false;
        if (queueRef.current.length > 0) {
          setTimeout(() => processQueue(), 100);
        }
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsSpeaking(false);
        setIsLoading(false);
        setCurrentText('');
        onError?.('Audio playback failed');
        
        // Clean up
        URL.revokeObjectURL(audioUrl);
        
        // Process next item in queue
        isProcessingRef.current = false;
        if (queueRef.current.length > 0) {
          setTimeout(() => processQueue(), 100);
        }
      };

      await audio.play();

    } catch (error) {
      console.error('Voice generation error:', error);
      setIsLoading(false);
      setIsSpeaking(false);
      setCurrentText('');
      onError?.(error instanceof Error ? error.message : 'Voice generation failed');
      
      // Process next item in queue
      isProcessingRef.current = false;
      if (queueRef.current.length > 0) {
        setTimeout(() => processQueue(), 100);
      }
    }
  }, [voiceId, personaId, accentId, speed, volume, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsLoading(false);
    setCurrentText('');
    
    // Clear queue
    queueRef.current = [];
    isProcessingRef.current = false;
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play();
      setIsSpeaking(true);
    }
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = [];
  }, []);

  const getQueueLength = useCallback(() => {
    return queueRef.current.length;
  }, []);

  const isQueueEmpty = useCallback(() => {
    return queueRef.current.length === 0 && !isProcessingRef.current;
  }, []);

  return {
    isSpeaking,
    isLoading,
    currentText,
    speak,
    stop,
    pause,
    resume,
    clearQueue,
    getQueueLength,
    isQueueEmpty,
  };
};
