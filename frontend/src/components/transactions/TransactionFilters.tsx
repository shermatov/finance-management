import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import type { TransactionFilters as Filters } from "@/hooks/useTransactions";

interface TransactionFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const ALL = "__all__";

export function TransactionFiltersBar({ filters, onChange }: TransactionFiltersProps) {
  const { t } = useTranslation();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch, page: 1 });

  const hasActiveFilters =
    filters.search || filters.type || filters.accountId || filters.categoryId || filters.dateFrom || filters.dateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("transactions.searchPlaceholder") ?? undefined}
          className="pl-9"
          value={filters.search ?? ""}
          onChange={(e) => set({ search: e.target.value || undefined })}
        />
      </div>

      <Select value={filters.type ?? ALL} onValueChange={(v) => set({ type: v === ALL ? undefined : (v as Filters["type"]) })}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("transactions.allTypes")}</SelectItem>
          <SelectItem value="INCOME">{t("common.income")}</SelectItem>
          <SelectItem value="EXPENSE">{t("common.expense")}</SelectItem>
          <SelectItem value="TRANSFER">{t("common.transfer")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.accountId ?? ALL} onValueChange={(v) => set({ accountId: v === ALL ? undefined : v })}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("transactions.allAccounts")}</SelectItem>
          {accounts?.map((acc) => (
            <SelectItem key={acc.id} value={acc.id}>
              {acc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.categoryId ?? ALL} onValueChange={(v) => set({ categoryId: v === ALL ? undefined : v })}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("transactions.allCategories")}</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="w-36"
        value={filters.dateFrom ?? ""}
        onChange={(e) => set({ dateFrom: e.target.value || undefined })}
      />
      <Input
        type="date"
        className="w-36"
        value={filters.dateTo ?? ""}
        onChange={(e) => set({ dateTo: e.target.value || undefined })}
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ page: 1, limit: filters.limit })}>
          <X className="mr-1 h-3.5 w-3.5" /> {t("transactions.clear")}
        </Button>
      )}
    </div>
  );
}
