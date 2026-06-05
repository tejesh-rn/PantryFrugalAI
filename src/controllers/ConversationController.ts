import { ConversationService } from "../services/ConversationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUser } from "../utils/requireUser.js";

const conversations = new ConversationService();

export class ConversationController {
  list = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    res.json({ success: true, conversations: await conversations.list(user.id) });
  });

  get = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    res.json({ success: true, conversation: await conversations.get(req.params.id, user.id) });
  });

  delete = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    await conversations.delete(req.params.id, user.id);
    res.status(204).send();
  });
}
