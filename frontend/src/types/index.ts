export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "SAVINGS" | "INVESTMENT";
export type Currency = "USD" | "EUR" | "GBP" | "KGS" | "RUB" | "KZT" | "PLN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export interface Settings {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  currency: Currency;
  language: string;
  timezone: string;
  notifyBudgetExceeded: boolean;
  notifyUpcomingBills: boolean;
  notifySavingsMilestone: boolean;
  notifyLowBalance: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  currency: Currency;
  icon: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  category: Category;
  amount: string;
  month: number;
  year: number;
  spent: number;
  effectiveAmount: number;
  carriedOver: number;
  remaining: number;
  percentage: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: string;
  type: TransactionType;
  date: string;
  notes: string | null;
  accountId: string;
  categoryId: string | null;
  category: Category | null;
  account: Account;
  createdAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: string;
  type: "INCOME" | "EXPENSE";
  frequency: "ONCE" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  dueDate: string | null;
  status: "UNPAID" | "PAID";
  categoryId: string | null;
  accountId: string | null;
  debtAccountId: string | null;
  autoComputeRate: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: string | null;
  currentAmount: string;
  deadline: string | null;
  isActive: boolean;
}

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number;
}

export interface HealthFactor {
  score: number;
  value: number;
}

export interface FinancialHealthBreakdown {
  savingsRate: HealthFactor;
  debtToIncome: HealthFactor;
  emergencyFund: HealthFactor;
  trend: HealthFactor;
}

export interface DashboardSummary {
  currentBalance: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  savingsRate: number;
  financialHealthScore: number;
  financialHealthBreakdown: FinancialHealthBreakdown;
  cashFlow: CashFlowPoint[];
  recentTransactions: Transaction[];
  upcomingBills: Bill[];
  savingsGoals: SavingsGoal[];
  categoryBreakdown: CategoryBreakdownItem[];
  accounts: Account[];
}

export interface AccountLegendItem {
  name: string;
  color: string;
}

export interface AnalyticsOverview {
  baseCurrency: Currency;
  cashFlow: CashFlowPoint[];
  balanceHistory: Array<Record<string, number | string>>;
  accounts: AccountLegendItem[];
  debtProgress: Array<Record<string, number | string>>;
  debtAccounts: AccountLegendItem[];
}

export interface CategoryBreakdownResponse {
  month: number;
  year: number;
  baseCurrency: Currency;
  total: number;
  breakdown: CategoryBreakdownItem[];
}

export interface CalendarBillOccurrence {
  billId: string;
  name: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "UNPAID" | "PAID";
  date: string;
}

export interface CalendarMonthResponse {
  month: number;
  year: number;
  transactions: Transaction[];
  bills: CalendarBillOccurrence[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorBody {
  error: { message: string; details?: unknown };
}
