import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as habitsService from "./habits.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const habits = await habitsService.listHabits(req.userId!);
  res.json({ habits });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const habit = await habitsService.createHabit(req.userId!, req.body);
  res.status(201).json({ habit });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const habit = await habitsService.updateHabit(req.userId!, req.params.id, req.body);
  res.json({ habit });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await habitsService.deleteHabit(req.userId!, req.params.id);
  res.status(204).send();
});

export const toggleToday = asyncHandler(async (req: Request, res: Response) => {
  const habit = await habitsService.toggleToday(req.userId!, req.params.id);
  res.json({ habit });
});
