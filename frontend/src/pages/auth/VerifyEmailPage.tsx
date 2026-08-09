import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Wallet2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { api, getErrorMessage } from "@/lib/api";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError(t("auth.verifyEmail.missingToken"));
      return;
    }

    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(getErrorMessage(err, t("auth.verifyEmail.genericError")));
      });
  }, [token, t]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 dark:bg-surface-dark">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative w-full max-w-sm rounded-3xl p-8 text-center shadow-soft"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-400 text-white shadow-glow">
            <Wallet2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">{t("auth.verifyEmail.title")}</h1>
        </div>

        {status === "verifying" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("auth.verifyEmail.verifying")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm text-muted-foreground">{t("auth.verifyEmail.success")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="h-8 w-8 text-danger" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        <Button asChild className="mt-6 w-full">
          <Link to="/">{t("auth.verifyEmail.continue")}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
