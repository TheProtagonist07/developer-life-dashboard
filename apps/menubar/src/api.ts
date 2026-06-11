import { getSettings } from "./config";

// Mirrors the payload from GET /ha/sensors/:userId on the API.
export interface DailyStatus {
  overall_streak: number;
  coding_streak: number;
  dsa_streak: number;
  today_count: number;
  today_score: number;
  week_active_days: number;
  week_score: number;
}

export interface FetchResult {
  ok: boolean;
  status?: DailyStatus;
  error?: string;
  fetchedAt: number;
}

// Uses the Home Assistant sensor endpoint as a lightweight, API-key-authed
// data source — exactly the daily-status numbers the popover needs, with no
// OAuth flow required in the desktop app.
export async function fetchStatus(): Promise<FetchResult> {
  const { apiUrl, apiKey, userId } = getSettings();

  if (!apiUrl || !apiKey || !userId) {
    return { ok: false, error: "not_configured", fetchedAt: Date.now() };
  }

  const url = `${apiUrl.replace(/\/$/, "")}/ha/sensors/${encodeURIComponent(userId)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      return { ok: false, error: "unauthorized", fetchedAt: Date.now() };
    }
    if (!res.ok) {
      return { ok: false, error: `http_${res.status}`, fetchedAt: Date.now() };
    }

    const json = (await res.json()) as { success: boolean; data?: DailyStatus };
    if (!json.success || !json.data) {
      return { ok: false, error: "bad_response", fetchedAt: Date.now() };
    }

    return { ok: true, status: json.data, fetchedAt: Date.now() };
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError" ? "timeout" : "network_error";
    return { ok: false, error: message, fetchedAt: Date.now() };
  }
}

// Quick connectivity check used by the Settings "Test connection" button.
export async function testConnection(
  apiUrl: string,
  apiKey: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `${apiUrl.replace(/\/$/, "")}/ha/sensors/${encodeURIComponent(userId)}`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (res.status === 401) return { ok: false, error: "Invalid API key" };
    if (!res.ok) return { ok: false, error: `Server returned ${res.status}` };
    const json = (await res.json()) as { success: boolean };
    return json.success ? { ok: true } : { ok: false, error: "Unexpected response" };
  } catch {
    return { ok: false, error: "Could not reach server" };
  }
}
