import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const preferenceSchema = z.object({
  monthlyBudget: z.number().nonnegative().nullable().optional(),
  dietaryPreferences: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  familySize: z.number().int().min(1).max(50).optional(),
  favoriteBrands: z.array(z.string().trim().min(1).max(80)).max(100).optional()
});

export const idParamsSchema = z.object({
  id: z.string().uuid()
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  conversationId: z.string().uuid().optional()
});
