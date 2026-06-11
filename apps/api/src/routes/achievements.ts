import { Router } from "express";
import { requireAuth, loadUser } from "../middleware/auth";
import { query } from "../db";
import type { DBUser } from "../types";

const router = Router();
router.use(requireAuth, loadUser);

router.get("/", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const achievements = await query<{
      achievement_key: string;
      title: string;
      description: string;
      icon: string;
      earned_at: string;
    }>(
      `SELECT achievement_key, title, description, icon, earned_at
       FROM achievements WHERE user_id = $1 ORDER BY earned_at DESC`,
      [user.id]
    );

    res.json({ success: true, data: achievements });
  } catch (err) {
    next(err);
  }
});

export default router;
