import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listCategories(userId: string) {
  return prisma.category.findMany({ where: { userId }, orderBy: [{ type: "asc" }, { name: "asc" }] });
}

export async function createCategory(
  userId: string,
  input: { name: string; type: "INCOME" | "EXPENSE"; icon: string; color: string }
) {
  const existing = await prisma.category.findFirst({
    where: { userId, name: input.name, type: input.type },
  });
  if (existing) throw ApiError.conflict("A category with this name and type already exists");

  return prisma.category.create({ data: { userId, ...input } });
}

export async function updateCategory(userId: string, id: string, input: Record<string, unknown>) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw ApiError.notFound("Category not found");
  return prisma.category.update({ where: { id }, data: input as never });
}

export async function deleteCategory(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw ApiError.notFound("Category not found");
  if (category.isDefault) throw ApiError.badRequest("Default categories cannot be deleted");
  await prisma.category.delete({ where: { id } });
}
