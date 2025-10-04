import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const conversationRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  command: z.object({
    type: z.string(),
    action: z.string(),
    parameters: z.record(z.any()),
    confidence: z.number(),
    originalText: z.string(),
  }).optional(),
  context: z.object({
    driveId: z.string().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
    }).optional(),
    interests: z.array(z.string()).optional(),
    currentPoi: z.object({
      id: z.string(),
      name: z.string(),
      distance: z.number(),
      eta: z.number(),
    }).optional(),
    recentCommands: z.array(z.any()).optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant']),
    content: z.string(),
    timestamp: z.string(),
    metadata: z.any().optional(),
  })).optional(),
  voiceSettings: z.object({
    voiceId: z.string(),
    personaId: z.string(),
    accentId: z.string(),
  }).optional(),
});

export const createConversationController = (deps: { openai: any }) => {
  const { openai } = deps;

  const processConversation = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const validated = conversationRequestSchema.parse(req.body);
      const { message, command, context, conversationHistory = [], voiceSettings } = validated;

      logger.info('Processing conversation', {
        message: message.substring(0, 100),
        hasCommand: !!command,
        contextKeys: Object.keys(context || {}),
        historyLength: conversationHistory.length,
      });

      // Build conversation context for OpenAI
      const systemPrompt = buildSystemPrompt(context, voiceSettings);
      const messages = buildConversationMessages(systemPrompt, conversationHistory, message);

      // Call OpenAI GPT
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
      const processingTime = Date.now() - startTime;

      logger.info('Conversation processed', {
        responseLength: response.length,
        processingTime,
        model: 'gpt-4o-mini',
      });

      res.json({
        text: response,
        processingTime,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof z.ZodError) {
        logger.error('Conversation validation error', {
          error: error.errors,
          processingTime,
        });
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      logger.error('Conversation processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
      });

      res.status(500).json({
        error: 'Failed to process conversation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return {
    processConversation,
  };
};

function buildSystemPrompt(context?: any, voiceSettings?: any): string {
  const persona = voiceSettings?.personaId || 'local-expert';
  const accent = voiceSettings?.accentId || 'american';
  
  let prompt = `You are Drive Narrator, a voice-first companion for drivers. You help users discover interesting places and stories during their drives.

PERSONA: ${persona}
ACCENT: ${accent}

CORE CAPABILITIES:
- Provide engaging stories about points of interest
- Help users discover new places based on their interests
- Answer questions about local attractions, history, and culture
- Manage drive sessions and POI alerts
- Adjust voice settings and preferences

CURRENT CONTEXT:`;

  if (context?.location) {
    prompt += `\n- Location: ${context.location.latitude}, ${context.location.longitude}`;
    if (context.location.address) {
      prompt += ` (${context.location.address})`;
    }
  }

  if (context?.interests && context.interests.length > 0) {
    prompt += `\n- User Interests: ${context.interests.join(', ')}`;
  }

  if (context?.currentPoi) {
    prompt += `\n- Current POI: ${context.currentPoi.name} (${context.currentPoi.distance} miles away, ${context.currentPoi.eta} minutes)`;
  }

  if (context?.driveId) {
    prompt += `\n- Drive Session: ${context.driveId}`;
  }

  prompt += `\n\nRESPONSE GUIDELINES:
- Keep responses conversational and engaging
- Be concise but informative (2-3 sentences max)
- Use the specified persona and accent naturally
- Ask follow-up questions to learn more about user interests
- Provide specific, actionable information when possible
- Be enthusiastic about local discoveries
- Use natural speech patterns for voice interaction`;

  return prompt;
}

function buildConversationMessages(systemPrompt: string, history: any[], currentMessage: string) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Add conversation history (last 10 turns)
  const recentHistory = history.slice(-10);
  for (const turn of recentHistory) {
    messages.push({
      role: turn.role,
      content: turn.content,
    });
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentMessage,
  });

  return messages;
}