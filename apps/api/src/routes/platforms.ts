import { Router } from "express";
import { z } from "zod";
import { requireAuth, loadUser } from "../middleware/auth";
import { query, pool } from "../db";
import type { DBUser } from "../types";
import { enqueueSync } from "../workers/queue";

const router = Router();
router.use(requireAuth, loadUser);

router.get("/", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const connections = await query<{
      platform: string;
      username: string;
      sync_enabled: boolean;
      connected_at: string;
      last_synced_at: string | null;
    }>(
      `SELECT platform, username, sync_enabled, connected_at, last_synced_at
       FROM platform_connections WHERE user_id = $1 ORDER BY connected_at`,
      [user.id]
    );

    // Also get latest sync job status per platform
    const syncStatuses = await query<{ platform: string; status: string; created_at: string }>(
      `SELECT DISTINCT ON (platform) platform, status, created_at
       FROM sync_jobs WHERE user_id = $1
       ORDER BY platform, created_at DESC`,
      [user.id]
    );

    const statusMap = Object.fromEntries(syncStatuses.map((s) => [s.platform, s]));

    const data = connections.map((c) => ({
      ...c,
      lastSyncStatus: statusMap[c.platform] ?? null,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

const connectSchema = z.object({
  platform: z.enum(["leetcode", "hackerrank", "codeforces"]),
  username: z.string().min(1).max(255),
});

router.post("/connect", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const data = connectSchema.parse(req.body);

    await pool.query(
      `INSERT INTO platform_connections (user_id, platform, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, platform) DO UPDATE
       SET username = EXCLUDED.username, sync_enabled = true, last_synced_at = NULL`,
      [user.id, data.platform, data.username]
    );

    // Queue immediate sync
    await enqueueSync(user.id, data.platform);

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:platform", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    const platform = req.params.platform;

    if (platform === "github") {
      return res.status(400).json({ success: false, error: { code: "CANNOT_DISCONNECT_GITHUB", message: "GitHub is used for authentication" } });
    }

    await pool.query(
      "DELETE FROM platform_connections WHERE user_id = $1 AND platform = $2",
      [user.id, platform]
    );

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

router.patch("/:platform/toggle", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    await pool.query(
      `UPDATE platform_connections SET sync_enabled = NOT sync_enabled
       WHERE user_id = $1 AND platform = $2`,
      [user.id, req.params.platform]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
