import axios from "axios";
import { pool } from "../db";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql/";

const CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

export async function syncLeetCode(userId: string, username: string): Promise<number> {
  const currentYear = new Date().getFullYear();
  let synced = 0;

  // Fetch current and previous year
  for (const year of [currentYear - 1, currentYear]) {
    let response;
    try {
      response = await axios.post(
        LEETCODE_GRAPHQL,
        { query: CALENDAR_QUERY, variables: { username, year } },
        {
          headers: {
            "Content-Type": "application/json",
            Referer: "https://leetcode.com",
            "User-Agent": "Mozilla/5.0",
          },
          timeout: 15_000,
        }
      );
    } catch (err) {
      console.warn(`LeetCode fetch failed for ${username} year ${year}:`, err);
      continue;
    }

    const calendarRaw = response.data?.data?.matchedUser?.userCalendar?.submissionCalendar;
    if (!calendarRaw) continue;

    // submissionCalendar is a JSON string: { "unix_timestamp": count, ... }
    const calendar: Record<string, number> = JSON.parse(calendarRaw);

    for (const [ts, count] of Object.entries(calendar)) {
      if (count === 0) continue;
      const date = new Date(parseInt(ts) * 1000).toISOString().slice(0, 10);

      // Score: Easy=1, Medium=2, Hard=3 — we approximate since we only have total count
      const score = count * 2; // medium difficulty average

      await pool.query(
        `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, external_id)
         VALUES ($1, 'leetcode', 'problem_solved', $2, $3, $4, $5)
         ON CONFLICT (user_id, platform, activity_type, activity_date, external_id)
         DO UPDATE SET count = EXCLUDED.count, score = EXCLUDED.score`,
        [userId, date, count, score, `lc_${ts}`]
      );
      synced++;
    }
  }

  return synced;
}
