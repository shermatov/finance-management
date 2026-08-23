import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.get("/", controller.list);
