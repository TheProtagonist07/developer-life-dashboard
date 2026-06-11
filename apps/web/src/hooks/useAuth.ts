"use client";

import useSWR from "swr";
import { api } from "../lib/api";
import type { User } from "../types";

export function useAuth() {
  const { data: user, error, isLoading, mutate } = useSWR<User>(
    "auth/me",
    () => api.auth.me(),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user && !error,
    logout: async () => {
      await api.auth.logout();
      await mutate(undefined, { revalidate: false });
      window.location.href = "/";
    },
  };
}
