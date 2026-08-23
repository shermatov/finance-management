import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./calendar.controller.js";

export const calendarRouter = Router();

calendarRouter.use(requireAuth);
calendarRouter.get("/", controller.month);
