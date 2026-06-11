import { Router } from "express";
import { requireHaAuth } from "../middleware/auth";
import { query, queryOne } from "../db";

const router = Router();
router.use(requireHaAuth);

// Home Assistant REST sensor format
router.get("/sensors/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [streaks, today, weekRow] = await Promise.all([
      query<{ streak_type: string; current_streak: number; longest_streak: number }>(
        "SELECT streak_type, current_streak, longest_streak FROM streaks WHERE user_id = $1",
        [userId]
      ),
      queryOne<{ count: string; score: string }>(
        `SELECT SUM(count)::int as count, ROUND(SUM(score)::numeric,1) as score
         FROM activities WHERE user_id = $1 AND activity_date = CURRENT_DATE`,
        [userId]
      ),
      queryOne<{ active_days: string; total_score: string }>(
        `SELECT COUNT(DISTINCT activity_date)::int as active_days, ROUND(SUM(score)::numeric,1) as total_score
         FROM activities WHERE user_id = $1 AND activity_date >= NOW() - INTERVAL '7 days'`,
        [userId]
      ),
    ]);

    const streakMap = Object.fromEntries(streaks.map((s) => [s.streak_type, s]));

    // HA sensor format — each key becomes a sensor
    const sensors = {
      overall_streak: streakMap.overall?.current_streak ?? 0,
      coding_streak:  streakMap.coding?.current_streak ?? 0,
      dsa_streak:     streakMap.dsa?.current_streak ?? 0,
      today_count:    Number(today?.count ?? 0),
      today_score:    Number(today?.score ?? 0),
      week_active_days: Number(weekRow?.active_days ?? 0),
      week_score:       Number(weekRow?.total_score ?? 0),
    };

    res.json({ success: true, data: sensors });
  } catch (err) {
    next(err);
  }
});

// Webhook endpoint — Home Assistant can push events here
router.post("/webhook/:userId", async (req, res) => {
  // Placeholder for future HA → dashboard events
  res.json({ success: true });
});

export default router;
