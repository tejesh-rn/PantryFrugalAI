import OpenAI from "openai";
import { env } from "../config/env.js";

const providerConfig = {
  openai: {
    name: "openai",
    model: env.OPENAI_MODEL,
    apiKey: env.OPENAI_API_KEY,
    baseURL: undefined
  },
  gemini: {
    name: "gemini",
    model: env.GEMINI_MODEL,
    apiKey: env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
  }
} as const;

export const aiProvider = providerConfig[env.AI_PROVIDER];

export const openai = new OpenAI({
  apiKey: aiProvider.apiKey,
  baseURL: aiProvider.baseURL
});
