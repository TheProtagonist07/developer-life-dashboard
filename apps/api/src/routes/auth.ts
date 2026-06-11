import { Router } from "express";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { config } from "../config";
import { pool, queryOne } from "../db";
import { issueToken, requireAuth, loadUser } from "../middleware/auth";
import type { DBUser } from "../types";
import { enqueueSyncAll } from "../workers/queue";

const router = Router();

passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackUrl,
      scope: ["user:email", "read:user"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.find((e: { primary: boolean }) => e.primary)?.value ??
          profile.emails?.[0]?.value ??
          null;

        const existing = await queryOne<DBUser>(
          "SELECT * FROM users WHERE github_id = $1",
          [profile.id]
        );

        if (existing) {
          await pool.query(
            `UPDATE users SET
               username = $1, email = $2, display_name = $3,
               avatar_url = $4, github_token = $5, updated_at = NOW()
             WHERE github_id = $6`,
            [profile.username, email, profile.displayName, profile.photos?.[0]?.value, _accessToken, profile.id]
          );
          const updated = await queryOne<DBUser>("SELECT * FROM users WHERE github_id = $1", [profile.id]);
          return done(null, updated!);
        }

        const result = await pool.query<DBUser>(
          `INSERT INTO users (github_id, username, email, display_name, avatar_url, github_token)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [profile.id, profile.username, email, profile.displayName, profile.photos?.[0]?.value, _accessToken]
        );
        const newUser = result.rows[0];

        // Connect github platform + queue initial sync
        await pool.query(
          `INSERT INTO platform_connections (user_id, platform, username, access_token)
           VALUES ($1, 'github', $2, $3)
           ON CONFLICT (user_id, platform) DO UPDATE
           SET username = EXCLUDED.username, access_token = EXCLUDED.access_token`,
          [newUser.id, profile.username, _accessToken]
        );

        // Initialize default streaks
        const streakTypes = ["coding", "dsa", "learning", "project", "overall"];
        for (const type of streakTypes) {
          await pool.query(
            `INSERT INTO streaks (user_id, streak_type) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newUser.id, type]
          );
        }

        await enqueueSyncAll(newUser.id);

        return done(null, newUser);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

router.get("/github", passport.authenticate("github", { session: false }));

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${config.frontendUrl}/?error=auth_failed` }),
  (req, res) => {
    const user = req.user as DBUser;
    const token = issueToken(user.id);

    res.cookie(config.cookieName, token, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

router.get("/me", requireAuth, loadUser, (req, res) => {
  const user = req.user as DBUser;
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      timezone: user.timezone,
      createdAt: user.created_at,
    },
  });
});

router.delete("/logout", (req, res) => {
  res.clearCookie(config.cookieName);
  res.json({ success: true });
});

export default router;
