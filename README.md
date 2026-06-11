# 🧑‍💻 Developer Life Dashboard

> One dashboard for your entire developer life — GitHub commits, LeetCode grinds, Codeforces battles, study sessions, and project work, unified into a single **Life Heatmap**.

Self-hosted, privacy-first, and built for developers who want to see all their progress in one place instead of five different profile pages.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺 **Unified Life Heatmap** | GitHub-style contribution grid aggregating all platforms, filterable per platform |
| 🔥 **Streak Tracking** | Separate streaks for coding, DSA, learning, projects + overall consistency |
| 🎯 **Goal Tracking** | LeetCode targets, commit goals, study milestones with progress bars and deadlines |
| 📋 **Activity Feed** | Timeline of everything you accomplished, across all platforms |
| 📊 **Analytics** | Weekly score charts, monthly consistency, best days, all-time totals |
| 🏆 **Achievements** | Badges for milestones — streaks, problem counts, multi-platform days |
| 📝 **Manual Logging** | Log study sessions, project work, articles, and courses with duration + notes |
| 🏠 **Home Assistant** | REST sensor endpoints for streaks and daily progress on your HA dashboard |

### Supported Platforms

- **GitHub** — contributions + merged PRs via GraphQL API (OAuth)
- **LeetCode** — daily solve counts via the public GraphQL endpoint
- **Codeforces** — accepted submissions via the official REST API, scored by problem rating
- **HackerRank** — solved challenges via the public profile API
- **Manual** — anything else worth tracking

---

## 🏗 Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│ Next.js Web │  │ Mobile Web  │  │ Home Assistant  │
└──────┬──────┘  └──────┬──────┘  └────────┬────────┘
       └────────────────┼───────────────────┘
                        ▼
              ┌───────────────────┐
              │  Express API      │  JWT auth · rate limiting · Zod
              │  (Node.js + TS)   │
              └─────────┬─────────┘
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐  ┌────────────┐
   │ Postgres │   │  Redis   │  │  BullMQ    │ ← scheduled platform syncs
   └──────────┘   └──────────┘  └─────┬──────┘
                                      ▼
                  GitHub · LeetCode · Codeforces · HackerRank
```

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Recharts · SWR · Express · PostgreSQL · Redis · BullMQ · Docker

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 20
- Docker + Docker Compose
- A [GitHub OAuth App](https://github.com/settings/applications/new)
  (callback URL: `http://localhost:3001/auth/github/callback`)

### Setup

```bash
# 1. Clone
git clone https://github.com/TheProtagonist07/developer-life-dashboard.git
cd developer-life-dashboard

# 2. Configure
cp .env.example .env
# Fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, JWT_SECRET

# 3. Start databases
docker compose up -d postgres redis

# 4. Install + run the API
cd apps/api && npm install && npm run dev    # → http://localhost:3001

# 5. Install + run the web app (new terminal)
cd apps/web && npm install && npm run dev    # → http://localhost:3000
```

Open **http://localhost:3000**, sign in with GitHub, and connect your platforms from the **Platforms** tab.

### Full Docker deployment

```bash
cp .env.example .env   # configure first
docker compose up -d   # runs postgres, redis, api, and web
```

---

## 📁 Project Structure

```
developer-life-dashboard/
├── apps/
│   ├── api/                  # Express + TypeScript backend
│   │   └── src/
│   │       ├── db/           # PostgreSQL schema + query helpers
│   │       ├── integrations/ # GitHub, LeetCode, Codeforces, HackerRank fetchers
│   │       ├── middleware/   # JWT auth, error handling
│   │       ├── routes/       # REST endpoints
│   │       ├── services/     # Streak engine, achievements, analytics
│   │       └── workers/      # BullMQ sync queue + worker
│   └── web/                  # Next.js 14 frontend
│       └── src/
│           ├── app/          # App router pages
│           ├── components/   # Heatmap, streaks, goals, feed, analytics
│           ├── hooks/        # useAuth
│           └── lib/          # API client, utils
├── docker-compose.yml
└── .env.example
```

---

## 🔌 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/github` | Start GitHub OAuth |
| `GET` | `/auth/me` | Current user |
| `GET` | `/activities/heatmap?year=` | Heatmap data |
| `GET` | `/activities/feed` | Paginated activity feed |
| `POST` | `/activities/manual` | Log manual activity |
| `GET` | `/streaks` | All streak types |
| `GET/POST/PUT/DELETE` | `/goals` | Goal CRUD |
| `GET` | `/analytics/weekly` · `/monthly` · `/totals` | Stats |
| `POST` | `/platforms/connect` | Connect a coding platform |
| `POST` | `/sync/trigger` | Manual sync |
| `GET` | `/achievements` | Earned badges |
| `GET` | `/ha/sensors/:userId` | Home Assistant sensors (API-key auth) |

### Home Assistant Integration

```yaml
# configuration.yaml
rest:
  - resource: http://your-server:3001/ha/sensors/<your-user-id>
    headers:
      Authorization: Bearer <HA_API_KEY>
    scan_interval: 300
    sensor:
      - name: "Coding Streak"
        value_template: "{{ value_json.data.overall_streak }}"
        unit_of_measurement: "days"
      - name: "Today's Activity"
        value_template: "{{ value_json.data.today_count }}"
```

---

## 🗺 Roadmap

- [x] **Phase 1 — MVP**: Auth, GitHub + LeetCode sync, heatmap, streaks, goals
- [x] **Phase 2 — Platforms**: Codeforces, HackerRank, manual logging, activity feed
- [x] **Phase 3 — Intelligence**: Achievements, analytics charts
- [ ] **Phase 4 — Native**: macOS menu bar app (Electron), macOS widget
- [ ] **Phase 5 — Polish**: PWA offline support, push notifications, public profiles, CSV export

---

## 📄 License

[MIT](LICENSE) © 2026 Shivam Chaurasia
