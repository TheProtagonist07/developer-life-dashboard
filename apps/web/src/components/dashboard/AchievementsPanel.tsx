"use client";

import useSWR from "swr";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";

export function AchievementsPanel() {
  const { data: achievements, isLoading } = useSWR("achievements", api.achievements.list, { revalidateOnFocus: false });

  const ALL_BADGES = [
    { key: "first_commit", icon: "🚀", title: "First Steps", description: "Made your first GitHub commit" },
    { key: "first_leetcode", icon: "🧩", title: "Algo Awakening", description: "Solved your first LeetCode problem" },
    { key: "week_streak", icon: "🔥", title: "Week Warrior", description: "7-day overall streak" },
    { key: "month_streak", icon: "🌟", title: "Month Maverick", description: "30-day overall streak" },
    { key: "leetcode_50", icon: "🎯", title: "Problem Solver", description: "50 LeetCode problems" },
    { key: "leetcode_100", icon: "💯", title: "Century Coder", description: "100 LeetCode problems" },
    { key: "multi_platform", icon: "🌐", title: "Full Stack Dev", description: "Active on 3+ platforms in one day" },
    { key: "github_100", icon: "⭐", title: "Commit Champion", description: "100 GitHub contributions" },
  ];

  const earnedKeys = new Set(achievements?.map((a) => a.achievement_key) ?? []);
  const earnedMap = Object.fromEntries(achievements?.map((a) => [a.achievement_key, a]) ?? []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Achievements</h2>
        <p className="text-xs text-gray-500">
          {earnedKeys.size} / {ALL_BADGES.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ALL_BADGES.map((badge) => {
          const earned = earnedKeys.has(badge.key);
          const data = earnedMap[badge.key];

          return (
            <div
              key={badge.key}
              className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
                earned
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-white/5 bg-white/[0.02] opacity-40 grayscale"
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <div className="text-sm font-semibold text-gray-200">{badge.title}</div>
              <div className="text-xs text-gray-500">{badge.description}</div>
              {earned && data && (
                <div className="text-[10px] text-yellow-400/70">
                  Earned {formatDate(data.earned_at)}
                </div>
              )}
              {!earned && (
                <div className="text-[10px] text-gray-700">Locked</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
