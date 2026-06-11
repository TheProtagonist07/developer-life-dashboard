const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error?.message ?? "Request failed");
  }

  return json.data as T;
}

export const api = {
  auth: {
    me: () => request<import("../types").User>("/auth/me"),
    logout: () => request("/auth/logout", { method: "DELETE" }),
    loginUrl: `${BASE_URL}/auth/github`,
  },

  activities: {
    heatmap: (year?: number, platform?: string) =>
      request<{ year: number; days: import("../types").HeatmapDay[] }>(
        `/activities/heatmap?year=${year ?? new Date().getFullYear()}${platform ? `&platform=${platform}` : ""}`
      ),
    feed: (params?: { limit?: number; offset?: number; platform?: string }) => {
      const q = new URLSearchParams();
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.offset) q.set("offset", String(params.offset));
      if (params?.platform) q.set("platform", params.platform);
      return request<{ activities: import("../types").Activity[] }>(`/activities/feed?${q}`);
    },
    summary: () => request<import("../types").DailySummary>("/activities/summary"),
    logManual: (data: {
      activityType: string;
      date: string;
      count?: number;
      durationMinutes?: number;
      notes?: string;
    }) => request("/activities/manual", { method: "POST", body: JSON.stringify(data) }),
  },

  streaks: {
    all: () => request<import("../types").Streak[]>("/streaks"),
  },

  goals: {
    list: (status?: string) =>
      request<import("../types").Goal[]>(`/goals${status ? `?status=${status}` : ""}`),
    create: (data: Partial<import("../types").Goal>) =>
      request<import("../types").Goal>("/goals", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import("../types").Goal>) =>
      request<import("../types").Goal>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/goals/${id}`, { method: "DELETE" }),
  },

  analytics: {
    weekly: (weeks?: number) =>
      request<import("../types").WeeklyStats[]>(`/analytics/weekly?weeks=${weeks ?? 8}`),
    monthly: (months?: number) =>
      request<import("../types").MonthlyStats[]>(`/analytics/monthly?months=${months ?? 6}`),
    totals: () => request<{ byPlatform: Array<{ platform: string; total_count: number; total_score: number }>; overall: { totalCount: number; activeDays: number } }>("/analytics/totals"),
    bestDays: () => request<Array<{ activity_date: string; total_score: number }>>("/analytics/best-days"),
  },

  platforms: {
    list: () => request<import("../types").PlatformConnection[]>("/platforms"),
    connect: (platform: string, username: string) =>
      request("/platforms/connect", { method: "POST", body: JSON.stringify({ platform, username }) }),
    disconnect: (platform: string) => request(`/platforms/${platform}`, { method: "DELETE" }),
    toggle: (platform: string) => request(`/platforms/${platform}/toggle`, { method: "PATCH" }),
  },

  sync: {
    all: () => request("/sync/trigger", { method: "POST" }),
    platform: (platform: string) => request(`/sync/trigger/${platform}`, { method: "POST" }),
    status: () => request("/sync/status"),
  },

  achievements: {
    list: () => request<import("../types").Achievement[]>("/achievements"),
  },
};
