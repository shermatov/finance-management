import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as goalsService from "./goals.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const goals = await goalsService.listGoals(req.userId!);
  res.json({ goals });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalsService.createGoal(req.userId!, req.body);
  res.status(201).json({ goal });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalsService.updateGoal(req.userId!, req.params.id, req.body);
  res.json({ goal });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await goalsService.deleteGoal(req.userId!, req.params.id);
  res.status(204).send();
});

export const contribute = asyncHandler(async (req: Request, res: Response) => {
  const goal = await goalsService.contributeToGoal(req.userId!, req.params.id, req.body.amount);
  res.json({ goal });
});
