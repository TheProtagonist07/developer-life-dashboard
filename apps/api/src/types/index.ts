export type Platform = "github" | "leetcode" | "hackerrank" | "codeforces" | "manual";

export type ActivityType =
  | "commit"
  | "pr_merged"
  | "problem_solved"
  | "contest_participated"
  | "study_session"
  | "project_work"
  | "article_read"
  | "course_progress";

export type StreakType = "coding" | "dsa" | "learning" | "project" | "overall";

export interface DBUser {
  id: string;
  github_id: number;
  username: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  github_token: string | null;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DBActivity {
  id: string;
  user_id: string;
  platform: Platform;
  activity_type: ActivityType;
  activity_date: Date;
  count: number;
  score: number;
  metadata: Record<string, unknown>;
  external_id: string | null;
  created_at: Date;
}

export interface DBStreak {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
  streak_start_date: Date | null;
  updated_at: Date;
}

export interface DBGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: string;
  platform: Platform | null;
  target_value: number;
  current_value: number;
  deadline: Date | null;
  status: "active" | "completed" | "failed" | "paused";
  created_at: Date;
  updated_at: Date;
}

export interface HeatmapDay {
  date: string;
  count: number;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  breakdown: Partial<Record<Platform, number>>;
}

export interface WeeklyStats {
  week_start: string;
  week_end: string;
  total_score: number;
  total_count: number;
  active_days: number;
  by_platform: Partial<Record<Platform, number>>;
  by_type: Partial<Record<ActivityType, number>>;
}

// Extends Express Request
declare global {
  namespace Express {
    interface User extends DBUser {}
  }
}
