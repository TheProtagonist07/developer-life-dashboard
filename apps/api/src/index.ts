import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import passport from "passport";
import rateLimit from "express-rate-limit";
import cron from "node-cron";

import { config } from "./config";
import { pool } from "./db";
import routes from "./routes/index";
import { errorHandler, notFound } from "./middleware/error";
import { startWorker, enqueueSyncAll, syncQueue } from "./workers/queue";
import { query } from "./db";

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Body / Cookies ────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/", routes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  // Verify DB connection
  await pool.query("SELECT 1");
  console.log("[DB] Connected to PostgreSQL");

  // Start BullMQ worker
  const worker = startWorker();
  console.log("[Queue] Sync worker started");

  // Scheduled background syncs
  cron.schedule(config.sync.cron, async () => {
    console.log("[Cron] Triggering scheduled syncs...");
    const users = await query<{ id: string }>(
      `SELECT DISTINCT u.id FROM users u
       JOIN platform_connections pc ON pc.user_id = u.id
       WHERE pc.sync_enabled = true`
    );
    for (const user of users) {
      await enqueueSyncAll(user.id);
    }
    console.log(`[Cron] Queued syncs for ${users.length} users`);
  });

  app.listen(config.port, () => {
    console.log(`[API] Running on http://localhost:${config.port}`);
    console.log(`[ENV] ${config.nodeEnv}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("[Shutdown] Closing connections...");
    await worker.close();
    await syncQueue.close();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("[Fatal]", err);
  process.exit(1);
});
