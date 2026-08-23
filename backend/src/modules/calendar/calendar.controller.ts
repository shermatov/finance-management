import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as calendarService from "./calendar.service.js";

export const month = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const m = Number(req.query.month) || now.getMonth() + 1;
  const y = Number(req.query.year) || now.getFullYear();
  const data = await calendarService.getMonth(req.userId!, m, y);
  res.json({ month: m, year: y, ...data });
});
