import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { currentPeriodMonthYear } from "../../lib/period.js";
import * as reportsService from "./reports.service.js";

function resolvePeriod(req: Request) {
  const current = currentPeriodMonthYear();
  const month = Number(req.query.month) || current.month;
  const year = Number(req.query.year) || current.year;
  return { month, year };
}

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = resolvePeriod(req);
  const data = await reportsService.getSummary(req.userId!, month, year);
  res.json(data);
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const { month, year } = resolvePeriod(req);
  const csv = await reportsService.getTransactionsCsv(req.userId!, month, year);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="transactions-${year}-${String(month).padStart(2, "0")}.csv"`);
  res.send(csv);
});
