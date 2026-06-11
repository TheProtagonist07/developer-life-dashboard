import axios from "axios";
import { pool } from "../db";

interface CFSubmission {
  id: number;
  creationTimeSeconds: number;
  verdict: string;
  problem: { name: string; rating?: number };
}

export async function syncCodeforces(userId: string, handle: string): Promise<number> {
  const response = await axios.get(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=5000`,
    { timeout: 15_000 }
  );

  if (response.data.status !== "OK") {
    throw new Error(`Codeforces API error: ${response.data.comment}`);
  }

  const submissions: CFSubmission[] = response.data.result;
  // Keep only accepted submissions, group by day
  const byDay: Record<string, { count: number; score: number; ids: number[] }> = {};

  for (const sub of submissions) {
    if (sub.verdict !== "OK") continue;

    const date = new Date(sub.creationTimeSeconds * 1000).toISOString().slice(0, 10);
    if (!byDay[date]) byDay[date] = { count: 0, score: 0, ids: [] };

    // Score based on problem rating: 800=1, 1200=2, 1600=3, 2000=4, 2400=5+
    const rating = sub.problem.rating ?? 1000;
    const problemScore = Math.max(1, Math.floor(rating / 400));

    byDay[date].count++;
    byDay[date].score += problemScore;
    byDay[date].ids.push(sub.id);
  }

  let synced = 0;
  for (const [date, data] of Object.entries(byDay)) {
    await pool.query(
      `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, external_id)
       VALUES ($1, 'codeforces', 'problem_solved', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform, activity_type, activity_date, external_id)
       DO UPDATE SET count = EXCLUDED.count, score = EXCLUDED.score`,
      [userId, date, data.count, data.score, `cf_${date}`]
    );
    synced++;
  }

  return synced;
}
