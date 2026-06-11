"use client";

import useSWR from "swr";
import { api } from "../../lib/api";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export function StatsRow() {
  const { data: summary } = useSWR("summary", api.activities.summary, { revalidateOnFocus: false });
  const { data: streaks } = useSWR("streaks", api.streaks.all, { revalidateOnFocus: false });
  const { data: totals } = useSWR("totals", api.analytics.totals, { revalidateOnFocus: false });

  const overallStreak = streaks?.find((s) => s.streak_type === "overall");
  const today = summary?.today;
  const week = summary?.week;

  return (
    <div className="flex flex-wrap gap-3">
      <StatCard
        label="Overall Streak"
        value={`${overallStreak?.current_streak ?? 0}d`}
        sub={`Best: ${overallStreak?.longest_streak ?? 0}d`}
        icon="🔥"
        color="text-orange-400"
      />
      <StatCard
        label="Today"
        value={today?.count ?? 0}
        sub={`Score: ${today?.score?.toFixed(1) ?? 0}`}
        icon="⚡"
        color="text-yellow-400"
      />
      <StatCard
        label="This Week"
        value={`${week?.activeDays ?? 0}/7`}
        sub={`${week?.count ?? 0} activities`}
        icon="📅"
        color="text-blue-400"
      />
      <StatCard
        label="Total Activities"
        value={(totals?.overall.totalCount ?? 0).toLocaleString()}
        sub={`${totals?.overall.activeDays ?? 0} active days`}
        icon="📊"
        color="text-emerald-400"
      />
    </div>
  );
}
