/**
 * lib/Loader.jsx
 * Full-screen smooth onboarding loader shown after successful login or signup.
 * Features spinning coral/gradient ring, progress bar, and "Opening your dashboard" text.
 */
import React, { useEffect, useState } from 'react';

export default function Loader({ onComplete, text = 'Opening your dashboard' }) {
  const [progress, setProgress] = useState(15);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(45), 300);
    const timer2 = setTimeout(() => setProgress(85), 700);
    const timer3 = setTimeout(() => setProgress(100), 1200);

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1400);

    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#FAF6F2] transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center max-w-sm w-full text-center">
        {/* Spinning Gradient Ring */}
        <div className="relative w-24 h-24 mb-7 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              border: '3px solid transparent',
              borderTopColor: '#FF3358',
              borderRightColor: '#E62E7A',
              borderBottomColor: '#6B30FF',
              animationDuration: '1.1s',
            }}
          />
          <div className="absolute inset-2 rounded-full border-2 border-neutral-200" />
          
          {/* Center Brand Icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] flex items-center justify-center shadow-lg text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="2" width="20" height="20" rx="6" />
              <circle cx="12" cy="12" r="4.5" fill="#FAF6F2" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl font-black text-neutral-950 tracking-tight mb-1.5">
          {text}
        </h2>
        <p className="text-xs text-neutral-500 font-medium mb-6">
          Synchronizing creator directory & client hunting opportunities…
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAE3DB] rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6B30FF 0%, #E62E7A 50%, #FF3358 100%)',
            }}
          />
        </div>
        <span className="sr-only">Loading, please wait</span>
      </div>
    </div>
  );
}
