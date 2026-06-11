import { Router } from "express";
import { requireAuth, loadUser } from "../middleware/auth";
import { query } from "../db";
import type { DBUser } from "../types";

const router = Router();
router.use(requireAuth, loadUser);

router.get("/", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const streaks = await query<{
      streak_type: string;
      current_streak: number;
      longest_streak: number;
      last_activity_date: string | null;
      streak_start_date: string | null;
    }>(
      `SELECT streak_type, current_streak, longest_streak,
              last_activity_date::text, streak_start_date::text
       FROM streaks WHERE user_id = $1 ORDER BY streak_type`,
      [user.id]
    );

    res.json({ success: true, data: streaks });
  } catch (err) {
    next(err);
  }
});

export default router;
