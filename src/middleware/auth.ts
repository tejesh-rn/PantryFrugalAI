import type { RequestHandler } from "express";
import { JwtService } from "../services/JwtService.js";
import { AppError } from "../utils/AppError.js";

const jwt = new JwtService();

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new AppError("Missing bearer token", 401, "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = jwt.verify(header.slice("Bearer ".length));
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};
