import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface AdminUser {
  id: number;
  username: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        return await api.get<AdminUser>("/api/admin/auth/me");
      } catch (err: any) {
        if (err?.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });

  const login = useMutation({
    mutationFn: (creds: { username: string; password: string }) =>
      api.post<AdminUser>("/api/admin/auth/login", creds),
    onSuccess: (user) => qc.setQueryData(["auth", "me"], user),
  });

  const logout = useMutation({
    mutationFn: () => api.post<{ ok: true }>("/api/admin/auth/logout"),
    onSuccess: () => qc.setQueryData(["auth", "me"], null),
  });

  return {
    user: query.data ?? null,
    loading: query.isLoading,
    login,
    logout,
  };
}
