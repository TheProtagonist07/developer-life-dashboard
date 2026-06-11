import { Router } from "express";
import { requireAuth, loadUser } from "../middleware/auth";
import { query, queryOne } from "../db";
import type { DBUser, Platform, WeeklyStats } from "../types";

const router = Router();
router.use(requireAuth, loadUser);

// GET /analytics/weekly?weeks=8
router.get("/weekly", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const weeks = Math.min(parseInt(String(req.query.weeks ?? "8")), 52);

    const rows = await query<{
      week_start: string;
      week_end: string;
      total_count: string;
      total_score: string;
      active_days: string;
      platforms: Record<Platform, number>;
    }>(
      `SELECT
         DATE_TRUNC('week', activity_date)::date::text          AS week_start,
         (DATE_TRUNC('week', activity_date) + '6 days')::date::text AS week_end,
         SUM(count)::int                                        AS total_count,
         ROUND(SUM(score)::numeric, 2)                         AS total_score,
         COUNT(DISTINCT activity_date)::int                    AS active_days,
         jsonb_object_agg(platform, plat_score)                AS platforms
       FROM (
         SELECT activity_date, platform, SUM(count) AS count, SUM(score) AS plat_score
         FROM activities
         WHERE user_id = $1 AND activity_date >= NOW() - INTERVAL '${weeks} weeks'
         GROUP BY activity_date, platform
       ) sub
       GROUP BY DATE_TRUNC('week', activity_date)
       ORDER BY week_start DESC`,
      [user.id]
    );

    const stats: WeeklyStats[] = rows.map((r) => ({
      week_start: r.week_start,
      week_end: r.week_end,
      total_score: Number(r.total_score),
      total_count: Number(r.total_count),
      active_days: Number(r.active_days),
      by_platform: r.platforms ?? {},
      by_type: {},
    }));

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/monthly?months=6
router.get("/monthly", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const months = Math.min(parseInt(String(req.query.months ?? "6")), 24);

    const rows = await query<{
      month: string;
      total_count: string;
      total_score: string;
      active_days: string;
      by_platform: Record<Platform, number>;
    }>(
      `SELECT
         TO_CHAR(activity_date, 'YYYY-MM')          AS month,
         SUM(count)::int                            AS total_count,
         ROUND(SUM(score)::numeric, 2)              AS total_score,
         COUNT(DISTINCT activity_date)::int         AS active_days,
         jsonb_object_agg(platform, plat_score)     AS by_platform
       FROM (
         SELECT activity_date, platform, SUM(count) AS count, SUM(score) AS plat_score
         FROM activities
         WHERE user_id = $1 AND activity_date >= NOW() - INTERVAL '${months} months'
         GROUP BY activity_date, platform
       ) sub
       GROUP BY TO_CHAR(activity_date, 'YYYY-MM')
       ORDER BY month DESC`,
      [user.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/totals — all-time totals per platform
router.get("/totals", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const rows = await query<{ platform: Platform; total_count: string; total_score: string; distinct_days: string }>(
      `SELECT platform,
              SUM(count)::int              AS total_count,
              ROUND(SUM(score)::numeric,2) AS total_score,
              COUNT(DISTINCT activity_date)::int AS distinct_days
       FROM activities
       WHERE user_id = $1
       GROUP BY platform`,
      [user.id]
    );

    const overall = await queryOne<{ total: string; active_days: string }>(
      `SELECT SUM(count)::int AS total, COUNT(DISTINCT activity_date)::int AS active_days
       FROM activities WHERE user_id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      data: {
        byPlatform: rows,
        overall: {
          totalCount: Number(overall?.total ?? 0),
          activeDays: Number(overall?.active_days ?? 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/best-days
router.get("/best-days", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const rows = await query<{ activity_date: string; total_score: string }>(
      `SELECT activity_date::text, ROUND(SUM(score)::numeric, 2) AS total_score
       FROM activities WHERE user_id = $1
       GROUP BY activity_date
       ORDER BY total_score DESC
       LIMIT 10`,
      [user.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
