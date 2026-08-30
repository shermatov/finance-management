import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Habit } from "@/types";

export function useHabits() {
  return useQuery({
    queryKey: ["habits"],
    queryFn: async () => (await api.get<{ habits: Habit[] }>("/habits")).data.habits,
  });
}

export interface HabitInput {
  title: string;
}

function invalidateHabitQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["habits"] });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HabitInput) => (await api.post<{ habit: Habit }>("/habits", input)).data.habit,
    onSuccess: () => invalidateHabitQueries(queryClient),
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: HabitInput }) =>
      (await api.patch<{ habit: Habit }>(`/habits/${id}`, input)).data.habit,
    onSuccess: () => invalidateHabitQueries(queryClient),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/habits/${id}`);
    },
    onSuccess: () => invalidateHabitQueries(queryClient),
  });
}

export function useToggleHabitToday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post<{ habit: Habit }>(`/habits/${id}/toggle-today`)).data.habit,
    onSuccess: () => invalidateHabitQueries(queryClient),
  });
}
