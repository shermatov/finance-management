import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./analytics.controller.js";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get("/overview", controller.overview);
analyticsRouter.get("/category-breakdown", controller.categoryBreakdown);
