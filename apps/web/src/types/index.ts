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

export interface User {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  createdAt: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  breakdown: Partial<Record<Platform, number>>;
}

export interface Streak {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_start_date: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  platform: Platform | null;
  target_value: number;
  current_value: number;
  deadline: string | null;
  status: "active" | "completed" | "failed" | "paused";
  created_at: string;
}

export interface Activity {
  id: string;
  platform: Platform;
  activity_type: ActivityType;
  activity_date: string;
  count: number;
  score: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Achievement {
  achievement_key: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface PlatformConnection {
  platform: Platform;
  username: string;
  sync_enabled: boolean;
  connected_at: string;
  last_synced_at: string | null;
  lastSyncStatus: { status: string; created_at: string } | null;
}

export interface WeeklyStats {
  week_start: string;
  week_end: string;
  total_score: number;
  total_count: number;
  active_days: number;
  by_platform: Partial<Record<Platform, number>>;
}

export interface MonthlyStats {
  month: string;
  total_count: number;
  total_score: number;
  active_days: number;
  by_platform: Partial<Record<Platform, number>>;
}

export interface DailySummary {
  today: { count: number; score: number };
  week: { count: number; score: number; activeDays: number };
}
