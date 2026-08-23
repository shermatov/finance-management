import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

// Notifications aren't persisted server-side (see notifications.service.ts) — there's no
// stable id to mark "read" on the backend. Instead each notification's content (type +
// params) is its own identity, and "seen" is tracked per-browser in localStorage: opening
// the bell marks everything currently showing as seen, so the badge count only reflects
// notifications that are new (or whose details changed) since the last time it was opened.
const SEEN_STORAGE_KEY = "finance:notifications:seen";

function notificationKey(n: LiveNotification): string {
  return `${n.type}:${JSON.stringify(n.params)}`;
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Storage unavailable (private browsing, etc.) — seen state just won't persist.
  }
}

export function useUnseenNotifications(notifications: LiveNotification[] | undefined) {
  const [seen, setSeen] = useState<Set<string>>(loadSeen);

  useEffect(() => {
    if (!notifications) return;
    // Drop keys for notifications that no longer exist (condition resolved) so the seen
    // set doesn't grow forever.
    const currentKeys = new Set(notifications.map(notificationKey));
    setSeen((prev) => {
      const pruned = new Set([...prev].filter((k) => currentKeys.has(k)));
      if (pruned.size !== prev.size) saveSeen(pruned);
      return pruned;
    });
  }, [notifications]);

  const unseenCount = notifications?.filter((n) => !seen.has(notificationKey(n))).length ?? 0;

  const markAllSeen = () => {
    if (!notifications) return;
    const next = new Set(notifications.map(notificationKey));
    setSeen(next);
    saveSeen(next);
  };

  return { unseenCount, markAllSeen };
}
