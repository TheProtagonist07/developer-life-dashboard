"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../../components/layout/Navbar";
import { MobileNav } from "../../components/layout/MobileNav";
import { StatsRow } from "../../components/dashboard/StatsRow";
import { ActivityHeatmap } from "../../components/heatmap/ActivityHeatmap";
import { StreakGrid } from "../../components/dashboard/StreakGrid";
import { ActivityFeed } from "../../components/dashboard/ActivityFeed";
import { GoalsSection } from "../../components/dashboard/GoalsSection";
import { AnalyticsPanel } from "../../components/dashboard/AnalyticsPanel";
import { LogActivityModal } from "../../components/dashboard/LogActivityModal";
import { PlatformsPanel } from "../../components/dashboard/PlatformsPanel";
import { AchievementsPanel } from "../../components/dashboard/AchievementsPanel";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { InstallPrompt } from "../../components/pwa/InstallPrompt";

type Tab = "overview" | "reports" | "analytics" | "platforms" | "achievements";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "analytics", label: "Analytics" },
  { id: "platforms", label: "Platforms" },
  { id: "achievements", label: "Achievements" },
];

function DashboardContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLogModal, setShowLogModal] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  const tab = (searchParams.get("tab") as Tab) ?? "overview";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  // Manifest shortcut: /dashboard?action=log opens the log modal directly.
  useEffect(() => {
    if (searchParams.get("action") === "log") {
      setShowLogModal(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 sm:pb-6">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Desktop tabs — horizontally scrollable, hidden on mobile (bottom nav instead) */}
          <div className="hidden sm:flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile: current tab title */}
          <h1 className="sm:hidden text-lg font-semibold text-white capitalize">
            {TABS.find((t) => t.id === tab)?.label ?? "Overview"}
          </h1>

          <button
            onClick={() => setShowLogModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Log Activity
          </button>
        </div>

        {tab === "overview" && (
          <>
            <StatsRow />

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

        {tab === "reports" && <ReportsPanel />}
        {tab === "analytics" && <AnalyticsPanel />}
        {tab === "platforms" && <PlatformsPanel />}
        {tab === "achievements" && <AchievementsPanel />}
      </main>

      <MobileNav onLogActivity={() => setShowLogModal(true)} />
      <InstallPrompt />

      {showLogModal && <LogActivityModal onClose={() => setShowLogModal(false)} />}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
