"use client";

import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { api } from "../../lib/api";
import { PLATFORM_META, activityLabel, formatRelativeDate } from "../../lib/utils";
import type { Activity, Platform } from "../../types";

const PAGE_SIZE = 15;

export function ActivityFeed() {
  const [platform, setPlatform] = useState<Platform | "all">("all");

  const { data, size, setSize, isLoading } = useSWRInfinite(
    (i) => [`feed`, i, platform],
    ([, i]) =>
      api.activities.feed({
        limit: PAGE_SIZE,
        offset: i * PAGE_SIZE,
        platform: platform === "all" ? undefined : platform,
      }),
    { revalidateOnFocus: false }
  );

  const activities: Activity[] = data?.flatMap((p) => p.activities) ?? [];
  const hasMore = (data?.at(-1)?.activities.length ?? 0) >= PAGE_SIZE;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity Feed</h2>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform | "all")}
          className="text-xs bg-white/5 border border-white/10 text-gray-400 rounded-lg px-2 py-1"
        >
          <option value="all">All platforms</option>
          {Object.entries(PLATFORM_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[520px] pr-1">
        {isLoading && activities.length === 0 ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))
        ) : activities.length === 0 ? (
          <div className="text-center text-gray-600 py-8 text-sm">No activity yet</div>
        ) : (
          activities.map((activity) => {
            const meta = PLATFORM_META[activity.platform];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-300">
                    <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
                    {" · "}
                    {activity.count > 1 ? `${activity.count} ` : ""}
                    {activityLabel(activity.activity_type)}
                    {(activity.metadata as { durationMinutes?: number }).durationMinutes && (
                      <span className="text-gray-500"> ({(activity.metadata as { durationMinutes?: number }).durationMinutes}min)</span>
                    )}
                  </span>
                  {(activity.metadata as { notes?: string }).notes && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {(activity.metadata as { notes?: string }).notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-600 shrink-0">
                  {formatRelativeDate(activity.activity_date)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setSize(size + 1)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto block py-1"
        >
          Load more
        </button>
      )}
    </div>
  );
}
