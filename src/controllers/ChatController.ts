import { ChatService } from "../services/ChatService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUser } from "../utils/requireUser.js";

const chat = new ChatService();

export class ChatController {
  create = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await chat.chat(user.id, req.body);
    res.json({ success: true, ...result });
  });
}
