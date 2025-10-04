import { useCallback, useEffect, useRef, useState } from 'react';
import RealtimeVoiceService, { RealtimeVoiceConfig, RealtimeVoiceCallbacks } from '../services/voice/realtimeVoiceService';

export interface UseRealtimeVoiceOptions {
  voiceId: 'alloy' | 'echo' | 'shimmer';
  personaId: string;
  accentId: string;
  instructions?: string;
  autoConnect?: boolean;
}

export interface UseRealtimeVoiceReturn {
  // Connection state
  isConnected: boolean;
  isSpeaking: boolean;
  isConnecting: boolean;
  
  // Audio state
  isRecording: boolean;
  audioLevel: number;
  
  // Transcripts
  userTranscript: string;
  assistantTranscript: string;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendText: (text: string) => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useRealtimeVoice = (options: UseRealtimeVoiceOptions): UseRealtimeVoiceReturn => {
  const {
    voiceId,
    personaId,
    accentId,
    instructions,
    autoConnect = false
  } = options;

  const serviceRef = useRef<RealtimeVoiceService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new RealtimeVoiceService();
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
        serviceRef.current = null;
      }
    };
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect && serviceRef.current && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting]);

  // Update service configuration when options change
  useEffect(() => {
    if (serviceRef.current && isConnected) {
      // Reconnect with new configuration
      disconnect();
      setTimeout(() => connect(), 100);
    }
  }, [voiceId, personaId, accentId, instructions]);

  const connect = useCallback(async () => {
    if (!serviceRef.current || isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      const config: RealtimeVoiceConfig = {
        voiceId,
        personaId,
        accentId,
        instructions
      };

      const callbacks: RealtimeVoiceCallbacks = {
        onConnected: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnected: () => {
          setIsConnected(false);
          setIsSpeaking(false);
          setIsConnecting(false);
        },
        onSpeaking: (speaking) => {
          setIsSpeaking(speaking);
        },
        onTranscript: (transcript) => {
          // Determine if this is user or assistant transcript based on context
          // For now, we'll assume it's user input
          setUserTranscript(prev => prev + transcript);
        },
        onAudioChunk: (audioChunk) => {
          // Handle audio playback
          playAudioChunk(audioChunk);
        },
        onError: (err) => {
          setError(err.message);
          setIsConnecting(false);
        }
      };

      await serviceRef.current.connect(config, callbacks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [voiceId, personaId, accentId, instructions, isConnected, isConnecting]);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsConnecting(false);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!serviceRef.current || !isConnected || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Set up audio analysis for level monitoring
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);

      // Start level monitoring
      const monitorLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          setAudioLevel(average / 255);
          
          animationFrameRef.current = requestAnimationFrame(monitorLevel);
        }
      };

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          serviceRef.current?.sendAudio(arrayBuffer);
        };
        reader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      monitorLevel();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [isConnected, isRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setAudioLevel(0);
    }
  }, [isRecording]);

  const sendText = useCallback((text: string) => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.sendText(text);
    }
  }, [isConnected]);

  const startSpeaking = useCallback(() => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.startSpeaking();
    }
  }, [isConnected]);

  const stopSpeaking = useCallback(() => {
    if (serviceRef.current && isConnected) {
      serviceRef.current.stopSpeaking();
    }
  }, [isConnected]);

  const playAudioChunk = useCallback((audioChunk: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    audioContextRef.current.decodeAudioData(audioChunk.slice(0))
      .then(audioBuffer => {
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        source.start();
      })
      .catch(err => {
        console.error('Failed to play audio chunk:', err);
      });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    isSpeaking,
    isConnecting,
    isRecording,
    audioLevel,
    userTranscript,
    assistantTranscript,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendText,
    startSpeaking,
    stopSpeaking,
    error,
    clearError
  };
};

export default useRealtimeVoice;
