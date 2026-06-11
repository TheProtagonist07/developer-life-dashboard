/* global window, document */
const devlife = window.devlife;

const $ = (id) => document.getElementById(id);

const views = {
  status: $("status-view"),
  empty: $("empty-view"),
  settings: $("settings-view"),
};

let currentView = "status";

function showView(name) {
  currentView = name;
  for (const [key, el] of Object.entries(views)) {
    el.classList.toggle("hidden", key !== name);
  }
  // Settings is taller — nudge the window height to fit.
  const heights = { status: 460, empty: 320, settings: 560 };
  devlife.resize(heights[name] ?? 460);
}

function timeAgo(ts) {
  if (!ts) return "never";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const ERROR_MESSAGES = {
  not_configured: { title: "Not connected", text: "Add your API details to get started." },
  unauthorized: { title: "Invalid API key", text: "Check your API key in settings." },
  network_error: { title: "Can't reach server", text: "Is the API running? Check the URL." },
  timeout: { title: "Connection timed out", text: "The server took too long to respond." },
  bad_response: { title: "Unexpected response", text: "Check that the API URL is correct." },
};

function render(payload) {
  const { result, configured } = payload;

  if (!configured) {
    $("empty-title").textContent = "Not connected";
    $("empty-text").textContent = "Add your API details to get started.";
    if (currentView !== "settings") showView("empty");
    return;
  }

  if (!result || !result.ok) {
    const err = (result && ERROR_MESSAGES[result.error]) || {
      title: "Something went wrong",
      text: "Try refreshing.",
    };
    $("empty-title").textContent = err.title;
    $("empty-text").textContent = err.text;
    if (currentView !== "settings") showView("empty");
    return;
  }

  const s = result.status;
  $("overall-streak").textContent = s.overall_streak;
  $("today-count").textContent = s.today_count;
  $("week-days").textContent = `${s.week_active_days}/7`;
  $("coding-streak").textContent = `${s.coding_streak}d`;
  $("dsa-streak").textContent = `${s.dsa_streak}d`;
  $("sync-status").textContent = `Synced ${timeAgo(result.fetchedAt)}`;

  if (currentView !== "settings") showView("status");
}

// ── Settings ────────────────────────────────────────────────────────────────────

async function loadSettings() {
  const s = await devlife.getSettings();
  $("set-apiUrl").value = s.apiUrl ?? "";
  $("set-apiKey").value = s.apiKey ?? "";
  $("set-userId").value = s.userId ?? "";
  $("set-notifyOnStreak").checked = !!s.notifyOnStreak;
  $("set-remindIfIdle").checked = !!s.remindIfIdle;
  $("set-pollIntervalSec").value = s.pollIntervalSec ?? 300;
}

function readSettingsForm() {
  return {
    apiUrl: $("set-apiUrl").value.trim(),
    apiKey: $("set-apiKey").value.trim(),
    userId: $("set-userId").value.trim(),
    notifyOnStreak: $("set-notifyOnStreak").checked,
    remindIfIdle: $("set-remindIfIdle").checked,
    pollIntervalSec: parseInt($("set-pollIntervalSec").value, 10) || 300,
  };
}

function showTestResult(ok, message) {
  const el = $("test-result");
  el.classList.remove("hidden", "ok", "err");
  el.classList.add(ok ? "ok" : "err");
  el.textContent = ok ? "✓ Connected successfully" : `✕ ${message}`;
}

// ── Wiring ──────────────────────────────────────────────────────────────────────

$("refresh-btn").addEventListener("click", async () => {
  const payload = await devlife.refresh();
  render(payload);
});

$("settings-btn").addEventListener("click", async () => {
  if (currentView === "settings") {
    const payload = await devlife.getStatus();
    render(payload);
  } else {
    await loadSettings();
    $("test-result").classList.add("hidden");
    showView("settings");
  }
});

$("empty-settings-btn").addEventListener("click", async () => {
  await loadSettings();
  showView("settings");
});

$("open-dashboard").addEventListener("click", () => devlife.openDashboard());

$("test-btn").addEventListener("click", async () => {
  const { apiUrl, apiKey, userId } = readSettingsForm();
  if (!apiUrl || !apiKey || !userId) {
    showTestResult(false, "Fill in all fields first");
    return;
  }
  $("test-btn").textContent = "Testing…";
  const res = await devlife.testConnection({ apiUrl, apiKey, userId });
  $("test-btn").textContent = "Test connection";
  showTestResult(res.ok, res.error ?? "");
});

$("save-btn").addEventListener("click", async () => {
  const settings = readSettingsForm();
  await devlife.saveSettings(settings);
  const payload = await devlife.getStatus();
  render(payload);
});

$("quit-btn").addEventListener("click", () => devlife.quit());

// Live updates pushed from the main process.
devlife.onStatusUpdate(render);

// Initial paint.
(async () => {
  const payload = await devlife.getStatus();
  render(payload);
})();
