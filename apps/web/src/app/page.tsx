"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 text-center">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(to right, #30363d 1px, transparent 1px), linear-gradient(to bottom, #30363d 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Hero */}
      <div className="relative z-10 max-w-2xl space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Self-hosted · Open source
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight">
            Your developer life,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              one dashboard
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            Unify GitHub contributions, LeetCode streaks, Codeforces activity, and study sessions into a single life heatmap.
          </p>
        </div>

        {/* Feature list */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
          {[
            ["🔥", "Streak Tracking"],
            ["🗺", "Life Heatmap"],
            ["🎯", "Goal Progress"],
            ["📊", "Analytics"],
            ["🏆", "Achievements"],
            ["🏠", "Home Assistant"],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <span className="text-lg">{icon}</span>
              <span className="text-sm text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <a
            href={api.auth.loginUrl}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </a>
          <p className="text-xs text-gray-600">
            No email required · Read-only GitHub access · Self-host in minutes
          </p>
        </div>
      </div>
    </div>
  );
}
