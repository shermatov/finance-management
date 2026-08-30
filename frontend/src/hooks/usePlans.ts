import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Plan } from "@/types";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.get<{ plans: Plan[] }>("/plans")).data.plans,
  });
}

export interface PlanInput {
  title: string;
  description?: string;
  dueDate?: string;
  status: Plan["status"];
}

function invalidatePlanQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["plans"] });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlanInput) => (await api.post<{ plan: Plan }>("/plans", input)).data.plan,
    onSuccess: () => invalidatePlanQueries(queryClient),
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<PlanInput> }) =>
      (await api.patch<{ plan: Plan }>(`/plans/${id}`, input)).data.plan,
    onSuccess: () => invalidatePlanQueries(queryClient),
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/plans/${id}`);
    },
    onSuccess: () => invalidatePlanQueries(queryClient),
  });
}
