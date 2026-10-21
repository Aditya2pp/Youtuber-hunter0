import React, { useState, useEffect } from 'react';

/**
 * HomeScreenShortcutTip
 * Optional, dismissible instruction for mobile Chrome/browser users to add
 * a shortcut with the custom icon to their Android/iOS home screen.
 * Once dismissed, it stores a flag in localStorage so it is never shown again.
 */
export default function HomeScreenShortcutTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const isDismissed = localStorage.getItem('ch_homescreen_shortcut_dismissed');
      if (isDismissed === 'true') return;

      // Only show on mobile devices
      const ua = navigator.userAgent || '';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      if (!isMobile) return;

      // Check if already in standalone display mode
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) return;

      // Wait 3 seconds after page load before showing the gentle tip
      const timer = setTimeout(() => {
        setVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    } catch {
      // Ignore storage errors in private browsing
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('ch_homescreen_shortcut_dismissed', 'true');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Add to home screen tip"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#FF315F]/20 shadow-xl shadow-black/8 text-zinc-900 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="flex items-start gap-3">
        <img
          src="./icon-192.png"
          alt="ClientHunt icon"
          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-200 shadow-xs"
          onError={(e) => {
            // Fallback to icon.png if icon-192 isn't ready
            (e.target as HTMLImageElement).src = './icon.png';
          }}
        />
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Add to Home Screen
            </h4>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss shortcut tip"
              className="text-zinc-400 hover:text-zinc-700 p-0.5 rounded-md hover:bg-zinc-100 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">
            For 1-tap browser access with our icon: tap <strong className="font-semibold text-zinc-800">Chrome menu (⋮)</strong> → <strong className="font-semibold text-zinc-800">Add to Home screen</strong>.
          </p>
          <div className="mt-2 flex items-center justify-end">
            <button
              onClick={handleDismiss}
              className="text-[11px] font-semibold text-[#FF315F] hover:text-[#e02650] px-2.5 py-1 rounded-lg bg-[#FF315F]/10 hover:bg-[#FF315F]/15 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
