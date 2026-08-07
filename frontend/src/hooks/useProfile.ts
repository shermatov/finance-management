import { useMutation } from "@tanstack/react-query";
import { api, setAccessToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";

export function useUpdateProfile() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (input: { firstName: string; lastName: string }) =>
      (await api.patch<{ user: User }>("/auth/me", input)).data.user,
    onSuccess: (user) => setUser(user),
  });
}

export function useChangePassword() {
  const { setUser } = useAuth();
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) =>
      (await api.post<{ user: User; accessToken: string }>("/auth/change-password", input)).data,
    onSuccess: ({ user, accessToken }) => {
      setAccessToken(accessToken);
      setUser(user);
    },
  });
}
