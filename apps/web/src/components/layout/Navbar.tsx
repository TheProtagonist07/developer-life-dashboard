"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { useSWRConfig } from "swr";

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const { mutate } = useSWRConfig();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.sync.all();
      setTimeout(() => {
        mutate(() => true, undefined, { revalidate: true });
        setSyncing(false);
      }, 3000);
    } catch {
      setSyncing(false);
    }
  };

  return (
    <nav className="border-b border-white/10 bg-[#0d1117] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm">
            🧑‍💻
          </div>
          <span className="font-semibold text-white text-sm hidden sm:block">Dev Life</span>
          <span className="text-gray-700 hidden sm:block">/</span>
          <span className="text-gray-400 text-sm hidden sm:block">Dashboard</span>
        </div>

        {/* Right side */}
        {!isLoading && user && (
          <div className="flex items-center gap-3">
            {/* Sync button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50 px-2.5 py-1.5 rounded-lg hover:bg-white/5"
            >
              <svg
                className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing…" : "Sync"}
            </button>

            {/* User */}
            <div className="flex items-center gap-2 group relative cursor-pointer">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-white/10"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-300 hidden sm:block">{user.username}</span>

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/10 bg-[#1c2128] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                <div className="px-3 py-2 border-b border-white/5">
                  <div className="text-xs font-medium text-white">{user.username}</div>
                  <div className="text-xs text-gray-500 truncate">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-colors rounded-b-xl"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
