import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResult, Transaction, TransactionType } from "@/types";

export interface TransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "date" | "amount" | "title";
  sortDir?: "asc" | "desc";
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () =>
      (await api.get<PaginatedResult<Transaction>>("/transactions", { params: filters })).data,
    placeholderData: (prev) => prev,
  });
}

export interface TransactionInput {
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  date: string;
  accountId: string;
  categoryId?: string;
  notes?: string;
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["accounts"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionInput) =>
      (await api.post<{ transaction: Transaction }>("/transactions", input)).data.transaction,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<TransactionInput> }) =>
      (await api.patch<{ transaction: Transaction }>(`/transactions/${id}`, input)).data.transaction,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => invalidateAll(queryClient),
  });
}
