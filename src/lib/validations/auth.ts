import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60)
});

export const signInSchema = loginSchema;
export const signUpSchema = registerSchema;
