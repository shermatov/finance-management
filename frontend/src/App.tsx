import { Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/routes/ProtectedRoute";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import DashboardPage from "@/pages/DashboardPage";
import TransactionsPage from "@/pages/TransactionsPage";
import AccountsPage from "@/pages/AccountsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import BillsPage from "@/pages/BillsPage";
import GoalsPage from "@/pages/GoalsPage";
import BudgetsPage from "@/pages/BudgetsPage";
import SettingsPage from "@/pages/SettingsPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/bills" element={<BillsPage />} />
          <Route path="/analytics" element={<PlaceholderPage />} />
          <Route path="/calendar" element={<PlaceholderPage />} />
          <Route path="/reports" element={<PlaceholderPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
