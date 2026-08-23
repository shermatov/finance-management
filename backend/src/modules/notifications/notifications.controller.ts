import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as notificationsService from "./notifications.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await notificationsService.getNotifications(req.userId!);
  res.json({ notifications });
});
