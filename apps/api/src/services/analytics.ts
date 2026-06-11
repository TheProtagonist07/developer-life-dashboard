import type { HeatmapDay } from "../types";

// Thresholds tuned so ~3 activities = level 1, 8 = level 3, 15+ = level 4
const LEVEL_THRESHOLDS = [0, 3, 7, 12, Infinity];

export function computeHeatmapLevel(score: number): HeatmapDay["level"] {
  if (score <= 0) return 0;
  if (score < LEVEL_THRESHOLDS[1]) return 1;
  if (score < LEVEL_THRESHOLDS[2]) return 2;
  if (score < LEVEL_THRESHOLDS[3]) return 3;
  return 4;
}

export function buildFullYearGrid(days: HeatmapDay[], year: number): (HeatmapDay | null)[] {
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);

  // Pad beginning to Monday
  const firstDayOfWeek = start.getDay(); // 0=Sun
  const padStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const grid: (HeatmapDay | null)[] = Array(padStart).fill(null);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    grid.push(
      dayMap.get(dateStr) ?? {
        date: dateStr,
        count: 0,
        score: 0,
        level: 0,
        breakdown: {},
      }
    );
  }

  return grid;
}
