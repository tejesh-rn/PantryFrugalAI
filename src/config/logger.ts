import winston from "winston";
import { env } from "./env.js";

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "pantry-frugal-ai" },
  transports: [new winston.transports.Console()]
});
