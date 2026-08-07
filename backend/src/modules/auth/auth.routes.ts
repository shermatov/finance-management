import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rateLimit.js";
import * as controller from "./auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate({ body: registerSchema }), controller.register);
authRouter.post("/login", authRateLimiter, validate({ body: loginSchema }), controller.login);
authRouter.post("/refresh", validate({ body: refreshSchema }), controller.refresh);
authRouter.post("/logout", validate({ body: refreshSchema }), controller.logout);
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword
);
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword
);
authRouter.get("/verify-email/:token", controller.verifyEmail);
authRouter.get("/me", requireAuth, controller.me);
authRouter.patch("/me", requireAuth, validate({ body: updateProfileSchema }), controller.updateProfile);
authRouter.post(
  "/change-password",
  requireAuth,
  validate({ body: changePasswordSchema }),
  controller.changePassword
);
