/**
 * lib/CreatorCard.jsx
 * Unified, responsive Creator Card used in both Find & Saved sections.
 * 
 * Features:
 * - Distinct, colorful avatar icon gradients for every YouTuber (getAvatarGradient).
 * - Displays: Name, Region, Niche, Subscribers with strict '+' sign (e.g. 5k+, 8k+, 120k+).
 * - Direct YouTube Channel link.
 * - NO business email or Instagram ID on the card.
 * - Save It / Saved toggle button.
 * - When `showOutreachActions={true}` (in Saved YouTubers section):
 *    Adds 3 action buttons:
 *    1. "Get Short Message" (personalized DM pitch with Copy button & Tone selector)
 *    2. "Get Email" (personalized cold email with Subject & Body copy buttons)
 *    3. "Refresh" (cycles through 6 high-converting templates with spin animation)
 * - All messages personalized with channel name only (no niche/sub mentions in copy).
 */
import React, { useState } from 'react';
import { fmt, getAvatarGradient } from './data.js';
import { OUTREACH_TEMPLATES, getTemplate } from './outreachTemplates.js';

export default function CreatorCard({
  creator,
  index = 0,
  isPaid = false,
  isSaved = false,
  onToggleSave,
  onNavigate,
  showOutreachActions = false,
}) {
  // Freemium tier rule: index >= 5 is card-locked for free users on Find page
  const isCardLocked = !isPaid && !showOutreachActions && index >= 5;

  // Outreach interactive state (for Saved section)
  const [activeTab, setActiveTab] = useState(null); // null | 'message' | 'email'
  const [templateIndex, setTemplateIndex] = useState(0);
  const [tone, setTone] = useState('professional'); // 'professional' | 'direct' | 'portfolio'
  const [copiedKey, setCopiedKey] = useState(null); // null | 'msg' | 'subject' | 'body' | 'all'
  const [isSpinning, setIsSpinning] = useState(false);

  const handlePlanClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/dashboard/plans');
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#/dashboard/plans';
    }
  };

  const handleToggleTab = (tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
    setCopiedKey(null);
  };

  const handleRefresh = (e) => {
    if (e) e.stopPropagation();
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);
    setTemplateIndex((prev) => (prev + 1) % OUTREACH_TEMPLATES.length);
    setCopiedKey(null);
  };

  const handleCopyText = (text, key) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const avatarGradient = getAvatarGradient(creator, index);

  // LOCKED CARD (6th result onward for free users on Find Page)
  if (isCardLocked) {
    return (
      <div
        className={`rounded-3xl border-2 border-dashed border-[#D8CFC5] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden bg-white/70 hover-lift stagger-${(index % 6) + 1}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}>
              {creator.name.charAt(0)}
            </div>
            <div>
              <div className="h-5 w-28 bg-neutral-200 skeleton-shimmer rounded-md mb-1.5" />
              <div className="h-3.5 w-16 bg-neutral-200/60 skeleton-shimmer rounded" />
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-[#FF3358] font-bold border border-rose-100">
            Locked
          </span>
        </div>

        <div className="my-5 p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] text-center">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-white border border-[#EAE3DB] flex items-center justify-center text-[#FF3358] shadow-xs animate-lock-pulse">
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

  // Current template data for outreach
  const currentTemplate = getTemplate(templateIndex);
  const channelName = creator.name || 'Creator';
  const shortMessageText = currentTemplate?.shortMessage?.[tone]?.(channelName) || '';
  const emailSubjectText = currentTemplate?.email?.subject?.(channelName) || '';
  const emailBodyText = currentTemplate?.email?.[tone]?.(channelName) || '';

  // STANDARD REVEALED CARD (Used in both Find & Saved sections)
  return (
    <div
      className={`rounded-3xl border border-[#EAE3DB] p-5 sm:p-6 bg-white shadow-sm hover:shadow-md hover-lift transition-all duration-200 flex flex-col justify-between stagger-${(index % 6) + 1}`}
    >
      <div>
        {/* Card Header: Avatar with unique color, Name, and Save It Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0`}
            >
              {creator.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-base text-neutral-950 truncate leading-tight">
                  {creator.name}
                </h3>
                {creator.verified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24" title="Verified Creator">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                  </svg>
                )}
              </div>
              <div className="text-xs font-black text-[#FF3358] mt-0.5 tabular-nums">
                {fmt(creator.subs)} Subscribers
              </div>
            </div>
          </div>

          {/* Save It / Saved Button */}
          <button
            type="button"
            onClick={() => onToggleSave && onToggleSave(creator.id)}
            aria-label={isSaved ? `Unsave ${creator.name}` : `Save ${creator.name}`}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#FF3358] shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs ${
              isSaved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-[#EAE3DB] text-neutral-800 hover:border-[#FF3358] hover:text-[#FF3358]'
            }`}
          >
            {isSaved ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-600 bookmark-animate" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>Saved</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 transition-colors duration-200"
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

        {/* Region & Niche Badges (No Email, No Instagram ID) */}
        <div className="flex items-center gap-2 mb-3.5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-[#FAF6F2] border border-[#EAE3DB] text-neutral-900">
            Region: {creator.region || 'India'}
          </span>
          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-50 border border-rose-100 text-[#FF3358]">
            Niche: {creator.niche}
          </span>
        </div>

        {/* Channel URL */}
        <div className="pt-3 border-t border-[#F0EAE3] flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="text-neutral-500 font-bold flex items-center gap-1.5 shrink-0">
            <svg className="w-3.5 h-3.5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Channel:
          </span>
          {creator.link || creator.channel_link ? (
            <a
              href={creator.link || creator.channel_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-900 hover:text-[#FF3358] hover:underline font-bold flex items-center gap-1 max-w-[190px] truncate"
            >
              <span className="truncate">{(creator.link || creator.channel_link).replace(/^https?:\/\/(www\.)?/, '')}</span>
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
              </svg>
            </a>
          ) : (
            <span className="text-neutral-400 font-medium">None</span>
          )}
        </div>
      </div>

      {/* OUTREACH ACTIONS (Rendered in Saved YouTubers section) */}
      {showOutreachActions && (
        <div className="mt-4 pt-3.5 border-t border-[#F0EAE3] space-y-3">
          {/* Active Template Angle Pill */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-extrabold text-neutral-800 truncate">
                Angle {templateIndex + 1}/6: {currentTemplate.title}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#FF3358] bg-rose-50 px-2 py-0.5 rounded-md shrink-0 border border-rose-100">
              {currentTemplate.badge}
            </span>
          </div>

          {/* THE 3 MANDATORY BUTTONS:
              1. Get Short Message
              2. Get Email
              3. Refresh
          */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* BUTTON 1: GET SHORT MESSAGE */}
              <button
                type="button"
                onClick={() => handleToggleTab('message')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                  activeTab === 'message'
                    ? 'bg-[#FF3358] text-white shadow-md ring-2 ring-[#FF3358]/20'
                    : 'bg-rose-50 text-[#FF3358] border border-rose-200 hover:bg-[#FF3358] hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="truncate">{activeTab === 'message' ? 'Hide Message' : 'Get Short Message'}</span>
              </button>

              {/* BUTTON 2: GET EMAIL */}
              <button
                type="button"
                onClick={() => handleToggleTab('email')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                  activeTab === 'email'
                    ? 'bg-neutral-950 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-900 border border-[#EAE3DB] hover:bg-neutral-200'
                }`}
              >
                <svg className="w-3.5 h-3.5 shrink-0 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="truncate">{activeTab === 'email' ? 'Hide Email' : 'Get Email'}</span>
              </button>
            </div>

            {/* BUTTON 3: REFRESH */}
            <button
              type="button"
              onClick={handleRefresh}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold text-neutral-700 bg-white border border-[#EAE3DB] hover:border-neutral-900 hover:text-neutral-950 transition-all duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-2 group"
              title="Switch to next outreach template angle"
            >
              <svg
                className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 transition-transform duration-500 ${isSpinning ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Refresh (Next Angle: {((templateIndex + 1) % 6) + 1}/6)</span>
            </button>
          </div>

          {/* ========================================================
              INLINE SHORT MESSAGE ACCORDION (With Copy & Refresh)
             ======================================================== */}
          {activeTab === 'message' && (
            <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] space-y-3 animate-fadeIn">
              {/* Header & Close */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF3358] flex items-center gap-1">
                  <span>DM Pitch</span>
                  <span className="text-neutral-400 font-medium">({templateIndex + 1}/6)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-900 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tone Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-xl border border-[#EAE3DB] text-[10px] font-extrabold text-center">
                <button
                  type="button"
                  onClick={() => setTone('professional')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'professional' ? 'bg-[#FF3358] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  💼 Pro
                </button>
                <button
                  type="button"
                  onClick={() => setTone('direct')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'direct' ? 'bg-[#FF3358] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  ⚡ Direct
                </button>
                <button
                  type="button"
                  onClick={() => setTone('portfolio')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'portfolio' ? 'bg-[#FF3358] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  🎨 Portfolio
                </button>
              </div>

              {/* Message Content Preview */}
              <div className="p-3 bg-white rounded-xl border border-[#EAE3DB] text-xs font-medium text-neutral-900 leading-relaxed select-all">
                {shortMessageText}
              </div>

              {/* Action Buttons: Copy Message & Refresh */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(shortMessageText, 'msg')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                    copiedKey === 'msg'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {copiedKey === 'msg' ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied! ✓</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy Message</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="py-2 px-3 rounded-xl text-xs font-extrabold bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <svg className={`w-3.5 h-3.5 text-neutral-600 ${isSpinning ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>New Message</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              INLINE EMAIL ACCORDION (With Subject, Body, Copy & Refresh)
             ======================================================== */}
          {activeTab === 'email' && (
            <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] space-y-3 animate-fadeIn">
              {/* Header & Close */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-950 flex items-center gap-1">
                  <span>Cold Email Draft</span>
                  <span className="text-neutral-400 font-medium">({templateIndex + 1}/6)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-900 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Tone Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-white rounded-xl border border-[#EAE3DB] text-[10px] font-extrabold text-center">
                <button
                  type="button"
                  onClick={() => setTone('professional')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'professional' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  💼 Pro
                </button>
                <button
                  type="button"
                  onClick={() => setTone('direct')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'direct' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  ⚡ Direct
                </button>
                <button
                  type="button"
                  onClick={() => setTone('portfolio')}
                  className={`py-1.5 px-1 rounded-lg transition-colors cursor-pointer truncate ${
                    tone === 'portfolio' ? 'bg-neutral-950 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  🎨 Portfolio
                </button>
              </div>

              {/* Subject Line */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-extrabold text-neutral-500 mb-1">
                  <span>SUBJECT:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(emailSubjectText, 'subject')}
                    className="text-[#FF3358] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'subject' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg border border-[#EAE3DB] text-xs font-black text-neutral-950 select-all truncate">
                  {emailSubjectText}
                </div>
              </div>

              {/* Email Body */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-extrabold text-neutral-500 mb-1">
                  <span>BODY:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(emailBodyText, 'body')}
                    className="text-[#FF3358] hover:underline cursor-pointer"
                  >
                    {copiedKey === 'body' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-[#EAE3DB] text-xs font-medium text-neutral-900 leading-relaxed select-all max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {emailBodyText}
                </div>
              </div>

              {/* Action Buttons: Copy Full Email & Refresh */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(`Subject: ${emailSubjectText}\n\n${emailBodyText}`, 'all')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                    copiedKey === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                  }`}
                >
                  {copiedKey === 'all' ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Copied All! ✓</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      <span>Copy Email</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="py-2 px-3 rounded-xl text-xs font-extrabold bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <svg className={`w-3.5 h-3.5 text-neutral-600 ${isSpinning ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span>New Email</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
