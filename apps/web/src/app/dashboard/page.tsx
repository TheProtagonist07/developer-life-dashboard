"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { StatsRow } from "../../components/dashboard/StatsRow";
import { ActivityHeatmap } from "../../components/heatmap/ActivityHeatmap";
import { StreakGrid } from "../../components/dashboard/StreakGrid";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { GoalsSection } from "../../components/dashboard/GoalsSection";
import { AnalyticsPanel } from "../../components/dashboard/AnalyticsPanel";
import { LogActivityModal } from "../../components/dashboard/LogActivityModal";
import { PlatformsPanel } from "../../components/dashboard/PlatformsPanel";
import { AchievementsPanel } from "../../components/dashboard/AchievementsPanel";

type Tab = "overview" | "analytics" | "platforms" | "achievements";

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [showLogModal, setShowLogModal] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "platforms", label: "Platforms" },
    { id: "achievements", label: "Achievements" },
  ];

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Log Activity
          </button>
        </div>

        {tab === "overview" && (
          <>
            <StatsRow />

            {/* Heatmap with year selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-end">
                {[year - 1, year].map((y) => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      year === y ? "bg-emerald-600/20 text-emerald-400" : "text-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <ActivityHeatmap year={year} />
            </div>

            <StreakGrid />

            <div className="grid lg:grid-cols-2 gap-6">
              <GoalsSection />
              <ActivityFeed />
            </div>
          </>
        )}

        {tab === "analytics" && <AnalyticsPanel />}
        {tab === "platforms" && <PlatformsPanel />}
        {tab === "achievements" && <AchievementsPanel />}
      </main>

      {showLogModal && <LogActivityModal onClose={() => setShowLogModal(false)} />}
    </>
  );
}
