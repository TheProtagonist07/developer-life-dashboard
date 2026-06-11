"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { api } from "../../lib/api";
import { HEATMAP_COLORS, PLATFORM_META, cn } from "../../lib/utils";
import type { HeatmapDay, Platform } from "../../types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Mon","","Wed","","Fri","","Sun"];

function buildGrid(days: HeatmapDay[], year: number): (HeatmapDay | null)[][] {
  const dayMap = new Map(days.map((d) => [d.date, d]));

  const startOfYear = new Date(year, 0, 1);
  // Day of week: 0=Sun→shift to Mon=0
  const firstDow = (startOfYear.getDay() + 6) % 7;

  // Generate every day of the year
  const allDays: (HeatmapDay | null)[] = Array(firstDow).fill(null);
  const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;

  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, i + 1);
    const dateStr = d.toISOString().slice(0, 10);
    allDays.push(
      dayMap.get(dateStr) ?? { date: dateStr, count: 0, score: 0, level: 0, breakdown: {} }
    );
  }

  // Chunk into weeks (columns of 7)
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

function getMonthLabels(year: number): Array<{ label: string; col: number }> {
  const labels: Array<{ label: string; col: number }> = [];
  let prevMonth = -1;

  const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const startDow = (new Date(year, 0, 1).getDay() + 6) % 7;

  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(year, 0, i + 1);
    const month = d.getMonth();
    const col = Math.floor((startDow + i) / 7);
    if (month !== prevMonth) {
      labels.push({ label: MONTHS[month], col });
      prevMonth = month;
    }
  }
  return labels;
}

interface TooltipData {
  day: HeatmapDay;
  x: number;
  y: number;
}

interface Props {
  year?: number;
}

export function ActivityHeatmap({ year = new Date().getFullYear() }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const { data, isLoading } = useSWR(
    ["heatmap", year, selectedPlatform],
    () => api.activities.heatmap(year, selectedPlatform === "all" ? undefined : selectedPlatform),
    { revalidateOnFocus: false }
  );

  const weeks = useMemo(
    () => buildGrid(data?.days ?? [], year),
    [data?.days, year]
  );

  const monthLabels = useMemo(() => getMonthLabels(year), [year]);

  const totalActiveDays = data?.days.filter((d) => d.count > 0).length ?? 0;
  const totalContributions = data?.days.reduce((sum, d) => sum + d.count, 0) ?? 0;

  const platforms: Array<{ key: Platform | "all"; label: string }> = [
    { key: "all", label: "All" },
    ...Object.entries(PLATFORM_META).map(([k, v]) => ({ key: k as Platform, label: v.label })),
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Life Heatmap</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {totalContributions.toLocaleString()} contributions · {totalActiveDays} active days in {year}
          </p>
        </div>

        {/* Platform filter */}
        <div className="flex flex-wrap gap-1.5">
          {platforms.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                selectedPlatform === key
                  ? "bg-emerald-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="h-28 bg-white/5 rounded animate-pulse" />
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            {/* Month labels */}
            <div className="flex mb-1 ml-6">
              {monthLabels.map(({ label, col }) => (
                <div
                  key={`${label}-${col}`}
                  className="text-[10px] text-gray-500 absolute"
                  style={{ marginLeft: `${col * 13}px` }}
                >
                  {label}
                </div>
              ))}
              <div style={{ height: 14 }} />
            </div>

            <div className="flex gap-0.5">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1.5">
                {DAYS.map((d, i) => (
                  <div key={i} className="text-[10px] text-gray-600 h-[11px] leading-none flex items-center">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      className={cn(
                        "w-[11px] h-[11px] rounded-[2px] cursor-pointer transition-opacity",
                        day ? HEATMAP_COLORS[day.level] : "opacity-0 pointer-events-none",
                        day && day.level > 0 ? "hover:ring-1 hover:ring-white/30" : ""
                      )}
                      onMouseEnter={(e) => {
                        if (!day) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ day, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className={cn("w-3 h-3 rounded-[2px]", HEATMAP_COLORS[level])} />
        ))}
        <span>More</span>

        <div className="ml-auto flex gap-3">
          {Object.entries(PLATFORM_META).map(([key, { label, color }]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Tooltip (fixed portal-free) */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-[#1c2128] border border-white/10 rounded-lg p-2.5 text-xs shadow-xl"
          style={{ left: tooltip.x, top: tooltip.y - 80 }}
        >
          <div className="font-semibold text-white mb-1">{tooltip.day.date}</div>
          <div className="text-gray-400">
            {tooltip.day.count > 0 ? (
              <>
                <div>{tooltip.day.count} activities</div>
                <div>Score: {tooltip.day.score.toFixed(1)}</div>
                {Object.entries(tooltip.day.breakdown).map(([p, v]) => (
                  <div key={p} className="flex items-center gap-1">
                    <span className="capitalize">{p}:</span> {v}
                  </div>
                ))}
              </>
            ) : (
              <div>No activity</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
