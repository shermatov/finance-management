import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as analyticsService from "./analytics.service.js";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const periods = Number(req.query.periods) || 12;
  const data = await analyticsService.getOverview(req.userId!, periods);
  res.json(data);
});

export const categoryBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const month = req.query.month ? Number(req.query.month) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const data = await analyticsService.getCategoryBreakdown(req.userId!, month, year);
  res.json(data);
});
