import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LiveNotification } from "@/types";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      (await api.get<{ notifications: LiveNotification[] }>("/notifications")).data.notifications,
    refetchInterval: 60_000,
  });
}
