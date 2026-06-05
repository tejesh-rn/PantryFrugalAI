import type { Request } from "express";
import { AppError } from "./AppError.js";

export const requireUser = (req: Request) => {
  if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  return req.user;
};
