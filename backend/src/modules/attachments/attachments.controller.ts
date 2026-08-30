import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as attachmentsService from "./attachments.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const attachments = await attachmentsService.listAttachments(req.userId!, req.query.transactionId as string);
  res.json({ attachments });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentsService.createAttachment(req.userId!, req.body);
  res.status(201).json({ attachment });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await attachmentsService.deleteAttachment(req.userId!, req.params.id);
  res.status(204).send();
});
