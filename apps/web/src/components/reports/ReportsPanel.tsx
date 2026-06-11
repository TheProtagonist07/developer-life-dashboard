"use client";

import useSWR from "swr";
import { api } from "../../lib/api";
import { PLATFORM_META, formatDate } from "../../lib/utils";
import { DevCard } from "./DevCard";
import type { Platform } from "../../types";

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        up ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct)}% vs last week
    </span>
  );
}

function PlatformBar({ byPlatform }: { byPlatform: Partial<Record<Platform, number>> }) {
  const entries = Object.entries(byPlatform).filter(([, v]) => v > 0) as Array<[Platform, number]>;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <div className="text-xs text-gray-600">No activity this week</div>;

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5">
        {entries.map(([platform, value]) => (
          <div
            key={platform}
            style={{ width: `${(value / total) * 100}%`, backgroundColor: PLATFORM_META[platform].color }}
            title={`${PLATFORM_META[platform].label}: ${value.toFixed(1)}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        {entries.map(([platform, value]) => (
          <span key={platform} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PLATFORM_META[platform].color }} />
            {PLATFORM_META[platform].label} · {Math.round((value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReportsPanel() {
  const { data: weekly } = useSWR("weekly-report", () => api.analytics.weekly(2), { revalidateOnFocus: false });
  const { data: monthly } = useSWR("monthly-report", () => api.analytics.monthly(3), { revalidateOnFocus: false });
  const { data: bestDays } = useSWR("best-days", api.analytics.bestDays, { revalidateOnFocus: false });
  const { data: achievements } = useSWR("achievements", api.achievements.list, { revalidateOnFocus: false });
  const { data: goals } = useSWR("goals", () => api.goals.list("active"), { revalidateOnFocus: false });
  const { data: streaks } = useSWR("streaks", api.streaks.all, { revalidateOnFocus: false });

  const thisWeek = weekly?.[0];
  const lastWeek = weekly?.[1];

  const weekAgo = Date.now() - 7 * 86_400_000;
  const newBadges = achievements?.filter((a) => new Date(a.earned_at).getTime() > weekAgo) ?? [];

  const overall = streaks?.find((s) => s.streak_type === "overall");
  const consistency = thisWeek ? Math.round((thisWeek.active_days / 7) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── Weekly Summary ────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-semibold text-white">Weekly Summary</h2>
            {thisWeek && (
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(thisWeek.week_start)} – {formatDate(thisWeek.week_end)}
              </p>
            )}
          </div>
          {thisWeek && lastWeek && (
            <TrendBadge current={thisWeek.total_score} previous={lastWeek.total_score} />
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["Score", thisWeek?.total_score?.toFixed(1) ?? "0", "text-emerald-400"],
            ["Activities", String(thisWeek?.total_count ?? 0), "text-blue-400"],
            ["Active Days", `${thisWeek?.active_days ?? 0}/7`, "text-yellow-400"],
            ["Consistency", `${consistency}%`, "text-purple-400"],
          ].map(([label, value, color]) => (
            <div key={label}>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Platform Split</h3>
          <PlatformBar byPlatform={thisWeek?.by_platform ?? {}} />
        </div>

        {newBadges.length > 0 && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-yellow-400">🎉 Earned this week:</span>
            {newBadges.map((b) => (
              <span key={b.achievement_key} className="text-xs text-gray-300">
                {b.icon} {b.title}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Monthly Report ──────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Monthly Report</h3>
          {(monthly ?? []).map((m) => {
            const daysInMonth = new Date(
              parseInt(m.month.slice(0, 4)),
              parseInt(m.month.slice(5, 7)),
              0
            ).getDate();
            const pct = Math.round((m.active_days / daysInMonth) * 100);
            return (
              <div key={m.month} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-medium">
                    {new Date(m.month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-xs text-gray-500">
                    {m.active_days}/{daysInMonth} days · score {Number(m.total_score).toFixed(0)}
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-yellow-400" : "bg-red-400/70"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {(monthly?.length ?? 0) === 0 && (
            <div className="text-xs text-gray-600 py-4 text-center">No data yet</div>
          )}
        </div>

        {/* ── Records ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Personal Records</h3>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-400">🔥 Longest streak</span>
            <span className="text-sm font-semibold text-orange-400">{overall?.longest_streak ?? 0} days</span>
          </div>

          {(bestDays ?? []).slice(0, 5).map((d, i) => (
            <div key={d.activity_date} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-gray-400">
                {["🥇", "🥈", "🥉", "4.", "5."][i]} {formatDate(d.activity_date)}
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                {Number(d.total_score).toFixed(1)} pts
              </span>
            </div>
          ))}
          {(bestDays?.length ?? 0) === 0 && (
            <div className="text-xs text-gray-600 py-4 text-center">Your best days will appear here</div>
          )}

          {/* Goal snapshot */}
          {(goals?.length ?? 0) > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Goals</span>
              {goals!.slice(0, 3).map((g) => (
                <div key={g.id} className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-400 truncate mr-2">{g.title}</span>
                  <span className="text-gray-500 shrink-0">
                    {Math.round((g.current_value / g.target_value) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dev Card ──────────────────────────────────────────── */}
      <DevCard />
    </div>
  );
}
