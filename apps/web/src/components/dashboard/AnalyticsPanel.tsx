"use client";

import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../../lib/api";
import { format, parseISO } from "date-fns";

const CHART_COLORS = ["#39d353", "#26a641", "#006d32", "#0e4429", "#3b82f6", "#a855f7"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1c2128] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <div className="text-gray-400 mb-1">{label}</div>
      <div className="text-white font-semibold">Score: {payload[0].value.toFixed(1)}</div>
    </div>
  );
}

export function AnalyticsPanel() {
  const { data: weekly } = useSWR("weekly", () => api.analytics.weekly(12), { revalidateOnFocus: false });
  const { data: monthly } = useSWR("monthly", () => api.analytics.monthly(6), { revalidateOnFocus: false });

  const weeklyData = [...(weekly ?? [])].reverse().map((w) => ({
    name: format(parseISO(w.week_start), "MMM d"),
    score: w.total_score,
    days: w.active_days,
  }));

  const monthlyData = [...(monthly ?? [])].reverse().map((m) => ({
    name: format(parseISO(m.month + "-01"), "MMM yy"),
    score: m.total_score,
    days: m.active_days,
  }));

  return (
    <div className="space-y-6">
      {/* Weekly chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Weekly Score</h3>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                {weeklyData.map((_, i) => (
                  <Cell key={i} fill={i === weeklyData.length - 1 ? "#39d353" : "#006d32"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
            No data yet — start coding!
          </div>
        )}
      </div>

      {/* Monthly chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Monthly Consistency</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                {monthlyData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
