import { pool, queryOne, query } from "../db";

interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  check: (userId: string) => Promise<boolean>;
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_commit",
    title: "First Steps",
    description: "Made your first GitHub commit",
    icon: "🚀",
    check: async (userId) => {
      const r = await queryOne<{ c: string }>(
        "SELECT COUNT(*)::int as c FROM activities WHERE user_id = $1 AND platform = 'github' AND activity_type = 'commit'",
        [userId]
      );
      return Number(r?.c ?? 0) > 0;
    },
  },
  {
    key: "first_leetcode",
    title: "Algo Awakening",
    description: "Solved your first LeetCode problem",
    icon: "🧩",
    check: async (userId) => {
      const r = await queryOne<{ c: string }>(
        "SELECT COUNT(*)::int as c FROM activities WHERE user_id = $1 AND platform = 'leetcode'",
        [userId]
      );
      return Number(r?.c ?? 0) > 0;
    },
  },
  {
    key: "week_streak",
    title: "Week Warrior",
    description: "Maintained a 7-day overall streak",
    icon: "🔥",
    check: async (userId) => {
      const r = await queryOne<{ longest_streak: number }>(
        "SELECT longest_streak FROM streaks WHERE user_id = $1 AND streak_type = 'overall'",
        [userId]
      );
      return (r?.longest_streak ?? 0) >= 7;
    },
  },
  {
    key: "month_streak",
    title: "Month Maverick",
    description: "Maintained a 30-day overall streak",
    icon: "🌟",
    check: async (userId) => {
      const r = await queryOne<{ longest_streak: number }>(
        "SELECT longest_streak FROM streaks WHERE user_id = $1 AND streak_type = 'overall'",
        [userId]
      );
      return (r?.longest_streak ?? 0) >= 30;
    },
  },
  {
    key: "leetcode_50",
    title: "Problem Solver",
    description: "Solved 50 LeetCode problems",
    icon: "🎯",
    check: async (userId) => {
      const r = await queryOne<{ total: string }>(
        "SELECT SUM(count)::int as total FROM activities WHERE user_id = $1 AND platform = 'leetcode'",
        [userId]
      );
      return Number(r?.total ?? 0) >= 50;
    },
  },
  {
    key: "leetcode_100",
    title: "Century Coder",
    description: "Solved 100 LeetCode problems",
    icon: "💯",
    check: async (userId) => {
      const r = await queryOne<{ total: string }>(
        "SELECT SUM(count)::int as total FROM activities WHERE user_id = $1 AND platform = 'leetcode'",
        [userId]
      );
      return Number(r?.total ?? 0) >= 100;
    },
  },
  {
    key: "multi_platform",
    title: "Full Stack Developer",
    description: "Active on 3+ platforms in a single day",
    icon: "🌐",
    check: async (userId) => {
      const r = await queryOne<{ max_platforms: string }>(
        `SELECT MAX(platform_count)::int as max_platforms FROM (
           SELECT activity_date, COUNT(DISTINCT platform) as platform_count
           FROM activities WHERE user_id = $1
           GROUP BY activity_date
         ) sub`,
        [userId]
      );
      return Number(r?.max_platforms ?? 0) >= 3;
    },
  },
  {
    key: "github_100",
    title: "Commit Champion",
    description: "Made 100 GitHub contributions",
    icon: "⭐",
    check: async (userId) => {
      const r = await queryOne<{ total: string }>(
        "SELECT SUM(count)::int as total FROM activities WHERE user_id = $1 AND platform = 'github'",
        [userId]
      );
      return Number(r?.total ?? 0) >= 100;
    },
  },
];

export async function checkAchievements(userId: string): Promise<void> {
  const earned = await query<{ achievement_key: string }>(
    "SELECT achievement_key FROM achievements WHERE user_id = $1",
    [userId]
  );
  const earnedKeys = new Set(earned.map((a) => a.achievement_key));

  for (const achievement of ACHIEVEMENTS) {
    if (earnedKeys.has(achievement.key)) continue;

    try {
      const unlocked = await achievement.check(userId);
      if (unlocked) {
        await pool.query(
          `INSERT INTO achievements (user_id, achievement_key, title, description, icon)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, achievement_key) DO NOTHING`,
          [userId, achievement.key, achievement.title, achievement.description, achievement.icon]
        );
        console.log(`[Achievement] ${userId} earned: ${achievement.title}`);
      }
    } catch (err) {
      console.warn(`[Achievement] Check failed for ${achievement.key}:`, err);
    }
  }
}
