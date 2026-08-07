import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as dashboardService from "./dashboard.service.js";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getSummary(req.userId!);
  res.json(data);
});
