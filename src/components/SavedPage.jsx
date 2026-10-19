/**
 * src/components/SavedPage.jsx
 * "Saved YouTubers" dashboard view tailored for THUMBNAIL DESIGNERS.
 * 
 * Features:
 * - Compact Shortlist items (especially optimized for mobile so dozens of channels fit cleanly).
 * - Clicking any channel selects that YouTuber.
 * - Initially hides message and email; only shows [ Short DM ] and [ Cold Email ] buttons.
 * - On clicking [ Short DM ] or [ Cold Email ], expands the pitch with 1-click Copy and Refresh buttons.
 * - Replaces confusing angle labels with clean titles: "Your Professional DM" / "Your Cold Email".
 * - Shows YouTube channel link right inside the selected card.
 * - All templates strictly tailored for Thumbnail Designers (10%+ CTR, mobile feed packaging, free test concepts).
 * - Removed duplicate bottom cards grid for a clean, distraction-free workflow.
 */
import React, { useState, useEffect } from 'react';
import { CREATORS, fmt, getAvatarGradient } from '../../lib/data.js';
import { isPaid, savedIds, toggleSave, subscribeStore, getLiveCreators } from '../../lib/store.js';
import { OUTREACH_TEMPLATES, getTemplate } from '../../lib/outreachTemplates.js';

export default function SavedPage({ onNavigate }) {
  const [userIsPaid, setUserIsPaid] = useState(() => isPaid());
  const [savedList, setSavedList] = useState(() => (Array.isArray(savedIds()) ? savedIds() : []));
  const [creatorsList, setCreatorsList] = useState(CREATORS);

  // Selected YouTuber from Shortlist
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);

  // Active outreach mode: null by default (hidden until user clicks Short DM or Cold Email!)
  const [activeMode, setActiveMode] = useState(null); // null | 'dm' | 'email'

  // Tone selector: 'professional' | 'direct' | 'portfolio'
  const [tone, setTone] = useState('professional');

  // Template Angle index (0 to 5)
  const [templateIdx, setTemplateIdx] = useState(0);

  // Copied feedback key: null | 'msg' | 'subject' | 'body' | 'all'
  const [copiedKey, setCopiedKey] = useState(null);

  // Spin animation state for refresh
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchLive = async () => {
      try {
        const live = await getLiveCreators();
        if (mounted && Array.isArray(live) && live.length > 0) {
          setCreatorsList(live);
        }
      } catch (e) {
        console.warn('SavedPage load creators error:', e);
      }
    };

    const update = () => {
      setUserIsPaid(isPaid());
      setSavedList(Array.isArray(savedIds()) ? savedIds() : []);
      fetchLive();
    };

    update();
    const unsub = subscribeStore(update);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleToggleSave = (id) => {
    const updated = toggleSave(id);
    const nextList = Array.isArray(updated) ? updated : savedIds();
    setSavedList(nextList);
    if (selectedCreatorId === id && nextList.length > 0) {
      setSelectedCreatorId(nextList[0]);
    }
  };

  const safeList = Array.isArray(savedList) ? savedList : [];
  const savedCreators = creatorsList.filter((c) => safeList.includes(c.id));

  // Default active creator: first in shortlist if none explicitly clicked
  const activeCreator =
    savedCreators.find((c) => c.id === selectedCreatorId) ||
    savedCreators[0] ||
    null;

  const currentTemplate = getTemplate(templateIdx);
  const channelName = activeCreator?.name || 'Creator';
  const shortMessageText = currentTemplate?.shortMessage?.[tone]?.(channelName) || '';
  const emailSubjectText = currentTemplate?.email?.subject?.(channelName) || '';
  const emailBodyText = currentTemplate?.email?.[tone]?.(channelName) || '';

  // Select channel from shortlist
  const handleSelectCreator = (creatorId) => {
    setSelectedCreatorId(creatorId);
    // Keep current mode or reset if desired; user can click Short DM / Cold Email to reveal
    setCopiedKey(null);
  };

  // Toggle Short DM
  const handleToggleDM = () => {
    setActiveMode((prev) => (prev === 'dm' ? null : 'dm'));
    setCopiedKey(null);
  };

  // Toggle Cold Email
  const handleToggleEmail = () => {
    setActiveMode((prev) => (prev === 'email' ? null : 'email'));
    setCopiedKey(null);
  };

  // Refresh Angle (cycles through 6 thumbnail design angles)
  const handleRefreshAngle = (e) => {
    if (e) e.stopPropagation();
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);
    setTemplateIdx((prev) => (prev + 1) % OUTREACH_TEMPLATES.length);
    setCopiedKey(null);
  };

  // Clipboard copy helper
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

  // Dynamic header label based on tone
  const getDMTitle = () => {
    if (tone === 'direct') return 'Your Direct Approach DM';
    if (tone === 'portfolio') return 'Your Portfolio Pitch DM';
    return 'Your Professional DM';
  };

  const getEmailTitle = () => {
    if (tone === 'direct') return 'Your Direct Cold Email';
    if (tone === 'portfolio') return 'Your Portfolio Cold Email';
    return 'Your Professional Cold Email';
  };

  const activeChannelUrl =
    activeCreator?.link ||
    activeCreator?.channel_link ||
    (activeCreator ? `https://youtube.com/@${activeCreator.name.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Card: Shortlist title and Find More button */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE3DB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-950">
              Saved YouTubers ({savedCreators.length})
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-50 text-[#FF3358] border border-rose-200">
              Thumbnail Outreach
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Select any shortlisted channel below to review details, then open a Short DM or Cold Email.
          </p>
        </div>

        <button
          onClick={() => onNavigate && onNavigate('/dashboard/find')}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-black border border-[#EAE3DB] bg-[#FAF6F2] hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <svg className="w-3.5 h-3.5 text-[#FF3358]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Find More Creators</span>
        </button>
      </div>

      {/* 2. Empty State (When no YouTubers are saved yet) */}
      {savedCreators.length === 0 ? (
        <div className="p-8 sm:p-14 text-center rounded-2xl sm:rounded-3xl bg-white border border-[#EAE3DB] shadow-xs">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] flex items-center justify-center text-[#FF3358]">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-black text-neutral-950">
            No Saved YouTubers Yet
          </h3>
          <p className="text-xs text-neutral-500 font-medium mt-1 max-w-sm mx-auto leading-relaxed">
            Click &quot;Save It&quot; on any YouTuber in the Find directory. They will appear here immediately ready for thumbnail client pitching!
          </p>
          <div className="mt-5">
            <button
              onClick={() => onNavigate && onNavigate('/dashboard/find')}
              className="py-2.5 px-5 rounded-xl text-xs font-black text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              Browse YouTubers Directory →
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 3. YOUR SHORTLIST: Compact, space-saving channel cards for mobile & desktop */}
          <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE3DB] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                  Your Shortlist ({savedCreators.length} channels):
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-bold">
                Tap channel to pitch
              </span>
            </div>

            {/* Compact Channel Items List (Space-saving on mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {savedCreators.map((c, i) => {
                const isSelected = activeCreator?.id === c.id;
                const grad = getAvatarGradient(c, i);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCreator(c.id)}
                    className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 relative ${
                      isSelected
                        ? 'bg-neutral-950 text-white border-neutral-900 shadow-sm ring-2 ring-[#FF3358]'
                        : 'bg-[#FAF6F2] hover:bg-white text-neutral-900 border-[#EAE3DB] hover:border-neutral-400 shadow-2xs'
                    }`}
                  >
                    {/* Small Colorful Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr ${grad} flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs`}
                    >
                      {c.name.charAt(0)}
                    </div>

                    {/* Name & Subscriber Count */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-xs truncate leading-tight block">
                          {c.name}
                        </span>
                        {c.verified && (
                          <svg className="w-2.5 h-2.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[10px] font-black tabular-nums block ${isSelected ? 'text-[#FF3358]' : 'text-neutral-500'}`}>
                        {fmt(c.subs)}
                      </span>
                    </div>

                    {/* Active check dot */}
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF3358] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SELECTED CREATOR CARD & PITCH GENERATOR */}
          {activeCreator && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE3DB] shadow-sm space-y-4">
              {/* Creator Info Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#F0EAE3]">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr ${getAvatarGradient(activeCreator, 0)} flex items-center justify-center text-white font-black text-base sm:text-lg shadow-xs shrink-0`}
                  >
                    {activeCreator.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-sm sm:text-base text-neutral-950 truncate leading-tight">
                        {activeCreator.name}
                      </h3>
                      {activeCreator.verified && (
                        <svg className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="font-black text-[#FF3358] tabular-nums">
                        {fmt(activeCreator.subs)} Subscribers
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-neutral-600 font-bold">
                        {activeCreator.niche}
                      </span>
                      <span className="text-neutral-300">•</span>
                      <span className="text-neutral-500 font-semibold">
                        {activeCreator.region || 'India'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: YouTube Channel Link & Remove from Shortlist */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {/* YouTube Channel Link */}
                  {activeChannelUrl && (
                    <a
                      href={activeChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#FAF6F2] hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-900 transition-colors"
                      title="Open YouTube Channel in new tab"
                    >
                      <svg className="w-3.5 h-3.5 text-red-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span>Visit Channel</span>
                      <svg className="w-3 h-3 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                      </svg>
                    </a>
                  )}

                  {/* Remove / Unsave Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSave(activeCreator.id)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors text-xs font-bold cursor-pointer"
                    title="Remove from shortlist"
                  >
                    <span>Saved</span>
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS: [ Short DM ] & [ Cold Email ] (Initially message is hidden until clicked!) */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="grid grid-cols-2 gap-2 flex-1 max-w-md">
                    {/* BUTTON 1: SHORT DM */}
                    <button
                      type="button"
                      onClick={handleToggleDM}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        activeMode === 'dm'
                          ? 'bg-[#FF3358] text-white shadow-sm ring-2 ring-[#FF3358]/20'
                          : 'bg-[#FAF6F2] hover:bg-neutral-100 text-neutral-900 border border-[#EAE3DB]'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{activeMode === 'dm' ? 'Hide Short DM' : 'Short DM'}</span>
                    </button>

                    {/* BUTTON 2: COLD EMAIL */}
                    <button
                      type="button"
                      onClick={handleToggleEmail}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                        activeMode === 'email'
                          ? 'bg-neutral-950 text-white shadow-sm ring-2 ring-black/20'
                          : 'bg-[#FAF6F2] hover:bg-neutral-100 text-neutral-900 border border-[#EAE3DB]'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{activeMode === 'email' ? 'Hide Cold Email' : 'Cold Email'}</span>
                    </button>
                  </div>

                  {/* Refresh Button (Available whenever mode is open or directly) */}
                  {activeMode && (
                    <button
                      type="button"
                      onClick={handleRefreshAngle}
                      className="py-2 px-3 rounded-xl text-xs font-black bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                      title="Switch to next thumbnail angle"
                    >
                      <svg
                        className={`w-3.5 h-3.5 text-neutral-700 transition-transform duration-500 ${isSpinning ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M23 4v6h-6" />
                        <path d="M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      <span>Refresh ({templateIdx + 1}/6)</span>
                    </button>
                  )}
                </div>

                {/* Initial Helper (When neither DM nor Email is clicked) */}
                {!activeMode && (
                  <div className="p-3.5 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB] text-center text-xs font-medium text-neutral-500">
                    Click <strong className="text-neutral-900 font-bold">&quot;Short DM&quot;</strong> for Instagram/WhatsApp pitch or <strong className="text-neutral-900 font-bold">&quot;Cold Email&quot;</strong> to view and copy your custom thumbnail pitch for <span className="text-[#FF3358] font-bold">{activeCreator.name}</span>.
                  </div>
                )}

                {/* ========================================================
                    EXPANDED SHORT DM VIEW (Reveals only on click!)
                   ======================================================== */}
                {activeMode === 'dm' && (
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] space-y-3 animate-fadeIn">
                    {/* Header: Clean title "Your Professional DM" & Tone Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#EAE3DB]">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-neutral-950 block">
                          {getDMTitle()}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Personalized for {activeCreator.name} • Angle {templateIdx + 1} of 6
                        </span>
                      </div>

                      {/* Tone Pills */}
                      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#EAE3DB] text-[10px] font-extrabold">
                        <button
                          type="button"
                          onClick={() => setTone('professional')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'professional' ? 'bg-[#FF3358] text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          💼 Pro
                        </button>
                        <button
                          type="button"
                          onClick={() => setTone('direct')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'direct' ? 'bg-[#FF3358] text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          ⚡ Direct
                        </button>
                        <button
                          type="button"
                          onClick={() => setTone('portfolio')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'portfolio' ? 'bg-[#FF3358] text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          🎨 Portfolio
                        </button>
                      </div>
                    </div>

                    {/* Message Text Preview Box */}
                    <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#EAE3DB] text-xs sm:text-sm font-medium text-neutral-950 leading-relaxed select-all whitespace-pre-wrap shadow-2xs">
                      {shortMessageText}
                    </div>

                    {/* Bottom Action Buttons: Copy Message & Refresh */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      <span className="text-[11px] text-neutral-400 font-semibold">
                        ~{shortMessageText.split(/\s+/).length} words • Optimized for Instagram, WhatsApp & X
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Copy Message Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(shortMessageText, 'msg')}
                          className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                            copiedKey === 'msg'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#FF3358] hover:bg-[#FF1F48] text-white'
                          }`}
                        >
                          {copiedKey === 'msg' ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Copied Message! ✓</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Copy Message</span>
                            </>
                          )}
                        </button>

                        {/* Refresh Next Message */}
                        <button
                          type="button"
                          onClick={handleRefreshAngle}
                          className="py-2.5 px-3.5 rounded-xl text-xs font-black bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                  </div>
                )}

                {/* ========================================================
                    EXPANDED COLD EMAIL VIEW (Reveals only on click!)
                   ======================================================== */}
                {activeMode === 'email' && (
                  <div className="p-3.5 sm:p-5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] space-y-3 animate-fadeIn">
                    {/* Header: Clean title "Your Professional Cold Email" & Tone Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#EAE3DB]">
                      <div>
                        <span className="text-xs sm:text-sm font-black text-neutral-950 block">
                          {getEmailTitle()}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Subject Line + Body for {activeCreator.name} • Angle {templateIdx + 1} of 6
                        </span>
                      </div>

                      {/* Tone Pills */}
                      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#EAE3DB] text-[10px] font-extrabold">
                        <button
                          type="button"
                          onClick={() => setTone('professional')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'professional' ? 'bg-neutral-950 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          💼 Pro
                        </button>
                        <button
                          type="button"
                          onClick={() => setTone('direct')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'direct' ? 'bg-neutral-950 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          ⚡ Direct
                        </button>
                        <button
                          type="button"
                          onClick={() => setTone('portfolio')}
                          className={`py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                            tone === 'portfolio' ? 'bg-neutral-950 text-white shadow-2xs' : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          🎨 Portfolio
                        </button>
                      </div>
                    </div>

                    {/* Subject Line */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-neutral-600 mb-1">
                        <span>SUBJECT LINE:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(emailSubjectText, 'subject')}
                          className="text-[#FF3358] hover:underline cursor-pointer"
                        >
                          {copiedKey === 'subject' ? '✓ Copied' : 'Copy Subject'}
                        </button>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-[#EAE3DB] text-xs font-black text-neutral-950 select-all shadow-2xs">
                        {emailSubjectText}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-neutral-600 mb-1">
                        <span>EMAIL BODY:</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(emailBodyText, 'body')}
                          className="text-[#FF3358] hover:underline cursor-pointer"
                        >
                          {copiedKey === 'body' ? '✓ Copied' : 'Copy Body'}
                        </button>
                      </div>
                      <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#EAE3DB] text-xs sm:text-sm font-medium text-neutral-950 leading-relaxed select-all max-h-52 overflow-y-auto whitespace-pre-wrap shadow-2xs">
                        {emailBodyText}
                      </div>
                    </div>

                    {/* Bottom Action Buttons: Copy Entire Email & Refresh */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                      <a
                        href={`mailto:?subject=${encodeURIComponent(emailSubjectText)}&body=${encodeURIComponent(emailBodyText)}`}
                        className="py-2 px-3 rounded-xl text-xs font-extrabold text-[#FF3358] bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        <span>Open in Mail App</span>
                      </a>

                      <div className="flex items-center gap-2">
                        {/* Copy Entire Email */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(`Subject: ${emailSubjectText}\n\n${emailBodyText}`, 'all')}
                          className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
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
                              <span>Copied Entire Email! ✓</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Copy Full Email</span>
                            </>
                          )}
                        </button>

                        {/* Refresh Next Email */}
                        <button
                          type="button"
                          onClick={handleRefreshAngle}
                          className="py-2.5 px-3.5 rounded-xl text-xs font-black bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-800 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
