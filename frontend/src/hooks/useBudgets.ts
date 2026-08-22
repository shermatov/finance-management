import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Budget, Transaction } from "@/types";

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: ["budgets", month, year],
    queryFn: async () =>
      (await api.get<{ budgets: Budget[] }>("/budgets", { params: { month, year } })).data.budgets,
  });
}

export function useBudgetTransactions(budgetId: string | null) {
  return useQuery({
    queryKey: ["budget-transactions", budgetId],
    queryFn: async () =>
      (await api.get<{ transactions: Transaction[] }>(`/budgets/${budgetId}/transactions`)).data.transactions,
    enabled: !!budgetId,
  });
}

export interface BudgetInput {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

function invalidateBudgetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetInput) => (await api.post<{ budget: Budget }>("/budgets", input)).data.budget,
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) =>
      (await api.patch<{ budget: Budget }>(`/budgets/${id}`, { amount })).data.budget,
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => invalidateBudgetQueries(queryClient),
  });
}
