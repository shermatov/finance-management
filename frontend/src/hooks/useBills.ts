import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Bill } from "@/types";

export function useBills() {
  return useQuery({
    queryKey: ["bills"],
    queryFn: async () => (await api.get<{ bills: Bill[] }>("/bills")).data.bills,
  });
}

export interface BillInput {
  name: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  frequency: "ONCE" | "WEEKLY" | "MONTHLY" | "YEARLY";
  dueDate?: string | null;
  categoryId?: string;
  accountId?: string;
  debtAccountId?: string | null;
}

function invalidateBillQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["bills"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BillInput) => (await api.post<{ bill: Bill }>("/bills", input)).data.bill,
    onSuccess: () => invalidateBillQueries(queryClient),
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BillInput }) =>
      (await api.patch<{ bill: Bill }>(`/bills/${id}`, input)).data.bill,
    onSuccess: () => invalidateBillQueries(queryClient),
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bills/${id}`);
    },
    onSuccess: () => invalidateBillQueries(queryClient),
  });
}

export function useMarkBillPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<{ bill: Bill }>(`/bills/${id}/pay`)).data.bill,
    onSuccess: () => {
      invalidateBillQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
