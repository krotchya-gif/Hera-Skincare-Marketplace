"use client";

// T-90: Banner install aplikasi PWA — frekuensi terkendali (localStorage):
//   - Chrome/Edge/Android: tangkap beforeinstallprompt → tombol Install
//     memanggil prompt() native; dismiss/X → muncul lagi setelah TTL 1 hari
//   - iOS: tanpa beforeinstallprompt → banner petunjuk Add to Home Screen
//   - appinstalled / sudah standalone → banner tidak pernah tampil
// Prompt native browser (mini-infobar) dibiarkan apa adanya.

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const LS_KEY = "pwa-install-dismissed";
const DISMISS_TTL = 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"chrome" | "ios" | null>(() => {
    if (typeof window === "undefined") return null;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return null;
    const dismissed = Number(localStorage.getItem(LS_KEY) || 0);
    if (dismissed && Date.now() - dismissed < DISMISS_TTL) return null;
    if ("onbeforeinstallprompt" in window) return null;
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : null;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("onbeforeinstallprompt" in window)) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("chrome");
    };
    const onInstalled = () => {
      localStorage.removeItem(LS_KEY);
      setMode(null);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice.catch(() => null);
    setMode(null);
    if (!choice || choice.outcome !== "accepted") {
      localStorage.setItem(LS_KEY, String(Date.now()));
    }
  };

  const dismiss = () => {
    localStorage.setItem(LS_KEY, String(Date.now()));
    setMode(null);
  };

  if (!mode) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-3 animate-fade-in-up">
        <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-900/30">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {mode === "chrome" ? (
            <>
              <p className="text-sm font-semibold text-gray-900">Install Aplikasi Hera</p>
              <p className="text-xs text-gray-500">Akses lebih cepat dari layar utama.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-900">Pasang Hera di Layar Utama</p>
              <p className="text-xs text-gray-500">Tap ikon Share → Add to Home Screen.</p>
            </>
          )}
        </div>
        {mode === "chrome" && (
          <button
            onClick={install}
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="shrink-0 w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}