import { Router } from "express";
import { ConversationController } from "../controllers/ConversationController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { idParamsSchema } from "./schemas.js";

const router = Router();
const controller = new ConversationController();

router.use(requireAuth);
router.get("/", controller.list);
router.get("/:id", validate({ params: idParamsSchema }), controller.get);
router.delete("/:id", validate({ params: idParamsSchema }), controller.delete);

export { router as conversationRoutes };
