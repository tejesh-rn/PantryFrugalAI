import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { chatRoutes } from "./chatRoutes.js";
import { conversationRoutes } from "./conversationRoutes.js";
import { preferenceRoutes } from "./preferenceRoutes.js";
import { MCPService } from "../mcp/MCPService.js";

const router = Router();
const mcp = new MCPService();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    quickCommerce: {
      configured: mcp.isConfigured(),
      servers: mcp.getConfiguredServers()
    }
  });
});

router.use("/auth", authRoutes);
router.use("/preferences", preferenceRoutes);
router.use("/conversations", conversationRoutes);
router.use("/chat", chatRoutes);

export { router as apiRoutes };
