import { Router } from "express";
import { ChatController } from "../controllers/ChatController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { chatSchema } from "./schemas.js";

const router = Router();
const controller = new ChatController();

router.post("/", requireAuth, validate({ body: chatSchema }), controller.create);

export { router as chatRoutes };
