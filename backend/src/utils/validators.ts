import { z } from 'zod';

/**
 * Signup validation schema.
 */
export const signupSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .trim()
    .toLowerCase()
    .email('Email must be a valid email'),
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
});

/**
 * Login validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .trim()
    .toLowerCase()
    .email('Email must be a valid email'),
  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(1, 'Password is required'),
});

/**
 * Log ingestion schema for a single provider event.
 */
export const logSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'cohere', 'replicate']),
  model: z.string().min(1, 'Model is required'),
  tokens: z.number().int().min(0, 'Tokens must be a non-negative integer'),
  cost: z.number().min(0, 'Cost must be a non-negative number'),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z
    .string()
    .datetime()
    .optional()
    .default(() => new Date().toISOString()),
});

/**
 * Batch schema for multiple log events.
 */
export const batchLogSchema = z
  .array(logSchema)
  .min(1, 'At least one log is required')
  .max(100, 'Batch size must be 100 or fewer');

/**
 * Query schema for stats endpoints.
 */
const dateStringSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid date format',
  });

export const statsQuerySchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
  provider: z.string().optional(),
  projectId: z.string().uuid().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LogInput = z.infer<typeof logSchema>;
export type BatchLogInput = z.infer<typeof batchLogSchema>;
export type StatsQueryInput = z.infer<typeof statsQuerySchema>;

export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: Record<string, string>;
    };

/**
 * Validate data against a Zod schema and return formatted errors.
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    errors[path] = issue.message;
  }

  return { success: false, errors };
}

