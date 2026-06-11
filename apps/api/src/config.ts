import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: parseInt(process.env.PORT ?? "3001"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isDev: process.env.NODE_ENV !== "production",

  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: "7d",
  cookieName: "devlife_token",

  github: {
    clientId: required("GITHUB_CLIENT_ID"),
    clientSecret: required("GITHUB_CLIENT_SECRET"),
    callbackUrl: process.env.GITHUB_CALLBACK_URL ?? "http://localhost:3001/auth/github/callback",
  },

  frontendUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  haApiKey: process.env.HA_API_KEY ?? "",

  sync: {
    cron: process.env.SYNC_CRON ?? "0 * * * *",
    initialSyncDays: parseInt(process.env.INITIAL_SYNC_DAYS ?? "365"),
  },
} as const;
