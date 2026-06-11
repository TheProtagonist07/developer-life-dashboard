import { Router } from "express";
import { z } from "zod";
import { requireAuth, loadUser } from "../middleware/auth";
import { query, pool } from "../db";
import type { DBGoal, DBUser } from "../types";

const router = Router();
router.use(requireAuth, loadUser);

const goalSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  goalType: z.enum(["leetcode_count", "commit_count", "codeforces_count", "study_hours", "project_sessions", "hackerrank_count"]),
  platform: z.enum(["github", "leetcode", "hackerrank", "codeforces", "manual"]).optional(),
  targetValue: z.number().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const status = req.query.status as string | undefined;

    const goals = await query<DBGoal>(
      `SELECT * FROM goals WHERE user_id = $1 ${status ? "AND status = $2" : ""} ORDER BY created_at DESC`,
      status ? [user.id, status] : [user.id]
    );

    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const data = goalSchema.parse(req.body);

    const result = await pool.query<DBGoal>(
      `INSERT INTO goals (user_id, title, description, goal_type, platform, target_value, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user.id, data.title, data.description ?? null, data.goalType, data.platform ?? null, data.targetValue, data.deadline ?? null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const updateSchema = goalSchema.partial().extend({
      status: z.enum(["active", "completed", "failed", "paused"]).optional(),
      currentValue: z.number().min(0).optional(),
    });
    const data = updateSchema.parse(req.body);

    const sets: string[] = [];
    const vals: unknown[] = [req.params.id, user.id];
    let i = 3;

    if (data.title !== undefined)        { sets.push(`title = $${i++}`);         vals.push(data.title); }
    if (data.description !== undefined)  { sets.push(`description = $${i++}`);   vals.push(data.description); }
    if (data.targetValue !== undefined)  { sets.push(`target_value = $${i++}`);  vals.push(data.targetValue); }
    if (data.currentValue !== undefined) { sets.push(`current_value = $${i++}`); vals.push(data.currentValue); }
    if (data.deadline !== undefined)     { sets.push(`deadline = $${i++}`);      vals.push(data.deadline); }
    if (data.status !== undefined)       { sets.push(`status = $${i++}`);        vals.push(data.status); }

    if (sets.length === 0) return res.status(400).json({ success: false, error: { code: "NO_CHANGES" } });

    const result = await pool.query<DBGoal>(
      `UPDATE goals SET ${sets.join(", ")} WHERE id = $1 AND user_id = $2 RETURNING *`,
      vals
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, error: { code: "NOT_FOUND" } });

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const result = await pool.query("DELETE FROM goals WHERE id = $1 AND user_id = $2", [req.params.id, user.id]);

    if (result.rowCount === 0) return res.status(404).json({ success: false, error: { code: "NOT_FOUND" } });

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
