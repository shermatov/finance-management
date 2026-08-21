import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as budgetsService from "./budgets.service.js";
import { currentPeriodMonthYear } from "../../lib/period.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const current = currentPeriodMonthYear();
  const month = Number(req.query.month) || current.month;
  const year = Number(req.query.year) || current.year;
  const budgets = await budgetsService.listBudgets(req.userId!, month, year);
  res.json({ budgets, month, year });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetsService.createBudget(req.userId!, req.body);
  res.status(201).json({ budget });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetsService.updateBudget(req.userId!, req.params.id, req.body);
  res.json({ budget });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await budgetsService.deleteBudget(req.userId!, req.params.id);
  res.status(204).send();
});
