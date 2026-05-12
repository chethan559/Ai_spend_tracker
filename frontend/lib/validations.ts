import { z } from 'zod';

/**
 * Validation schema for the login form.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * Validation schema for the signup form.
 */
export const signupSchema = z
  .object({
    email: z
      .string()
      .email('Enter a valid email address')
      .transform((value) => value.toLowerCase()),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be at most 100 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
