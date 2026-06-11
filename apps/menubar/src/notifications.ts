import { Notification } from "electron";
import { getSettings, getState, setState } from "./config";
import type { DailyStatus } from "./api";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function notify(title: string, body: string): void {
  if (!Notification.isSupported()) return;
  new Notification({ title, body, silent: false }).show();
}

// Called after every successful poll. Compares against stored state and fires
// native notifications for streak gains and (optionally) an idle-day reminder.
export function handleStatusNotifications(status: DailyStatus): void {
  const settings = getSettings();
  const state = getState();

  // 1. Streak increased since we last checked → celebrate.
  if (settings.notifyOnStreak && status.overall_streak > state.lastOverallStreak && state.lastOverallStreak > 0) {
    notify(
      "🔥 Streak extended!",
      `You're on a ${status.overall_streak}-day streak. Keep it going.`
    );
  }

  // Milestone celebration on round numbers.
  if (
    settings.notifyOnStreak &&
    status.overall_streak > state.lastOverallStreak &&
    [7, 14, 30, 50, 100, 365].includes(status.overall_streak)
  ) {
    notify("🏆 Milestone reached!", `${status.overall_streak} days in a row. Incredible consistency.`);
  }

  // 2. Idle reminder — if it's late and nothing logged today, nudge once per day.
  if (settings.remindIfIdle && status.today_count === 0) {
    const hour = new Date().getHours();
    const today = todayStr();
    if (hour >= 18 && state.lastIdleReminderDate !== today) {
      notify("Don't break your streak", "No activity logged today yet. A quick session counts!");
      setState({ lastIdleReminderDate: today });
    }
  }

  setState({ lastOverallStreak: status.overall_streak });
}
