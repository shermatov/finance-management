import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as billsService from "./bills.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const bills = await billsService.listBills(req.userId!);
  res.json({ bills });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billsService.createBill(req.userId!, req.body);
  res.status(201).json({ bill });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billsService.updateBill(req.userId!, req.params.id, req.body);
  res.json({ bill });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await billsService.deleteBill(req.userId!, req.params.id);
  res.status(204).send();
});

export const markPaid = asyncHandler(async (req: Request, res: Response) => {
  const bill = await billsService.markBillPaid(req.userId!, req.params.id);
  res.json({ bill });
});
