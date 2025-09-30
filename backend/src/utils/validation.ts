import type { ZodIssue } from 'zod';
import { ZodError } from 'zod';

export class ValidationError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly issues: ZodIssue[];

  constructor(
    message: string,
    options: { code?: string; status?: number; issues?: ZodIssue[] } = {},
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = options.code ?? 'VALIDATION_FAILED';
    this.status = options.status ?? 400;
    this.issues = options.issues ?? [];
  }
}

export const validate = <T>(schema: { parse: (data: unknown) => T }, payload: unknown): T => {
  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Request validation failed.', {
        issues: error.errors,
      });
    }
    throw error;
  }
};
