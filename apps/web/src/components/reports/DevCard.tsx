"use client";

import { useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";

const LEVEL_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

const W = 640;
const H = 320;

export function DevCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();

  const { data: heatmap } = useSWR(
    ["heatmap", new Date().getFullYear(), "all"],
    () => api.activities.heatmap(),
    { revalidateOnFocus: false }
  );
  const { data: streaks } = useSWR("streaks", api.streaks.all, { revalidateOnFocus: false });
  const { data: totals } = useSWR("totals", api.analytics.totals, { revalidateOnFocus: false });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !user) return;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    // Username
    ctx.fillStyle = "#e6edf3";
    ctx.font = "bold 26px -apple-system, system-ui, sans-serif";
    ctx.fillText(`@${user.username}`, 32, 52);

    ctx.fillStyle = "#7d8590";
    ctx.font = "13px -apple-system, system-ui, sans-serif";
    ctx.fillText("Developer Life Dashboard", 32, 74);

    // Stats
    const overall = streaks?.find((s) => s.streak_type === "overall");
    const stats: Array<[string, string]> = [
      [`${overall?.current_streak ?? 0}`, "day streak 🔥"],
      [`${overall?.longest_streak ?? 0}`, "best streak"],
      [`${(totals?.overall.totalCount ?? 0).toLocaleString()}`, "contributions"],
      [`${totals?.overall.activeDays ?? 0}`, "active days"],
    ];

    stats.forEach(([value, label], i) => {
      const x = 32 + i * 150;
      ctx.fillStyle = "#39d353";
      ctx.font = "bold 30px -apple-system, system-ui, sans-serif";
      ctx.fillText(value, x, 130);
      ctx.fillStyle = "#7d8590";
      ctx.font = "12px -apple-system, system-ui, sans-serif";
      ctx.fillText(label, x, 150);
    });

    // Mini heatmap — last 26 weeks
    const days = heatmap?.days ?? [];
    const dayMap = new Map(days.map((d) => [d.date, d.level]));
    const cell = 14;
    const gap = 3;
    const weeks = 26;
    const startX = 32;
    const startY = 185;

    const today = new Date();
    // Align to start of week, 26 weeks back
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - (weeks * 7 - 1) - ((gridStart.getDay() + 6) % 7));

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(date.getDate() + w * 7 + d);
        if (date > today) continue;
        const dateStr = date.toISOString().slice(0, 10);
        const level = dayMap.get(dateStr) ?? 0;
        ctx.fillStyle = LEVEL_COLORS[level];
        const x = startX + w * (cell + gap);
        const y = startY + d * (cell + gap);
        ctx.beginPath();
        ctx.roundRect(x, y, cell, cell, 3);
        ctx.fill();
      }
    }

    // Footer
    ctx.fillStyle = "#484f58";
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.fillText("github.com/TheProtagonist07/developer-life-dashboard", 32, H - 14);
  }, [user, heatmap, streaks, totals]);

  useEffect(() => {
    draw();
  }, [draw]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `devcard-${user?.username ?? "me"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Dev Card</h3>
        <button
          onClick={download}
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          ↓ Download PNG
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full max-w-xl rounded-lg border border-white/10"
      />
      <p className="text-xs text-gray-600">
        Share your progress — drop it in your README, Twitter, or LinkedIn.
      </p>
    </div>
  );
}
