import { Router } from "express";
import { PreferenceController } from "../controllers/PreferenceController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { preferenceSchema } from "./schemas.js";

const router = Router();
const controller = new PreferenceController();

router.use(requireAuth);
router.get("/", controller.get);
router.put("/", validate({ body: preferenceSchema }), controller.update);

export { router as preferenceRoutes };
