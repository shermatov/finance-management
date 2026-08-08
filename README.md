# Personal Finance Manager

A premium personal finance management SaaS app — accounts, transactions, budgets, savings goals,
bills, analytics and AI insights, built with React 19 + Express + PostgreSQL/Prisma.

## Status: Phase 1 (foundation)

This phase ships:
- Monorepo scaffold (`frontend/`, `backend/`)
- Full Prisma schema covering the entire data model (accounts, transactions, categories,
  budgets, savings goals, bills, notifications, settings, attachments, refresh tokens)
- JWT auth (register / login / refresh / logout) with bcrypt password hashing, helmet,
  rate limiting and input validation
- Accounts (+ transfers) + Transactions + Categories CRUD API, plus a dashboard summary endpoint
- Backend test suite (Vitest + Supertest) covering auth and health checks
- Frontend: full auth flow (register/login/logout, silent refresh), dark/light/system theme,
  responsive sidebar + topbar layout, dashboard with live stat cards, Recharts cash-flow and
  category-breakdown charts, financial health score, and full CRUD pages for Accounts,
  Transactions (with filters/search/pagination) and Categories
- Verified end-to-end against a real Postgres database and in a real browser (light + dark,
  desktop + mobile)

Everything else in the full spec (budgets, savings goals, bills, calendar, reports, AI
insights, OCR, bank-statement import, PWA/offline, drag-and-drop widgets, multi-currency
conversion, CSRF, audit logs) is intentionally deferred to later phases so this foundation
can be reviewed first.

## Quick start

```bash
# 1. Postgres running locally (e.g. `brew services start postgresql@17`), then:
cd backend
cp .env.example .env      # edit DATABASE_URL if needed
npm install
npx prisma migrate dev
npm run dev

# 2. In another terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Project layout

```
backend/    Express + TypeScript API, Prisma schema & migrations
frontend/   React 19 + Vite + TypeScript SPA
```

## Next phases

1. Budgets + Savings Goals + Bills (CRUD + progress logic + notifications)
2. Analytics & Reports (Recharts dashboards, PDF/CSV/Excel export)
3. Calendar view, global search, AI insights assistant
4. Multi-currency conversion, receipt OCR, bank statement import
5. PWA/offline, drag-and-drop dashboard widgets, audit log, CSRF hardening
6. Broader test coverage (frontend unit/integration tests, more backend coverage) + CI pipeline
