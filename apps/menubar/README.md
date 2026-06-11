# Dev Life — macOS Menu Bar App

A lightweight Electron menu bar app that keeps your developer streak and daily
status one click away — no need to open the dashboard.

![Platform](https://img.shields.io/badge/platform-macOS-black)
![Electron](https://img.shields.io/badge/Electron-31-47848F)

## Features

- 🔥 **Streak at a glance** — your overall streak count sits right in the menu bar
- ⚡ **Daily status popover** — today's activity, weekly active days, coding & DSA streaks
- 🔔 **Native notifications** — streak extensions, milestones (7/14/30/50/100/365), and an optional idle-day reminder
- 🔄 **Auto-refresh** — polls on a configurable interval (default 5 min)
- 🔗 **Quick dashboard access** — one click to open the full web dashboard

## How it works

The app reads from the API's Home Assistant sensor endpoint
(`GET /ha/sensors/:userId`) using a Bearer API key. This is the same lightweight,
read-only data source used for Home Assistant — it returns exactly the daily-status
numbers the popover needs, with **no OAuth flow required in the desktop app**.

## Setup

### 1. Configure the API

In your dashboard's `.env`, make sure `HA_API_KEY` is set to a random string.
Then grab two things:

- **API key** — the `HA_API_KEY` value from `.env`
- **User ID** — shown on the dashboard under **Settings → Home Assistant**

### 2. Run the app

```bash
cd apps/menubar
npm install
npm run icons      # generate tray + app icons (requires Python + Pillow)
npm run dev        # compile and launch
```

On first launch the settings panel opens automatically. Enter your **API URL**
(e.g. `http://localhost:3001`), **API key**, and **User ID**, hit **Test
connection**, then **Save**.

### 3. Build a distributable (optional)

```bash
npm run dist       # produces a .dmg in dist/ via electron-builder
```

## Project structure

```
apps/menubar/
├── src/
│   ├── main.ts           # Electron main: tray, popover window, polling, IPC
│   ├── preload.ts        # contextBridge — safe renderer ↔ main API
│   ├── config.ts         # settings + state (electron-store)
│   ├── api.ts            # fetch daily status from /ha/sensors/:userId
│   └── notifications.ts  # streak / milestone / idle-day notifications
├── renderer/
│   ├── index.html        # popover UI (status / empty / settings views)
│   ├── styles.css        # dark, vibrancy-backed styling
│   └── renderer.js        # view logic, settings form, live updates
├── assets/               # generated tray template + app icon
└── scripts/
    └── generate-tray-icons.py
```

## Settings

| Setting | Default | Notes |
|---------|---------|-------|
| API URL | `http://localhost:3001` | Your dashboard API base URL |
| API key | — | `HA_API_KEY` from `.env` |
| User ID | — | From dashboard Settings |
| Refresh interval | 300s | Minimum 60s |
| Streak notifications | on | Notify on streak gains & milestones |
| Idle-day reminder | on | Nudge after 6pm if nothing logged today |

Settings are stored locally via `electron-store` (in the app's userData dir).
