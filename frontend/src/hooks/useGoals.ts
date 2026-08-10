import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SavingsGoal } from "@/types";

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => (await api.get<{ goals: SavingsGoal[] }>("/goals")).data.goals,
  });
}

export interface GoalInput {
  name: string;
  targetAmount?: number;
  currentAmount: number;
  deadline?: string;
  isActive: boolean;
  icon: string;
  color: string;
}

function invalidateGoalQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["goals"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: GoalInput) => (await api.post<{ goal: SavingsGoal }>("/goals", input)).data.goal,
    onSuccess: () => invalidateGoalQueries(queryClient),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GoalInput }) =>
      (await api.patch<{ goal: SavingsGoal }>(`/goals/${id}`, input)).data.goal,
    onSuccess: () => invalidateGoalQueries(queryClient),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => invalidateGoalQueries(queryClient),
  });
}

export function useContributeToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) =>
      (await api.post<{ goal: SavingsGoal }>(`/goals/${id}/contribute`, { amount })).data.goal,
    onSuccess: () => invalidateGoalQueries(queryClient),
  });
}
