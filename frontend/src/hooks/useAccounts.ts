import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Account } from "@/types";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<{ accounts: Account[] }>("/accounts")).data.accounts,
  });
}

export interface AccountInput {
  name: string;
  type: Account["type"];
  balance: number;
  currency: Account["currency"];
  icon: string;
  color: string;
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountInput) => (await api.post<{ account: Account }>("/accounts", input)).data.account,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AccountInput> }) =>
      (await api.patch<{ account: Account }>(`/accounts/${id}`, input)).data.account,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}

export function useTransferBetweenAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      currency?: string;
      notes?: string;
    }) =>
      (await api.post("/accounts/transfer", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
