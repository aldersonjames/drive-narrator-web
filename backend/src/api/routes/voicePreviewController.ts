import type { Request, Response, Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import { validate } from '../../utils/validation';

const previewRequestSchema = z.object({
  voiceId: z.enum(['alloy', 'echo', 'shimmer']), // Only Realtime API voices
  input: z.string().min(1).max(1000),
  instructions: z.string().min(1).max(1000),
  speed: z.number().min(0.25).max(4.0).optional(),
});

interface Dependencies {
  openai: OpenAI;
}

export const createVoicePreviewController = (deps: Dependencies) => {
  return {
    preview: async (req: Request, res: Response): Promise<Response> => {
      let voiceId = 'unknown';
      let text = 'unknown';
      
      try {
        const validated = validate(previewRequestSchema, req.body);
        voiceId = validated.voiceId;
        text = validated.input;

        // Generate speech using OpenAI TTS with instructions (like openai-fm)
        const mp3 = await deps.openai.audio.speech.create({
          model: 'tts-1',
          voice: voiceId,
          input: validated.input,
          instructions: validated.instructions,
          response_format: 'mp3',
        });

        // Convert the response to a buffer
        const buffer = Buffer.from(await mp3.arrayBuffer());

        // Set appropriate headers
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length,
          'Cache-Control': 'public, max-age=3600',
        });

        res.send(buffer);
        return res;
      } catch (error) {
        console.error('Voice preview error:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          voiceId,
          text: text.substring(0, 50) + '...'
        });
        return res.status(500).json({
          code: 'PREVIEW_GENERATION_FAILED',
          message: 'Failed to generate voice preview',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
  };
};

