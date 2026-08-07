import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as settingsService from "./settings.service.js";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.getSettings(req.userId!);
  res.json({ settings });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const settings = await settingsService.updateSettings(req.userId!, req.body);
  res.json({ settings });
});
