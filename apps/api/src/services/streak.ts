import { pool, query } from "../db";

const STREAK_PLATFORM_MAP: Record<string, string[]> = {
  coding:  ["github"],
  dsa:     ["leetcode", "hackerrank", "codeforces"],
  learning: ["manual"],
  project: ["manual"],
  overall: ["github", "leetcode", "hackerrank", "codeforces", "manual"],
};

const STREAK_TYPE_MAP: Record<string, string[]> = {
  coding:   ["commit", "pr_merged"],
  dsa:      ["problem_solved", "contest_participated"],
  learning: ["study_session", "article_read", "course_progress"],
  project:  ["project_work"],
  overall:  [],  // all types
};

export async function recalculateStreaks(userId: string): Promise<void> {
  const streakTypes = ["coding", "dsa", "learning", "project", "overall"] as const;

  for (const streakType of streakTypes) {
    const platforms = STREAK_PLATFORM_MAP[streakType];
    const activityTypes = STREAK_TYPE_MAP[streakType];

    const platformFilter = platforms.length > 0
      ? `AND platform = ANY($2::text[])`
      : "";
    const typeFilter = activityTypes.length > 0
      ? `AND activity_type = ANY($${platforms.length > 0 ? 3 : 2}::text[])`
      : "";

    const params: unknown[] = [userId];
    if (platforms.length > 0) params.push(platforms);
    if (activityTypes.length > 0) params.push(activityTypes);

    const activeDays = await query<{ activity_date: string }>(
      `SELECT DISTINCT activity_date::text
       FROM activities
       WHERE user_id = $1 ${platformFilter} ${typeFilter}
       ORDER BY activity_date DESC`,
      params
    );

    if (activeDays.length === 0) {
      await pool.query(
        `INSERT INTO streaks (user_id, streak_type, current_streak, longest_streak)
         VALUES ($1, $2, 0, 0)
         ON CONFLICT (user_id, streak_type) DO UPDATE
         SET current_streak = 0, updated_at = NOW()`,
        [userId, streakType]
      );
      continue;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86_400_000);

    const dates = activeDays.map((r) => new Date(r.activity_date + "T00:00:00Z"));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Check if streak is still alive (last activity today or yesterday)
    const lastDate = dates[0];
    const lastDateTs = lastDate.getTime();
    const todayTs = today.getTime();
    const yesterdayTs = yesterday.getTime();

    const streakAlive = lastDateTs === todayTs || lastDateTs === yesterdayTs;

    if (streakAlive) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = dates[i - 1].getTime() - dates[i].getTime();
        if (diff === 86_400_000) {
          currentStreak++;
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          break;
        }
      }
    }

    // Calculate longest streak across all history
    let tempLen = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i - 1].getTime() - dates[i].getTime();
      if (diff === 86_400_000) {
        tempLen++;
      } else {
        longestStreak = Math.max(longestStreak, tempLen);
        tempLen = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempLen, currentStreak);

    const streakStart = currentStreak > 0
      ? new Date(lastDate.getTime() - (currentStreak - 1) * 86_400_000).toISOString().slice(0, 10)
      : null;

    await pool.query(
      `INSERT INTO streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, streak_type) DO UPDATE
       SET current_streak = $3, longest_streak = GREATEST(streaks.longest_streak, $4),
           last_activity_date = $5, streak_start_date = $6, updated_at = NOW()`,
      [userId, streakType, currentStreak, longestStreak, activeDays[0].activity_date, streakStart]
    );
  }
}
