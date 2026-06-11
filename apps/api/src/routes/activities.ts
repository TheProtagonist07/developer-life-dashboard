import { Router } from "express";
import { z } from "zod";
import { requireAuth, loadUser } from "../middleware/auth";
import { query, queryOne, pool } from "../db";
import type { DBUser, HeatmapDay, Platform } from "../types";
import { computeHeatmapLevel } from "../services/analytics";

const router = Router();
router.use(requireAuth, loadUser);

// GET /activities/heatmap?year=2024&platform=all
router.get("/heatmap", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const year = parseInt(String(req.query.year ?? new Date().getFullYear()));
    const platform = req.query.platform as Platform | "all" | undefined;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const rows = await query<{
      activity_date: string;
      total_count: string;
      total_score: string;
      breakdown: Record<Platform, number>;
    }>(
      `SELECT
         activity_date::text,
         SUM(count)::int  AS total_count,
         SUM(score)       AS total_score,
         jsonb_object_agg(platform, platform_score) AS breakdown
       FROM (
         SELECT activity_date, platform, SUM(count) AS count, SUM(score) AS platform_score
         FROM activities
         WHERE user_id = $1
           AND activity_date BETWEEN $2 AND $3
           ${platform && platform !== "all" ? "AND platform = $4" : ""}
         GROUP BY activity_date, platform
       ) sub
       GROUP BY activity_date
       ORDER BY activity_date`,
      platform && platform !== "all"
        ? [user.id, startDate, endDate, platform]
        : [user.id, startDate, endDate]
    );

    const days: HeatmapDay[] = rows.map((r) => ({
      date: r.activity_date,
      count: Number(r.total_count),
      score: Number(r.total_score),
      level: computeHeatmapLevel(Number(r.total_score)),
      breakdown: r.breakdown ?? {},
    }));

    res.json({ success: true, data: { year, days } });
  } catch (err) {
    next(err);
  }
});

// GET /activities/feed?limit=20&offset=0&platform=all
router.get("/feed", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const limit = Math.min(parseInt(String(req.query.limit ?? "20")), 100);
    const offset = parseInt(String(req.query.offset ?? "0"));
    const platform = req.query.platform as Platform | undefined;

    const activities = await query<{
      id: string;
      platform: Platform;
      activity_type: string;
      activity_date: string;
      count: number;
      score: number;
      metadata: Record<string, unknown>;
      created_at: string;
    }>(
      `SELECT id, platform, activity_type, activity_date::text, count, score, metadata, created_at
       FROM activities
       WHERE user_id = $1
         ${platform ? "AND platform = $2" : ""}
       ORDER BY activity_date DESC, created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      platform ? [user.id, platform] : [user.id]
    );

    res.json({ success: true, data: { activities, limit, offset } });
  } catch (err) {
    next(err);
  }
});

// POST /activities/manual — log a manual study/project session
const manualSchema = z.object({
  activityType: z.enum(["study_session", "project_work", "article_read", "course_progress"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).default(1),
  durationMinutes: z.number().min(1).optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

router.post("/manual", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const data = manualSchema.parse(req.body);

    const score = data.durationMinutes ? Math.ceil(data.durationMinutes / 30) : data.count;

    await pool.query(
      `INSERT INTO activities (user_id, platform, activity_type, activity_date, count, score, metadata)
       VALUES ($1, 'manual', $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, activity_type, activity_date, external_id)
       DO UPDATE SET count = activities.count + EXCLUDED.count, score = activities.score + EXCLUDED.score`,
      [user.id, data.activityType, data.date, data.count, score, { notes: data.notes, tags: data.tags, durationMinutes: data.durationMinutes }]
    );

    // Trigger streak recalculation
    const { recalculateStreaks } = await import("../services/streak");
    await recalculateStreaks(user.id);

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /activities/summary — today's and this-week's summary
router.get("/summary", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

    const [todayRow, weekRow] = await Promise.all([
      queryOne<{ count: string; score: string }>(
        `SELECT SUM(count)::int as count, SUM(score) as score FROM activities WHERE user_id = $1 AND activity_date = $2`,
        [user.id, today]
      ),
      queryOne<{ count: string; score: string; active_days: string }>(
        `SELECT SUM(count)::int as count, SUM(score) as score, COUNT(DISTINCT activity_date)::int as active_days
         FROM activities WHERE user_id = $1 AND activity_date BETWEEN $2 AND $3`,
        [user.id, weekAgo, today]
      ),
    ]);

    res.json({
      success: true,
      data: {
        today: { count: Number(todayRow?.count ?? 0), score: Number(todayRow?.score ?? 0) },
        week: {
          count: Number(weekRow?.count ?? 0),
          score: Number(weekRow?.score ?? 0),
          activeDays: Number(weekRow?.active_days ?? 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
