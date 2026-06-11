"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-gray-500 hover:text-emerald-400 transition-colors shrink-0"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [timezone, setTimezone] = useState("UTC");
  const [weekStart, setWeekStart] = useState<"monday" | "sunday">("monday");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  // Local-first preferences; PATCH /users/me backend endpoint lands in the next phase
  useEffect(() => {
    const stored = localStorage.getItem("devlife_prefs");
    if (stored) {
      const prefs = JSON.parse(stored);
      if (prefs.timezone) setTimezone(prefs.timezone);
      if (prefs.weekStart) setWeekStart(prefs.weekStart);
    } else if (user?.timezone) {
      setTimezone(user.timezone);
    }
  }, [user]);

  const savePrefs = () => {
    localStorage.setItem("devlife_prefs", JSON.stringify({ timezone, weekStart }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const haSnippet = `rest:
  - resource: http://your-server:3001/ha/sensors/${user.id}
    headers:
      Authorization: Bearer <your HA_API_KEY>
    scan_interval: 300
    sensor:
      - name: "Coding Streak"
        value_template: "{{ value_json.data.overall_streak }}"
        unit_of_measurement: "days"
      - name: "Today's Activity"
        value_template: "{{ value_json.data.today_count }}"`;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your profile, preferences, and integrations</p>
        </div>

        {/* Profile */}
        <Section title="Profile">
          <div className="flex items-center gap-4">
            {user.avatarUrl && (
              <Image
                src={user.avatarUrl}
                alt={user.username}
                width={56}
                height={56}
                className="rounded-full ring-2 ring-white/10"
              />
            )}
            <div>
              <div className="text-sm font-semibold text-white">{user.displayName ?? user.username}</div>
              <div className="text-xs text-gray-500">@{user.username} · {user.email}</div>
              <div className="text-[10px] text-gray-600 mt-1">
                Profile syncs from GitHub — change it there
              </div>
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-600 mt-1">Used for streak day boundaries</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">Week starts on</label>
              <div className="flex gap-2">
                {(["monday", "sunday"] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setWeekStart(day)}
                    className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                      weekStart === day
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={savePrefs}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            {saved ? "✓ Saved" : "Save Preferences"}
          </button>
          <p className="text-[10px] text-gray-600">
            Stored locally for now — server-side sync ships with the next backend update.
          </p>
        </Section>

        {/* Home Assistant */}
        <Section title="Home Assistant">
          <p className="text-xs text-gray-500">
            Add this to your <code className="text-gray-400 bg-white/5 px-1 rounded">configuration.yaml</code> to
            expose your streaks as sensors:
          </p>
          <div className="relative">
            <pre className="text-[11px] text-gray-400 bg-black/30 border border-white/5 rounded-lg p-3 overflow-x-auto leading-relaxed">
              {haSnippet}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={haSnippet} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Your user ID:</span>
            <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{user.id}</code>
            <CopyButton text={user.id} />
          </div>
        </Section>

        {/* Data */}
        <Section title="Data">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">Export your data</div>
              <div className="text-xs text-gray-600">Download all activities as CSV</div>
            </div>
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-600 text-xs cursor-not-allowed"
              title="Ships with the next backend update"
            >
              Coming soon
            </button>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <div className="text-sm text-red-400">Delete account</div>
              <div className="text-xs text-gray-600">Permanently remove all your data</div>
            </div>
            <button
              disabled
              className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/50 text-xs cursor-not-allowed"
              title="Ships with the next backend update"
            >
              Coming soon
            </button>
          </div>
        </Section>
      </main>
    </>
  );
}
