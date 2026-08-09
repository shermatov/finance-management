import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../../lib/email.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const toPublicUser = (user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
  emailVerified: user.emailVerified,
});

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });
  const refreshToken = signRefreshToken({ sub: userId });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function register(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const passwordHash = await hashPassword(input.password);
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      emailVerifyToken,
      settings: { create: {} },
      categories: { create: DEFAULT_CATEGORIES },
    },
  });

  await sendVerificationEmail(user.email, user.firstName, emailVerifyToken);

  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Invalid email or password");

  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw ApiError.unauthorized("User no longer exists");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // don't leak account existence

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
  });

  await sendPasswordResetEmail(user.email, user.firstName, token);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
  });
  if (!user) throw ApiError.badRequest("Invalid or expired reset token");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });

  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw ApiError.badRequest("Invalid verification token");

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: { firstName: string; lastName: string }) {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toPublicUser(user);
}

/**
 * Verifies the current password, then rotates the hash and revokes every other session's
 * refresh token (a changed password should immediately end sessions elsewhere). The caller's
 * own session is kept alive by issuing a fresh token pair, so this device doesn't get logged out.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });

  const tokens = await issueTokenPair(user.id, user.email);
  return { user: toPublicUser(user), ...tokens };
}

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "INCOME" as const, icon: "banknote", color: "#22C55E", isDefault: true },
  { name: "Business", type: "INCOME" as const, icon: "briefcase", color: "#16A34A", isDefault: true },
  { name: "Freelance", type: "INCOME" as const, icon: "laptop", color: "#4ADE80", isDefault: true },
  { name: "Investments", type: "INCOME" as const, icon: "trending-up", color: "#15803D", isDefault: true },
  { name: "Food", type: "EXPENSE" as const, icon: "utensils", color: "#EF4444", isDefault: true },
  { name: "Shopping", type: "EXPENSE" as const, icon: "shopping-bag", color: "#F97316", isDefault: true },
  { name: "Transport", type: "EXPENSE" as const, icon: "car", color: "#F59E0B", isDefault: true },
  { name: "Rent", type: "EXPENSE" as const, icon: "home", color: "#8B5CF6", isDefault: true },
  { name: "Entertainment", type: "EXPENSE" as const, icon: "film", color: "#EC4899", isDefault: true },
  { name: "Healthcare", type: "EXPENSE" as const, icon: "heart-pulse", color: "#F43F5E", isDefault: true },
  { name: "Education", type: "EXPENSE" as const, icon: "graduation-cap", color: "#3B82F6", isDefault: true },
  { name: "Travel", type: "EXPENSE" as const, icon: "plane", color: "#06B6D4", isDefault: true },
];
