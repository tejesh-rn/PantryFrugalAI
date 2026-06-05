import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { APIConnectionError, APIError } from "openai";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code ?? code;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = error.flatten();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = error.code === "P2002" ? 409 : 400;
    message = error.code === "P2002" ? "Resource already exists" : "Database request failed";
    code = error.code;
    details = error.meta;
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = "Database is unavailable";
    code = "DATABASE_UNAVAILABLE";
    details = error.message;
  } else if (error instanceof APIConnectionError) {
    statusCode = 503;
    message = `Unable to reach ${getAiProviderLabel()}. Please try again shortly.`;
    code = "AI_CONNECTION_ERROR";
    details = { provider: env.AI_PROVIDER };
  } else if (error instanceof APIError) {
    statusCode = error.code === "insufficient_quota" ? 402 : error.status ?? 502;
    message = getAiErrorMessage(error);
    code = error.code?.toUpperCase() ?? "AI_API_ERROR";
    details = {
      provider: env.AI_PROVIDER,
      requestId: error.request_id,
      type: error.type,
      status: error.status
    };
  }

  logger.error("Request failed", {
    method: req.method,
    path: req.path,
    statusCode,
    code,
    error: getLoggableError(error)
  });

  res.status(statusCode).json({
    success: false,
    message,
    error: code,
    ...(env.NODE_ENV !== "production" && details ? { details } : {})
  });
};

function getAiErrorMessage(error: APIError): string {
  const provider = getAiProviderLabel();

  if (error.code === "insufficient_quota") {
    return `${provider} quota exceeded. Please check your ${provider} API plan, billing, or key limits.`;
  }

  if (error.status === 401) {
    return `${provider} API key is invalid or missing.`;
  }

  if (error.status === 429) {
    return `${provider} rate limit reached. Please try again shortly.`;
  }

  return `${provider} request failed. Please try again shortly.`;
}

function getAiProviderLabel(): string {
  return env.AI_PROVIDER === "gemini" ? "Gemini" : "OpenAI";
}

function getLoggableError(error: unknown) {
  if (error instanceof APIError) {
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      requestId: error.request_id
    };
  }

  return error;
}
