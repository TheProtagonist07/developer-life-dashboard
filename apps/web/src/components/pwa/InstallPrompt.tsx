"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "devlife_install_dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already installed → never show.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // iOS Safari doesn't fire beforeinstallprompt — detect and show manual hint.
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
    if (iOS && isSafari) {
      setIsIos(true);
      // Delay so it isn't jarring on first paint.
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="rounded-2xl border border-white/10 bg-[#1c2128] shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg shrink-0">
          📲
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">Install Dev Life</div>
          {isIos ? (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Tap <span className="inline-block px-1">⎙</span> Share, then{" "}
              <span className="text-gray-200">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">
              Add to your home screen for quick daily access.
            </p>
          )}
          {!isIos && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={install}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
              >
                Install
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Not now
              </button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-gray-600 hover:text-gray-400 text-lg leading-none shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}
