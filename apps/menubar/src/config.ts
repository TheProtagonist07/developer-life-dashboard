import Store from "electron-store";

export interface Settings {
  apiUrl: string;
  apiKey: string;
  userId: string;
  pollIntervalSec: number;
  notifyOnStreak: boolean;
  remindIfIdle: boolean;
}

export interface AppState {
  // Tracks last-seen values so we only notify on change.
  lastOverallStreak: number;
  lastIdleReminderDate: string | null; // YYYY-MM-DD
}

const defaults: Settings & AppState = {
  apiUrl: "http://localhost:3001",
  apiKey: "",
  userId: "",
  pollIntervalSec: 300,
  notifyOnStreak: true,
  remindIfIdle: true,
  lastOverallStreak: 0,
  lastIdleReminderDate: null,
};

const store = new Store<Settings & AppState>({
  name: "devlife-menubar",
  defaults,
});

export function getSettings(): Settings {
  return {
    apiUrl: store.get("apiUrl"),
    apiKey: store.get("apiKey"),
    userId: store.get("userId"),
    pollIntervalSec: store.get("pollIntervalSec"),
    notifyOnStreak: store.get("notifyOnStreak"),
    remindIfIdle: store.get("remindIfIdle"),
  };
}

export function saveSettings(partial: Partial<Settings>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key, value);
  }
}

export function isConfigured(): boolean {
  return Boolean(store.get("apiKey") && store.get("userId") && store.get("apiUrl"));
}

export function getState(): AppState {
  return {
    lastOverallStreak: store.get("lastOverallStreak"),
    lastIdleReminderDate: store.get("lastIdleReminderDate"),
  };
}

export function setState(partial: Partial<AppState>): void {
  for (const [key, value] of Object.entries(partial)) {
    store.set(key, value);
  }
}
