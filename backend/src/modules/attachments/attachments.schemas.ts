import { z } from "zod";

export const listQuerySchema = z.object({
  transactionId: z.string().uuid(),
});

export const createAttachmentSchema = z.object({
  transactionId: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  // A data: URI — attachments are stored inline (no object storage configured), so this
  // stays small: capped well under Postgres row/JSON-body limits by sizeBytes below.
  fileUrl: z.string().min(1),
  mimeType: z.string().min(1).max(100),
  sizeBytes: z.coerce.number().int().positive().max(2 * 1024 * 1024),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
