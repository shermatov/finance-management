import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as budgetsService from "./budgets.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
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
