import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./settings.controller.js";
import { updateSettingsSchema } from "./settings.schemas.js";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

settingsRouter.get("/", controller.get);
settingsRouter.patch("/", validate({ body: updateSettingsSchema }), controller.update);
