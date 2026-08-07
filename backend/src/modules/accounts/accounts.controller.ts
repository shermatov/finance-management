import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as accountsService from "./accounts.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const accounts = await accountsService.listAccounts(req.userId!);
  res.json({ accounts });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountsService.getAccount(req.userId!, req.params.id);
  res.json({ account });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountsService.createAccount(req.userId!, req.body);
  res.status(201).json({ account });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const account = await accountsService.updateAccount(req.userId!, req.params.id, req.body);
  res.json({ account });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await accountsService.deleteAccount(req.userId!, req.params.id);
  res.status(204).send();
});

export const transfer = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await accountsService.transferBetweenAccounts(req.userId!, req.body);
  res.status(201).json({ transaction });
});
