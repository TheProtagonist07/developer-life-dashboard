import {
  app,
  Tray,
  BrowserWindow,
  ipcMain,
  nativeImage,
  Menu,
  shell,
  screen,
} from "electron";
import * as path from "path";
import { fetchStatus, testConnection, type FetchResult } from "./api";
import { handleStatusNotifications } from "./notifications";
import { getSettings, saveSettings, isConfigured } from "./config";

let tray: Tray | null = null;
let popover: BrowserWindow | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let lastResult: FetchResult | null = null;

const WIN_WIDTH = 340;
const WIN_HEIGHT = 460;

// ── Tray ──────────────────────────────────────────────────────────────────────

function trayIconPath(): string {
  // Template image — macOS recolors it for light/dark menu bars automatically.
  return path.join(__dirname, "..", "assets", "trayTemplate.png");
}

function createTray() {
  const icon = nativeImage.createFromPath(trayIconPath());
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip("Dev Life — loading…");

  tray.on("click", () => togglePopover());
  tray.on("right-click", () => {
    const menu = Menu.buildFromTemplate([
      { label: "Refresh now", click: () => poll() },
      { label: "Open dashboard", click: openDashboard },
      { type: "separator" },
      { label: "Quit Dev Life", click: () => app.quit() },
    ]);
    tray?.popUpContextMenu(menu);
  });
}

function updateTrayTitle(result: FetchResult | null) {
  if (!tray) return;
  if (result?.ok && result.status) {
    const streak = result.status.overall_streak;
    // Show flame + streak count next to the menu bar icon.
    tray.setTitle(streak > 0 ? ` ${streak}` : "");
    tray.setToolTip(`Dev Life — ${streak}-day streak · ${result.status.today_count} today`);
  } else if (result?.error === "not_configured") {
    tray.setTitle("");
    tray.setToolTip("Dev Life — not configured");
  } else {
    tray.setToolTip("Dev Life — offline");
  }
}

// ── Popover window ──────────────────────────────────────────────────────────────

function createPopover() {
  popover = new BrowserWindow({
    width: WIN_WIDTH,
    height: WIN_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    fullscreenable: false,
    transparent: true,
    vibrancy: "popover",
    visualEffectState: "active",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  popover.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  // Hide when it loses focus — standard menu bar behavior.
  popover.on("blur", () => {
    if (popover?.isVisible()) popover.hide();
  });
}

function positionPopover() {
  if (!popover || !tray) return;
  const trayBounds = tray.getBounds();
  const winBounds = popover.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - winBounds.width / 2);
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  // Keep the window on screen horizontally.
  const maxX = display.workArea.x + display.workArea.width - winBounds.width - 8;
  x = Math.max(display.workArea.x + 8, Math.min(x, maxX));

  popover.setPosition(x, y, false);
}

function togglePopover() {
  if (!popover) return;
  if (popover.isVisible()) {
    popover.hide();
  } else {
    positionPopover();
    popover.show();
    popover.focus();
    // Send freshest data on open, and kick a refresh.
    sendStatusToRenderer();
    poll();
  }
}

// ── Polling ─────────────────────────────────────────────────────────────────────

async function poll() {
  const result = await fetchStatus();
  lastResult = result;
  updateTrayTitle(result);
  sendStatusToRenderer();

  if (result.ok && result.status) {
    handleStatusNotifications(result.status);
  }
}

function restartPollTimer() {
  if (pollTimer) clearInterval(pollTimer);
  const { pollIntervalSec } = getSettings();
  const interval = Math.max(60, pollIntervalSec) * 1000;
  pollTimer = setInterval(poll, interval);
}

function sendStatusToRenderer() {
  if (!popover) return;
  popover.webContents.send("status:update", {
    result: lastResult,
    configured: isConfigured(),
  });
}

function openDashboard() {
  const { apiUrl } = getSettings();
  // Dashboard runs on the web app; default to localhost:3000 if API is local.
  const webUrl = apiUrl.includes("localhost") ? "http://localhost:3000/dashboard" : apiUrl.replace(/:\d+$/, ":3000") + "/dashboard";
  shell.openExternal(webUrl);
}

// ── IPC ─────────────────────────────────────────────────────────────────────────

function registerIpc() {
  ipcMain.handle("status:get", () => ({ result: lastResult, configured: isConfigured() }));

  ipcMain.handle("status:refresh", async () => {
    await poll();
    return { result: lastResult, configured: isConfigured() };
  });

  ipcMain.handle("settings:get", () => getSettings());

  ipcMain.handle("settings:save", async (_e, partial) => {
    saveSettings(partial);
    restartPollTimer();
    await poll();
    return getSettings();
  });

  ipcMain.handle("settings:test", async (_e, { apiUrl, apiKey, userId }) => {
    return testConnection(apiUrl, apiKey, userId);
  });

  ipcMain.handle("app:open-dashboard", () => openDashboard());

  ipcMain.handle("app:resize", (_e, height: number) => {
    if (!popover) return;
    const clamped = Math.max(200, Math.min(700, Math.round(height)));
    popover.setSize(WIN_WIDTH, clamped, false);
    positionPopover();
  });

  ipcMain.handle("app:quit", () => app.quit());
}

// ── Lifecycle ────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Menu bar app — no dock icon.
  if (process.platform === "darwin") app.dock?.hide();

  registerIpc();
  createPopover();
  createTray();

  poll();
  restartPollTimer();

  // Open settings automatically on first run if nothing is configured.
  if (!isConfigured()) {
    setTimeout(() => togglePopover(), 600);
  }
});

app.on("window-all-closed", () => {
  // No-op: keep running in the menu bar. Registering this listener overrides
  // Electron's default of quitting when the last window closes. (The popover
  // hides rather than closes, so this is just a safety net.)
});

app.on("before-quit", () => {
  if (pollTimer) clearInterval(pollTimer);
});
