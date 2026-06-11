import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config";
import { syncGitHub } from "../integrations/github";
import { syncLeetCode } from "../integrations/leetcode";
import { syncCodeforces } from "../integrations/codeforces";
import { syncHackerRank } from "../integrations/hackerrank";
import { recalculateStreaks } from "../services/streak";
import { checkAchievements } from "../services/achievements";
import { query, pool } from "../db";

export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const syncQueue = new Queue("platform-sync", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export async function enqueueSync(userId: string, platform: string) {
  await syncQueue.add(
    "sync",
    { userId, platform },
    { jobId: `sync:${userId}:${platform}:${Date.now()}` }
  );
}

export async function enqueueSyncAll(userId: string) {
  const connections = await query<{ platform: string; username: string }>(
    "SELECT platform, username FROM platform_connections WHERE user_id = $1 AND sync_enabled = true",
    [userId]
  );

  for (const conn of connections) {
    await enqueueSync(userId, conn.platform);
  }
}

async function runSync(userId: string, platform: string) {
  const conn = await query<{ username: string; access_token: string | null }>(
    "SELECT username, access_token FROM platform_connections WHERE user_id = $1 AND platform = $2",
    [userId, platform]
  );

  if (!conn[0]) throw new Error(`No connection found for ${platform}`);

  const { username, access_token } = conn[0];

  let synced = 0;

  switch (platform) {
    case "github": {
      const user = await query<{ github_token: string | null }>(
        "SELECT github_token FROM users WHERE id = $1",
        [userId]
      );
      const token = access_token ?? user[0]?.github_token;
      if (!token) throw new Error("No GitHub token");
      synced = await syncGitHub(userId, username, token, config.sync.initialSyncDays);
      break;
    }
    case "leetcode":
      synced = await syncLeetCode(userId, username);
      break;
    case "codeforces":
      synced = await syncCodeforces(userId, username);
      break;
    case "hackerrank":
      synced = await syncHackerRank(userId, username);
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }

  return synced;
}

export function startWorker() {
  const worker = new Worker(
    "platform-sync",
    async (job: Job) => {
      const { userId, platform } = job.data as { userId: string; platform: string };

      // Track job in DB
      const jobResult = await pool.query(
        `INSERT INTO sync_jobs (user_id, platform, status, started_at)
         VALUES ($1, $2, 'running', NOW()) RETURNING id`,
        [userId, platform]
      );
      const jobId = jobResult.rows[0].id;

      try {
        const synced = await runSync(userId, platform);

        await pool.query(
          "UPDATE sync_jobs SET status = 'completed', completed_at = NOW(), records_synced = $1 WHERE id = $2",
          [synced, jobId]
        );
        await pool.query(
          "UPDATE platform_connections SET last_synced_at = NOW() WHERE user_id = $1 AND platform = $2",
          [userId, platform]
        );

        // Recalculate streaks + achievements after sync
        await recalculateStreaks(userId);
        await checkAchievements(userId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await pool.query(
          "UPDATE sync_jobs SET status = 'failed', completed_at = NOW(), error_message = $1 WHERE id = $2",
          [msg, jobId]
        );
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 3 }
  );

  worker.on("failed", (job, err) => {
    console.error(`[Sync Worker] Job failed ${job?.id}:`, err.message);
  });

  return worker;
}
