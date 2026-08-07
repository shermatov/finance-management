import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "danger" | "warning";
  delta?: { value: string; positive: boolean };
  index?: number;
}

const toneClasses: Record<NonNullable<StatCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({ label, value, icon: Icon, tone = "primary", delta, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="border-border/60 shadow-soft transition-shadow hover:shadow-glow">
        <CardContent className="flex items-start justify-between gap-3 p-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p
              className="truncate text-lg font-semibold tracking-tight tabular-nums sm:text-xl 2xl:text-2xl"
              title={value}
            >
              {value}
            </p>
            {delta && (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  delta.positive ? "text-success" : "text-danger"
                )}
              >
                {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta.value}
              </p>
            )}
          </div>
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
