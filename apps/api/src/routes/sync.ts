import { Router } from "express";
import { requireAuth, loadUser } from "../middleware/auth";
import { query } from "../db";
import type { DBUser } from "../types";
import { enqueueSync, enqueueSyncAll } from "../workers/queue";

const router = Router();
router.use(requireAuth, loadUser);

router.post("/trigger", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    await enqueueSyncAll(user.id);
    res.json({ success: true, message: "Sync queued for all connected platforms" });
  } catch (err) {
    next(err);
  }
});

router.post("/trigger/:platform", async (req, res, next) => {
  try {
    const user = req.user as DBUser;
    await enqueueSync(user.id, req.params.platform);
    res.json({ success: true, message: `Sync queued for ${req.params.platform}` });
  } catch (err) {
    next(err);
  }
});

router.get("/status", async (req, res, next) => {
  try {
    const user = req.user as DBUser;

    const jobs = await query<{
      platform: string;
      status: string;
      records_synced: number;
      started_at: string | null;
      completed_at: string | null;
      error_message: string | null;
      created_at: string;
    }>(
      `SELECT DISTINCT ON (platform) platform, status, records_synced, started_at, completed_at, error_message, created_at
       FROM sync_jobs WHERE user_id = $1
       ORDER BY platform, created_at DESC`,
      [user.id]
    );

    res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
});

export default router;
