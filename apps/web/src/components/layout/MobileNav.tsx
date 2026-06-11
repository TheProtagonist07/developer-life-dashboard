"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  onLogActivity: () => void;
}

const TABS = [
  { id: "overview", label: "Home", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { id: "reports", label: "Reports", icon: "M9 17v-6M12 17V7M15 17v-3M4 4v16h16" },
  { id: "analytics", label: "Stats", icon: "M4 19V5m0 14h16M8 15l3-4 3 2 4-6" },
  { id: "achievements", label: "Badges", icon: "M12 15a5 5 0 100-10 5 5 0 000 10zM8 13l-2 8 6-3 6 3-2-8" },
];

export function MobileNav({ onLogActivity }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("tab") ?? "overview";

  const go = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d1117]/95 backdrop-blur border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 relative">
        {TABS.slice(0, 2).map((tab) => (
          <NavButton key={tab.id} {...tab} active={active === tab.id} onClick={() => go(tab.id)} />
        ))}

        {/* Center FAB — Log Activity */}
        <button
          onClick={onLogActivity}
          aria-label="Log activity"
          className="relative -top-4 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0"
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {TABS.slice(2).map((tab) => (
          <NavButton key={tab.id} {...tab} active={active === tab.id} onClick={() => go(tab.id)} />
        ))}
      </div>
    </nav>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
        active ? "text-emerald-400" : "text-gray-500"
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
