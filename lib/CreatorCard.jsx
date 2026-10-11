/**
 * lib/CreatorCard.jsx
 * Clean, focused Creator Card displaying ONLY:
 * - Name (Naam)
 * - Region (India / International)
 * - Subscribers
 * - Niche (Nich)
 * - Channel URL
 * - Instagram ID
 * - Business Email (Business Email)
 * - Save it button
 * No descriptions or extra words.
 */
import React, { useState } from 'react';
import { fmt } from './data.js';

export default function CreatorCard({
  creator,
  index = 0,
  isPaid = false,
  isSaved = false,
  onToggleSave,
  onNavigate,
}) {
  const [copied, setCopied] = useState(false);

  // Freemium tier rule: index >= 5 is card-locked for free users
  const isCardLocked = !isPaid && index >= 5;
  // Free users have email locked even in first 5 results
  const isEmailLocked = !isPaid;

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (!creator.email) return;
    navigator.clipboard?.writeText(creator.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlanClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/dashboard/plans');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/plans';
    }
  };

  // LOCKED CARD (6th result onward for free users)
  if (isCardLocked) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-[#D8CFC5] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden bg-white/70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400 font-extrabold text-lg">
              {creator.name.charAt(0)}
            </div>
            <div>
              <div className="h-5 w-28 bg-neutral-200 rounded-md mb-1.5" />
              <div className="h-3.5 w-16 bg-neutral-200/60 rounded" />
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-[#FF3358] font-bold border border-rose-100">
            Locked
          </span>
        </div>

        <div className="my-5 p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] text-center">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white border border-[#EAE3DB] flex items-center justify-center text-[#FF3358] shadow-xs">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h4 className="text-sm font-extrabold text-neutral-900">
            Creator Profile Locked
          </h4>
          <p className="text-xs text-neutral-500 font-medium mt-1">
            Free accounts view the first 5 channels. Upgrade to reveal all 1000+ creators.
          </p>
        </div>

        <button
          onClick={handlePlanClick}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Unlock from ₹30</span>
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    );
  }

  // STANDARD REVEALED CARD (ONLY Name, Region, Subscribers, Niche, Channel URL, Instagram ID, Business Email)
  return (
    <div className="rounded-3xl border border-[#EAE3DB] p-5 sm:p-6 bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Card Header: Avatar, Name, and Save It Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${creator.avatarColor || 'from-neutral-800 to-neutral-950'} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}
            >
              {creator.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-neutral-950 truncate leading-tight">
                  {creator.name}
                </h3>
                {creator.verified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </div>
              <div className="text-xs font-bold text-[#FF3358] mt-0.5 tabular-nums">
                {fmt(creator.subs)} Subscribers
              </div>
            </div>
          </div>

          {/* Save It Button */}
          <button
            type="button"
            onClick={() => onToggleSave && onToggleSave(creator.id)}
            aria-label={isSaved ? `Unsave ${creator.name}` : `Save ${creator.name}`}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all focus-visible:outline-2 focus-visible:outline-[#FF3358] shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isSaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-[#EAE3DB] text-neutral-800 hover:border-[#FF3358] hover:text-[#FF3358]'
            }`}
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Saved ✓</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Save It</span>
              </>
            )}
          </button>
        </div>

        {/* Region & Niche Badges */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#FAF6F2] border border-[#EAE3DB] text-neutral-900">
            Region: {creator.region || 'India'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 border border-rose-100 text-[#FF3358]">
            Niche: {creator.niche}
          </span>
        </div>

        {/* Details: Channel URL & Instagram ID */}
        <div className="space-y-2.5 py-3 border-t border-[#F0EAE3] text-xs font-semibold">
          {/* Channel URL */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 font-bold flex items-center gap-1.5 shrink-0">
              <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Channel URL:
            </span>
            <a
              href={creator.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900 hover:text-[#FF3358] hover:underline font-bold flex items-center gap-1 max-w-[190px] truncate"
            >
              <span className="truncate">{creator.link.replace('https://', '')}</span>
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
              </svg>
            </a>
          </div>

          {/* Instagram ID */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-neutral-500 font-bold flex items-center gap-1.5 shrink-0">
              <svg className="w-3.5 h-3.5 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
              Instagram ID:
            </span>
            <a
              href={creator.insta}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900 hover:text-[#FF3358] hover:underline font-bold flex items-center gap-1 max-w-[190px] truncate"
            >
              <span className="truncate">{creator.insta.replace('https://instagram.com/', '@')}</span>
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Business Email (Bussnaise Email) */}
      <div className="mt-3 pt-3 border-t border-[#F0EAE3] flex items-center justify-between gap-2 text-xs">
        <span className="text-neutral-700 font-bold flex items-center gap-1 shrink-0">
          <svg className="w-3.5 h-3.5 text-[#FF3358]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Business Email:
        </span>

        {isEmailLocked ? (
          <a
            href="/dashboard/plans"
            onClick={handlePlanClick}
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#FF3358] bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 hover:bg-rose-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358]"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Locked. Get a plan</span>
          </a>
        ) : (
          <div className="flex items-center gap-1.5 max-w-[200px] truncate">
            <a
              href={`mailto:${creator.email}`}
              className="text-[#0D0A10] hover:text-[#FF3358] hover:underline font-mono truncate font-extrabold text-xs"
              title={creator.email}
            >
              {creator.email}
            </a>
            <button
              type="button"
              onClick={handleCopyEmail}
              aria-label="Copy Business Email"
              className="p-1 text-neutral-400 hover:text-neutral-900 rounded transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] cursor-pointer"
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
