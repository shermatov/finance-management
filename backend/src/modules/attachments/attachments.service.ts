import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

async function assertOwnedTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
  if (!transaction) throw ApiError.badRequest("Transaction not found");
}

export async function listAttachments(userId: string, transactionId: string) {
  await assertOwnedTransaction(userId, transactionId);
  return prisma.attachment.findMany({ where: { userId, transactionId }, orderBy: { createdAt: "desc" } });
}

export async function createAttachment(
  userId: string,
  input: { transactionId: string; fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }
) {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw ApiError.badRequest("Only image attachments (JPEG, PNG, WEBP, GIF) are supported");
  }
  await assertOwnedTransaction(userId, input.transactionId);
  return prisma.attachment.create({ data: { userId, ...input } });
}

export async function deleteAttachment(userId: string, id: string) {
  const attachment = await prisma.attachment.findFirst({ where: { id, userId } });
  if (!attachment) throw ApiError.notFound("Attachment not found");
  await prisma.attachment.delete({ where: { id } });
}
