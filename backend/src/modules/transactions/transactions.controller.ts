import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as transactionsService from "./transactions.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await transactionsService.listTransactions(req.userId!, req.query as never);
  res.json(result);
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionsService.getTransaction(req.userId!, req.params.id);
  res.json({ transaction });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionsService.createTransaction(req.userId!, req.body);
  res.status(201).json({ transaction });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionsService.updateTransaction(req.userId!, req.params.id, req.body);
  res.json({ transaction });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await transactionsService.deleteTransaction(req.userId!, req.params.id);
  res.status(204).send();
});
