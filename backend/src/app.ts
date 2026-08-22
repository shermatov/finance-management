import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { apiRateLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { accountsRouter } from "./modules/accounts/accounts.routes.js";
import { categoriesRouter } from "./modules/categories/categories.routes.js";
import { transactionsRouter } from "./modules/transactions/transactions.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { analyticsRouter } from "./modules/analytics/analytics.routes.js";
import { billsRouter } from "./modules/bills/bills.routes.js";
import { goalsRouter } from "./modules/goals/goals.routes.js";
import { budgetsRouter } from "./modules/budgets/budgets.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(apiRateLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/settings", settingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
