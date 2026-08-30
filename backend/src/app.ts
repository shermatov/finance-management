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
import { calendarRouter } from "./modules/calendar/calendar.routes.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { billsRouter } from "./modules/bills/bills.routes.js";
import { goalsRouter } from "./modules/goals/goals.routes.js";
import { budgetsRouter } from "./modules/budgets/budgets.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { attachmentsRouter } from "./modules/attachments/attachments.routes.js";
import { plansRouter } from "./modules/plans/plans.routes.js";
import { habitsRouter } from "./modules/habits/habits.routes.js";

export const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
// 4mb accommodates a ~2MB receipt photo attachment sent as a base64 data URI
// (base64 adds ~37% overhead on top of the raw file, plus JSON field wrapping).
app.use(express.json({ limit: "4mb" }));
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
app.use("/api/calendar", calendarRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/bills", billsRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/attachments", attachmentsRouter);
app.use("/api/plans", plansRouter);
app.use("/api/habits", habitsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
