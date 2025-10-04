import OpenAI from 'openai';
import { logger } from './logger';

/**
 * Creates a properly configured OpenAI client with environment variable validation
 * This prevents the common issue of accidentally using test keys in production
 */
export function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    logger.warn('OpenAI API key not found in environment variables');
    return null;
  }
  
  // Check for common test/placeholder keys
  const testKeys = ['sk-test-key', 'sk-test', 'test-key', 'your-api-key-here'];
  if (testKeys.some(testKey => apiKey.includes(testKey))) {
    logger.warn('OpenAI API key appears to be a test/placeholder key');
    return null;
  }
  
  // Validate key format (OpenAI keys start with 'sk-' and are typically 51+ characters)
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    logger.warn('OpenAI API key format appears invalid');
    return null;
  }
  
  try {
    const client = new OpenAI({ apiKey });
    logger.info('OpenAI client created successfully');
    return client;
  } catch (error) {
    logger.error('Failed to create OpenAI client', { error });
    return null;
  }
}

/**
 * Checks if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return createOpenAIClient() !== null;
}
