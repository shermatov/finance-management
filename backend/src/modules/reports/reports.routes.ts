import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./reports.controller.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);
reportsRouter.get("/summary", controller.summary);
reportsRouter.get("/export", controller.exportCsv);
