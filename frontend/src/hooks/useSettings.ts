import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Settings } from "@/types";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await api.get<{ settings: Settings }>("/settings")).data.settings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Settings>) =>
      (await api.patch<{ settings: Settings }>("/settings", input)).data.settings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}
