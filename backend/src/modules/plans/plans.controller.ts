import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as plansService from "./plans.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const plans = await plansService.listPlans(req.userId!);
  res.json({ plans });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.createPlan(req.userId!, req.body);
  res.status(201).json({ plan });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const plan = await plansService.updatePlan(req.userId!, req.params.id, req.body);
  res.json({ plan });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await plansService.deletePlan(req.userId!, req.params.id);
  res.status(204).send();
});
