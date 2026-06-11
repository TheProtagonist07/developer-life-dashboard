import axios from "axios";
import { pool } from "../db";

// HackerRank doesn't have an official public API with OAuth.
// We use their public profile endpoint — works for public profiles.
export async function syncHackerRank(userId: string, username: string): Promise<number> {
  let page = 0;
  let synced = 0;
  const byDay: Record<string, number> = {};

  // Paginate through hacker submissions
  while (page < 10) {
    let response;
    try {
      response = await axios.get(
        `https://www.hackerrank.com/rest/hackers/${encodeURIComponent(username)}/recent_challenges`,
        {
          params: { limit: 100, offset: page * 100 },
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 10_000,
        }
      );
    } catch {
      break;
    }

    const challenges = response.data?.models ?? [];
    if (challenges.length === 0) break;

    for (const ch of challenges) {
      const createdAt = ch.created_at ?? ch.solved_at;
      if (!createdAt) continue;
      const date = new Date(createdAt).toISOString().slice(0, 10);
      byDay[date] = (byDay[date] ?? 0) + 1;
    }

    page++;
    if (challenges.length < 100) break;
  }

  for (const [date, count] of Object.entries(byDay)) {
    await pool.query(
      `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, external_id)
       VALUES ($1, 'hackerrank', 'problem_solved', $2, $3, $4, $5)
       ON CONFLICT (user_id, platform, activity_type, activity_date, external_id)
       DO UPDATE SET count = EXCLUDED.count, score = EXCLUDED.score`,
      [userId, date, count, count * 1.5, `hr_${date}`]
    );
    synced++;
  }

  return synced;
}
