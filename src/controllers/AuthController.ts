import { AuthService } from "../services/AuthService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUser } from "../utils/requireUser.js";

const auth = new AuthService();

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await auth.register(req.body);
    res.status(201).json({ success: true, ...result });
  });

  login = asyncHandler(async (req, res) => {
    const result = await auth.login(req.body);
    res.json({ success: true, ...result });
  });

  me = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const result = await auth.me(user.id);
    res.json({ success: true, user: result });
  });
}
