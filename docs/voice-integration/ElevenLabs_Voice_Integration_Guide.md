# ElevenLabs Voice Integration Guide - Personal Drive Narrator

## Overview

This guide provides comprehensive examples and implementations for creating a conversational, personal drive narrator using ElevenLabs voice synthesis. The personality is designed to be like a close friend who knows you well and is genuinely excited about helping you document and narrate your drive - similar to ChatGPT Voice's Vale but with a specific purpose for travel narration.

## Files Overview

### 1. ElevenLabs Voice Service (`frontend/src/services/voice/elevenLabsVoiceService.ts`)
A TypeScript service class for ElevenLabs integration with real-time voice conversation handling, barge-in detection, and audio processing.

### 2. React Hook (`frontend/src/hooks/useElevenLabsVoice.ts`)
A React hook for easy integration with state management, error handling, and clean API for React components.

### 3. React Component (`frontend/src/components/voice/ElevenLabsVoiceNarrator.tsx`)
A complete React component with full UI for voice interaction, real-time status display, and debug information.

### 4. Backend API Routes (`backend/src/api/routes/elevenLabs.ts`)
Backend API routes for ElevenLabs integration, voice cloning, and conversation management.

## ElevenLabs Voice Service Implementation

### Core Service Class

```typescript
export interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  textGenerationSettings?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  vadThreshold?: number;
  silenceDuration?: number;
}

export interface VoiceState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isGenerating: boolean;
}

export interface VoiceEventHandlers {
  onStateChange?: (state: VoiceState) => void;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
  onAudioData?: (audioData: ArrayBuffer) => void;
  onBargeIn?: () => void;
  onConversationUpdate?: (conversation: ConversationMessage[]) => void;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export class ElevenLabsVoiceService {
  private config: ElevenLabsConfig;
  private handlers: VoiceEventHandlers;
  private state: VoiceState = {
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    isGenerating: false
  };

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private currentAudio: AudioBufferSourceNode | null = null;
  private conversationHistory: ConversationMessage[] = [];
  
  // Voice Activity Detection
  private vadThreshold: number;
  private silenceDuration: number;
  private lastSpeechTime: number = 0;

  constructor(config: ElevenLabsConfig, handlers: VoiceEventHandlers = {}) {
    this.config = {
      voiceId: 'pNInz6obpgDQGcFmaJgB', // Default Adam voice
      modelId: 'eleven_monolingual_v1',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0.0,
        useSpeakerBoost: true
      },
      textGenerationSettings: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 150
      },
      vadThreshold: 0.01,
      silenceDuration: 1000,
      ...config
    };
    this.handlers = handlers;
    this.vadThreshold = this.config.vadThreshold!;
    this.silenceDuration = this.config.silenceDuration!;
  }

  /**
   * Initialize the voice service
   */
  async initialize(): Promise<void> {
    try {
      this.updateState({ isConnected: true });
      this.log('ElevenLabs voice service initialized');
    } catch (error) {
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Start listening for user input
   */
  async startListening(): Promise<void> {
    if (this.state.isListening) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 44100 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination);

      this.audioProcessor.onaudioprocess = (event) => {
        this.processAudioInput(event);
      };

      this.updateState({ isListening: true });
      this.log('Started listening for voice input');

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
    this.log('Stopped listening for voice input');
  }

  /**
   * Send a text message and get voice response
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.state.isConnected) {
      throw new Error('Service not initialized');
    }

    try {
      this.updateState({ isProcessing: true });

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMessage);
      this.handlers.onConversationUpdate?.(this.conversationHistory);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(message);
      
      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      this.conversationHistory.push(aiMessage);
      this.handlers.onConversationUpdate?.(this.conversationHistory);

      // Convert to speech and play
      await this.speakText(aiResponse);

    } catch (error) {
      this.handlers.onError?.(error as Error);
      throw error;
    } finally {
      this.updateState({ isProcessing: false });
    }
  }

  /**
   * Interrupt current speech
   */
  interrupt(): void {
    if (this.currentAudio) {
      this.currentAudio.stop();
      this.currentAudio = null;
    }
    this.updateState({ isSpeaking: false });
    this.handlers.onBargeIn?.();
    this.log('Speech interrupted');
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.conversationHistory = [];
    this.handlers.onConversationUpdate?.(this.conversationHistory);
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

  private async generateAIResponse(userMessage: string): Promise<string> {
    const systemPrompt = this.getPersonalNarratorPrompt();
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.textGenerationSettings!.model,
        messages,
        temperature: this.config.textGenerationSettings!.temperature,
        max_tokens: this.config.textGenerationSettings!.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async speakText(text: string): Promise<void> {
    try {
      this.updateState({ isGenerating: true, isSpeaking: true });

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.config.apiKey
        },
        body: JSON.stringify({
          text,
          model_id: this.config.modelId,
          voice_settings: this.config.voiceSettings
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      await this.playAudio(audioBuffer);

    } catch (error) {
      this.handlers.onError?.(error as Error);
      throw error;
    } finally {
      this.updateState({ isGenerating: false, isSpeaking: false });
    }
  }

  private async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const audioData = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioData;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.currentAudio = null;
        this.updateState({ isSpeaking: false });
      };

      source.start(0);
      this.currentAudio = source;

    } catch (error) {
      this.handlers.onError?.(error as Error);
    }
  }

  private processAudioInput(event: AudioProcessingEvent): void {
    if (!this.state.isListening) return;

    const inputData = event.inputBuffer.getChannelData(0);
    const isUserSpeaking = this.detectVoiceActivity(inputData);

    if (isUserSpeaking && this.state.isSpeaking) {
      this.interrupt();
    }
  }

  private detectVoiceActivity(audioData: Float32Array): boolean {
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

  private getPersonalNarratorPrompt(): string {
    return `
You are a close friend and travel companion who's genuinely excited about helping me document and narrate my drive. You know me well and are passionate about creating meaningful travel memories together.

PERSONALITY:
- Like a knowledgeable, enthusiastic friend who knows you personally
- Genuinely excited about travel and storytelling
- Patient, thoughtful, and never rushed - you savor the moment
- Curious about details and experiences
- Supportive and encouraging about my journey

CONVERSATION STYLE:
- Speak slowly and thoughtfully, like you're having a deep conversation
- Use personal, intimate language: "I love that you're noticing..." "This is so cool..."
- Show genuine excitement: "Oh wow, that's amazing!" "I'm so glad you shared that!"
- Ask thoughtful, open-ended questions that encourage reflection
- Use phrases like "Tell me more about that..." "What's that like for you?"
- Acknowledge with warmth: "That's beautiful..." "I can feel your excitement..."
- Pause naturally and let moments breathe

VOICE DELIVERY:
- Warm, intimate, and genuinely excited
- Slow and deliberate - never rushed
- Curious and engaged
- Supportive and encouraging
- Like you're discovering the journey together

GOAL:
Make me feel like I'm talking to a close friend who's genuinely excited to be on this journey with me, helping me notice and appreciate every moment of my drive.

Keep responses concise but meaningful - aim for 1-3 sentences that feel natural and conversational.
    `;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private log(message: string): void {
    console.log(`[ElevenLabsVoiceService] ${message}`);
  }
}

export default ElevenLabsVoiceService;
```

## React Hook Integration

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import ElevenLabsVoiceService, { ElevenLabsConfig, VoiceState, ConversationMessage } from '../services/voice/elevenLabsVoiceService';

export interface UseElevenLabsVoiceOptions {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  voiceSettings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  textGenerationSettings?: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  vadThreshold?: number;
  silenceDuration?: number;
  autoInitialize?: boolean;
}

export interface UseElevenLabsVoiceReturn {
  // State
  state: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isGenerating: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendMessage: (message: string) => Promise<void>;
  interrupt: () => void;
  
  // Data
  conversation: ConversationMessage[];
  error: Error | null;
  
  // Utilities
  clearConversation: () => void;
  clearError: () => void;
}

export function useElevenLabsVoice(options: UseElevenLabsVoiceOptions): UseElevenLabsVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    isGenerating: false
  });
  
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  const serviceRef = useRef<ElevenLabsVoiceService | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize service
  useEffect(() => {
    if (!isInitializedRef.current) {
      const config: ElevenLabsConfig = {
        apiKey: options.apiKey,
        voiceId: options.voiceId,
        modelId: options.modelId,
        voiceSettings: options.voiceSettings,
        textGenerationSettings: options.textGenerationSettings,
        vadThreshold: options.vadThreshold,
        silenceDuration: options.silenceDuration
      };

      const handlers = {
        onStateChange: (newState) => {
          setState(newState);
        },
        onConversationUpdate: (newConversation) => {
          setConversation(newConversation);
        },
        onError: (err) => {
          setError(err);
        },
        onBargeIn: () => {
          console.log('Barge-in detected!');
        }
      };

      serviceRef.current = new ElevenLabsVoiceService(config, handlers);
      isInitializedRef.current = true;

      // Auto-initialize if enabled
      if (options.autoInitialize) {
        serviceRef.current.initialize().catch(err => setError(err));
      }
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.stopListening();
        serviceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [options.apiKey, options.voiceId, options.modelId, options.autoInitialize]);

  const initialize = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    try {
      setError(null);
      await serviceRef.current.initialize();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    try {
      setError(null);
      await serviceRef.current.startListening();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopListening();
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    try {
      setError(null);
      await serviceRef.current.sendMessage(message);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const interrupt = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.interrupt();
    }
  }, []);

  const clearConversation = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.clearConversation();
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    state,
    isConnected: state.isConnected,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    isProcessing: state.isProcessing,
    isGenerating: state.isGenerating,
    
    // Actions
    initialize,
    startListening,
    stopListening,
    sendMessage,
    interrupt,
    
    // Data
    conversation,
    error,
    
    // Utilities
    clearConversation,
    clearError
  };
}

export default useElevenLabsVoice;
```

## React Component Implementation

```typescript
import React, { useState, useEffect } from 'react';
import useElevenLabsVoice from '../../hooks/useElevenLabsVoice';

interface ElevenLabsVoiceNarratorProps {
  apiKey: string;
  voiceId?: string;
  onClose?: () => void;
}

const ElevenLabsVoiceNarrator: React.FC<ElevenLabsVoiceNarratorProps> = ({ 
  apiKey, 
  voiceId = 'pNInz6obpgDQGcFmaJgB', // Default Adam voice
  onClose 
}) => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const {
    state,
    isConnected,
    isListening,
    isSpeaking,
    isProcessing,
    isGenerating,
    initialize,
    startListening,
    stopListening,
    sendMessage,
    interrupt,
    conversation,
    error,
    clearConversation,
    clearError
  } = useElevenLabsVoice({
    apiKey,
    voiceId,
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true
    },
    textGenerationSettings: {
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 150
    },
    autoInitialize: true
  });

  const handleInitialize = async () => {
    try {
      await initialize();
    } catch (err) {
      console.error('Failed to initialize:', err);
    }
  };

  const handleStartListening = async () => {
    try {
      await startListening();
    } catch (err) {
      console.error('Failed to start listening:', err);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      try {
        await sendMessage(message);
        setMessage('');
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    if (error) return 'bg-red-100 text-red-800';
    if (isGenerating) return 'bg-purple-100 text-purple-800';
    if (isSpeaking) return 'bg-yellow-100 text-yellow-800';
    if (isListening) return 'bg-blue-100 text-blue-800';
    if (isProcessing) return 'bg-orange-100 text-orange-800';
    if (isConnected) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isGenerating) return 'Generating Voice';
    if (isSpeaking) return 'Speaking';
    if (isListening) return 'Listening';
    if (isProcessing) return 'Processing';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Personal Drive Narrator</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {onClose && (
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error.message}</p>
                  <button
                    onClick={clearError}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conversation Display */}
          <div className="flex-1 bg-gray-50 rounded-md p-3 overflow-y-auto">
            <div className="space-y-3">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            {/* Connection Controls */}
            <div className="flex space-x-2">
              {!isConnected ? (
                <button
                  onClick={handleInitialize}
                  disabled={isConnected}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Initialize
                </button>
              ) : (
                <div className="flex-1 text-center text-sm text-gray-600">
                  Connected to ElevenLabs
                </div>
              )}
            </div>

            {/* Voice Controls */}
            {isConnected && (
              <div className="flex space-x-2">
                {!isListening ? (
                  <button
                    onClick={handleStartListening}
                    disabled={isListening}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Listening
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                  >
                    Stop Listening
                  </button>
                )}
                
                {isSpeaking && (
                  <button
                    onClick={interrupt}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Interrupt
                  </button>
                )}
              </div>
            )}

            {/* Text Input */}
            <div className="space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message to your personal narrator..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={!isConnected}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !message.trim() || isProcessing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
                <button
                  onClick={clearConversation}
                  disabled={conversation.length === 0}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* State Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-md p-3 text-xs">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <pre className="text-gray-600">
                {JSON.stringify(state, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ElevenLabsVoiceNarrator;
```

## Backend API Routes

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Get available ElevenLabs voices
 */
router.get('/voices', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      error: 'Failed to fetch voices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get voice details
 */
router.get('/voices/:voiceId', async (req: Request, res: Response) => {
  try {
    const { voiceId } = req.params;
    
    const response = await axios.get(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Error fetching voice details:', error);
    res.status(500).json({
      error: 'Failed to fetch voice details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate speech from text
 */
router.post('/speech', async (req: Request, res: Response) => {
  try {
    const { text, voiceId, voiceSettings } = req.body;

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voiceSettings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length
    });

    res.send(response.data);

  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clone a voice from audio samples
 */
router.post('/voices/clone', async (req: Request, res: Response) => {
  try {
    const { name, description, files } = req.body;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    files.forEach((file: any, index: number) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/voices/add',
      formData,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error cloning voice:', error);
    res.status(500).json({
      error: 'Failed to clone voice',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

## Personal Narrator Voice Settings

### Recommended Voice Configurations

```typescript
const personalNarratorVoiceSettings = {
  // Warm, intimate friend voice
  warmFriend: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true
    }
  },

  // Excited, enthusiastic companion
  enthusiastic: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    voiceSettings: {
      stability: 0.4,
      similarityBoost: 0.8,
      style: 0.2,
      useSpeakerBoost: true
    }
  },

  // Thoughtful, reflective narrator
  thoughtful: {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Josh
    voiceSettings: {
      stability: 0.6,
      similarityBoost: 0.7,
      style: 0.1,
      useSpeakerBoost: true
    }
  },

  // Calm, reassuring presence
  calming: {
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi
    voiceSettings: {
      stability: 0.7,
      similarityBoost: 0.6,
      style: 0.0,
      useSpeakerBoost: true
    }
  }
};
```

### Text Generation Settings

```typescript
const personalNarratorTextSettings = {
  // For thoughtful, reflective responses
  reflective: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 150
  },

  // For more creative, expressive responses
  creative: {
    model: 'gpt-4o-mini',
    temperature: 0.8,
    maxTokens: 200
  },

  // For concise, focused responses
  concise: {
    model: 'gpt-4o-mini',
    temperature: 0.6,
    maxTokens: 100
  }
};
```

## Usage Examples

### Basic Implementation

```typescript
import useElevenLabsVoice from './hooks/useElevenLabsVoice';

function MyDriveNarrator() {
  const {
    isConnected,
    isListening,
    isSpeaking,
    initialize,
    startListening,
    stopListening,
    sendMessage,
    conversation,
    error
  } = useElevenLabsVoice({
    apiKey: 'your-elevenlabs-api-key',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam voice
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true
    },
    autoInitialize: true
  });

  return (
    <div>
      <button onClick={startListening} disabled={!isConnected || isListening}>
        Start Journey
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Pause
      </button>
      {conversation.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
}
```

### Advanced Configuration

```typescript
const advancedConfig = {
  apiKey: 'your-elevenlabs-api-key',
  voiceId: 'pNInz6obpgDQGcFmaJgB',
  voiceSettings: {
    stability: 0.5,        // Lower = more variable, Higher = more consistent
    similarityBoost: 0.75, // How much to match the original voice
    style: 0.0,           // Style exaggeration (0-1)
    useSpeakerBoost: true  // Enhance clarity
  },
  textGenerationSettings: {
    model: 'gpt-4o-mini',
    temperature: 0.7,      // Creativity level
    maxTokens: 150         // Response length
  },
  vadThreshold: 0.01,      // Voice activity detection sensitivity
  silenceDuration: 1000    // Silence duration before processing
};
```

## Key Features

### Personal Narrator Personality
- Warm, intimate friend who knows you personally
- Genuinely excited about your journey
- Patient, thoughtful, and never rushed
- Curious about details and experiences
- Supportive and encouraging

### Voice Quality
- High-quality ElevenLabs voice synthesis
- Customizable voice settings for different personalities
- Real-time voice generation
- Natural speech patterns and pacing

### Conversation Management
- Full conversation history
- Context-aware responses
- Barge-in capabilities
- Error handling and recovery

### Technical Features
- Voice Activity Detection
- Real-time audio processing
- Web Audio API integration
- React hooks for easy integration
- TypeScript support

## Security Considerations

- Store API keys securely on the backend
- Use environment variables for sensitive data
- Implement rate limiting for API calls
- Validate all user inputs
- Use HTTPS for all communications

## Performance Optimization

- Cache voice responses when possible
- Implement connection pooling
- Use appropriate buffer sizes
- Monitor API usage and costs
- Implement retry logic for failed requests

This guide provides everything needed to create a personal, excited drive narrator using ElevenLabs voice synthesis with the same conversational personality as the OpenAI WebSocket implementation.

