import { PreferenceService } from "../services/PreferenceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUser } from "../utils/requireUser.js";

const preferences = new PreferenceService();

export class PreferenceController {
  get = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const preference = await preferences.get(user.id);
    res.json({ success: true, preference });
  });

  update = asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const preference = await preferences.update(user.id, req.body);
    res.json({ success: true, preference });
  });
}
