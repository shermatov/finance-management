import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

async function sendEmail(to: string, subject: string, html: string, devFallbackNote: string) {
  if (!resend) {
    // No RESEND_API_KEY configured (e.g. local dev) — log instead of sending.
    console.info(`[dev] ${devFallbackNote}`);
    return;
  }

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

export function sendVerificationEmail(to: string, firstName: string, token: string) {
  const link = `${env.CORS_ORIGIN}/verify-email?token=${token}`;
  return sendEmail(
    to,
    "Verify your email",
    `<p>Hi ${firstName},</p><p>Welcome to Personal Finance Manager. Please verify your email address:</p><p><a href="${link}">${link}</a></p>`,
    `Email verification link for ${to}: ${link}`
  );
}

export function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const link = `${env.CORS_ORIGIN}/reset-password?token=${token}`;
  return sendEmail(
    to,
    "Reset your password",
    `<p>Hi ${firstName},</p><p>You requested a password reset. This link expires in 1 hour:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    `Password reset link for ${to}: ${link}`
  );
}
