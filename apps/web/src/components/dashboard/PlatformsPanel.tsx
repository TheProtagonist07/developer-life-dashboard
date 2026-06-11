"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { api } from "../../lib/api";
import { PLATFORM_META } from "../../lib/utils";
import type { PlatformConnection } from "../../types";

const CONNECTABLE = ["leetcode", "codeforces", "hackerrank"] as const;

function PlatformRow({ conn, onAction }: { conn: PlatformConnection; onAction: () => void }) {
  const meta = PLATFORM_META[conn.platform];
  const statusColor = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    running: "text-yellow-400",
    pending: "text-blue-400",
  }[conn.lastSyncStatus?.status ?? ""] ?? "text-gray-500";

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/5">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg">
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200">{meta.label}</div>
        <div className="text-xs text-gray-500 truncate">
          @{conn.username}
          {conn.last_synced_at && (
            <span className="ml-2">· Synced {new Date(conn.last_synced_at).toLocaleDateString()}</span>
          )}
          {conn.lastSyncStatus && (
            <span className={`ml-2 ${statusColor}`}>· {conn.lastSyncStatus.status}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={async () => { await api.sync.platform(conn.platform); onAction(); }}
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          Sync
        </button>
        {conn.platform !== "github" && (
          <button
            onClick={async () => {
              if (!confirm(`Disconnect ${meta.label}?`)) return;
              await api.platforms.disconnect(conn.platform);
              onAction();
            }}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

export function PlatformsPanel() {
  const { mutate } = useSWRConfig();
  const { data: platforms } = useSWR("platforms", api.platforms.list, { revalidateOnFocus: false });

  const [connecting, setConnecting] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  const connected = new Set(platforms?.map((p) => p.platform) ?? []);

  const handleConnect = async (platform: string) => {
    if (!username.trim()) return;
    await api.platforms.connect(platform, username.trim());
    await mutate("platforms");
    setConnecting(null);
    setUsername("");
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Connected Platforms</h2>
        <p className="text-xs text-gray-500">Manage your coding platform integrations</p>
      </div>

      <div className="space-y-2">
        {platforms?.map((conn) => (
          <PlatformRow key={conn.platform} conn={conn} onAction={() => mutate("platforms")} />
        ))}
        {(platforms?.length ?? 0) === 0 && (
          <div className="text-center text-gray-600 py-6 text-sm">No platforms connected</div>
        )}
      </div>

      {/* Connect new */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-400">Add Platform</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {CONNECTABLE.filter((p) => !connected.has(p)).map((platform) => {
            const meta = PLATFORM_META[platform];
            return (
              <div key={platform}>
                {connecting === platform ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      {meta.icon} {meta.label}
                    </div>
                    <input
                      type="text"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConnect(platform)}
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConnecting(null); setUsername(""); }}
                        className="flex-1 text-xs py-1 text-gray-500 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConnect(platform)}
                        className="flex-1 text-xs py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConnecting(platform)}
                    className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 flex items-center gap-2 hover:border-white/20 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-400">{meta.label}</div>
                      <div className="text-xs text-gray-600">Click to connect</div>
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
