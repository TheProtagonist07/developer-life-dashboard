"use client";

import useSWR from "swr";
import { api } from "../../lib/api";
import { STREAK_META } from "../../lib/utils";
import type { Streak } from "../../types";

function StreakCard({ streak }: { streak: Streak }) {
  const meta = STREAK_META[streak.streak_type] ?? { label: streak.streak_type, icon: "📈", color: "text-gray-300" };
  const isActive = streak.current_streak > 0;

  return (
    <div className={`rounded-xl border p-4 space-y-2 transition-colors ${
      isActive ? "border-white/15 bg-white/5" : "border-white/5 bg-white/[0.02]"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <span className="text-sm font-medium text-gray-300">{meta.label}</span>
        </div>
        {isActive && (
          <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
            active
          </span>
        )}
      </div>

      <div className={`text-3xl font-bold ${meta.color}`}>
        {streak.current_streak}
        <span className="text-sm font-normal text-gray-500 ml-1">days</span>
      </div>

      <div className="text-xs text-gray-600">
        Best: {streak.longest_streak}d
        {streak.last_activity_date && (
          <span className="ml-2">· Last: {streak.last_activity_date}</span>
        )}
      </div>

      {/* Mini progress bar showing current vs best */}
      {streak.longest_streak > 0 && (
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${meta.color.replace("text-", "bg-")}`}
            style={{ width: `${Math.min(100, (streak.current_streak / streak.longest_streak) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function StreakGrid() {
  const { data: streaks, isLoading } = useSWR("streaks", api.streaks.all, { revalidateOnFocus: false });

  const ordered = ["overall", "coding", "dsa", "learning", "project"];
  const sorted = ordered
    .map((type) => streaks?.find((s) => s.streak_type === type))
    .filter(Boolean) as Streak[];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Streaks</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {sorted.map((streak) => (
          <StreakCard key={streak.streak_type} streak={streak} />
        ))}
      </div>
    </div>
  );
}
