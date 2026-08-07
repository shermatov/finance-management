import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Wallet2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col gap-6 p-5">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-400 text-white shadow-glow">
          <Wallet2 className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">{t("common.appName")}</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </span>
            {item.soon && (
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                {t("nav.soon")}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl border border-border/60 bg-secondary/50 p-3 text-xs text-muted-foreground">
        {t("common.tagline")} <br /> {t("common.phaseNote")}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/60 lg:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-2xl lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
            >
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
                aria-label={t("common.closeSidebar")}
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
