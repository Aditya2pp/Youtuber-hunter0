/**
 * src/components/LandingPage.jsx
 * Redesigned YouTuber Finder & Client Hunting Landing Page.
 * Styled after the primary visual design reference with warm off-white canvas,
 * purple->pink->orange headline, red/pink 2.5D CTA button, hand-drawn sketch annotations,
 * and the 3-step interactive floating discovery workflow.
 */
import React, { useState, useEffect } from 'react';
import { me } from '../../lib/store.js';
import { PLANS } from '../../lib/data.js';

export default function LandingPage({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  // Interactive search state for the hero card
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('TechWithSam');

  useEffect(() => {
    setCurrentUser(me());
  }, []);

  const handleNavClick = (path, e) => {
    if (path.startsWith('#')) {
      setMobileNavOpen(false);
      return;
    }
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    setMobileNavOpen(false);
  };

  const navLinks = [
    { label: 'How it works', href: '#how' },
    { label: 'Use cases', href: '#use' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'User & Privacy Policy', href: '#policy' },
    { label: 'FAQ', href: '#faq' },
  ];

  const faqs = [
    {
      q: 'How does YouTuber Finder help me get clients?',
      a: 'We curate thousands of active YouTube creators with verified business emails and Instagram handles. You can filter by niche, subscriber count, and content category to pitch your video editing, thumbnail design, or brand sponsorship services directly.',
    },
    {
      q: 'How does the free trial work?',
      a: 'Every new account gets instant access to search our directory and view the first 5 channel profiles for free. You can upgrade anytime from just ₹30 for 30 days to unlock verified direct emails across all 10,000+ creators.',
    },
    {
      q: 'Are the contact emails verified?',
      a: 'Yes. We extract and verify official business inquiry inboxes from channel descriptions, verified social links, and agency representations to ensure minimal bounce rates.',
    },
    {
      q: 'Can thumbnail designers and video editors use this?',
      a: 'Absolutely! Our users include freelance video editors, thumbnail designers, thumbnail CTR specialists, and marketing agencies hunting for high-ticket creator retainers.',
    },
    {
      q: 'How do I pay with UPI?',
      a: 'Select the 30 Days plan (₹199 cut to just ₹30) and scan the instant UPI QR code or click "PAY BY ANY UPI APP" directly on your device. Upload your payment screenshot and click Payment Complete to activate your plan.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF6F2] text-[#0D0A10] font-sans antialiased selection:bg-rose-200">
      {/* MOBILE SLIDE-IN DRAWER */}
      {mobileNavOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setMobileNavOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-[#FAF6F2] p-6 flex flex-col justify-between shadow-2xl border-l border-[#EAE3DB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#EAE3DB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[14px] bg-[#0A0A0A] text-white flex items-center justify-center font-bold shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="5" />
                      <circle cx="12" cy="12" r="4" fill="#FAF6F2" />
                    </svg>
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-neutral-900">
                    YouTuber Finder
                  </span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="py-6 space-y-3.5">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="block text-base font-semibold text-neutral-800 hover:text-[#FF3358] py-1 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#EAE3DB] space-y-3">
              {currentUser ? (
                <button
                  onClick={(e) => handleNavClick('/dashboard/find', e)}
                  className="w-full btn-25d py-3 text-center text-sm"
                >
                  Open Dashboard →
                </button>
              ) : (
                <>
                  <button
                    onClick={(e) => handleNavClick('/login', e)}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#D8CFC5] bg-white text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={(e) => handleNavClick('/signup', e)}
                    className="w-full btn-25d py-2.5 text-center text-xs"
                  >
                    Sign Up →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVBAR (Clean, minimal, lots of whitespace) */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-8 py-5 sm:py-7 flex items-center justify-between">
        {/* Brand Logo Squircle */}
        <a
          href="/"
          className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[#FF3358] rounded-2xl"
          aria-label="YouTuber Finder Homepage"
        >
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[16px] bg-[#0A0A0A] flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="2" width="20" height="20" rx="6" />
              <circle cx="12" cy="12" r="4.5" fill="#FAF6F2" />
            </svg>
          </div>
        </a>

        {/* Center Links (Clean & bold) */}
        <div className="hidden min-[900px]:flex items-center gap-8 lg:gap-10 text-sm font-semibold text-neutral-800">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-black transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] rounded px-1"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: Round arrow circle / profile icon */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <a
              href="/dashboard/settings"
              onClick={(e) => handleNavClick('/dashboard/settings', e)}
              title={`Workspace of @${currentUser.username}`}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#E0D8CE] bg-white flex items-center justify-center text-neutral-800 hover:border-neutral-900 shadow-xs transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#FF3358]"
            >
              <span className="font-bold text-xs uppercase bg-neutral-900 text-white w-8 h-8 rounded-full flex items-center justify-center">
                {currentUser.username.charAt(0)}
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-2.5">
              <a
                href="/login"
                onClick={(e) => handleNavClick('/login', e)}
                className="hidden sm:inline-block px-4 py-2 text-xs font-bold text-neutral-700 hover:text-black transition-colors"
              >
                Log In
              </a>
              <a
                href="/signup"
                onClick={(e) => handleNavClick('/signup', e)}
                title="Get Started"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#D8CFC5] bg-white flex items-center justify-center text-neutral-900 hover:border-black shadow-xs hover:shadow-sm transition-all hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#FF3358]"
                aria-label="Sign Up Arrow"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="min-[900px]:hidden w-11 h-11 rounded-full border border-[#D8CFC5] bg-white flex items-center justify-center text-neutral-800 hover:bg-neutral-50 shadow-xs"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* MAIN HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* HERO LEFT COLUMN */}
          <div className="lg:col-span-6 space-y-6">
            {/* Headline with Purple->Pink->Orange gradient + Red sketch sunburst & underline */}
            <div className="relative">
              <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-extrabold tracking-[-0.04em] leading-[1.04]">
                <span className="relative inline-block">
                  <span className="text-gradient-hero">Approach Them</span>
                  
                  {/* Top-right hand-drawn sketch burst rays */}
                  <svg
                    className="absolute -top-3 -right-10 w-9 h-9 text-[#FF3358] pointer-events-none animate-pulse-glow"
                    viewBox="0 0 36 36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="18" x2="2" y2="12" />
                    <line x1="16" y1="12" x2="10" y2="2" />
                    <line x1="22" y1="14" x2="24" y2="3" />
                  </svg>
                </span>
                <br />
                <span className="relative inline-block text-neutral-950 font-black">
                  Who Need's You
                  
                  {/* Hand-drawn red scribble underline */}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-4 text-[#FF3358] overflow-visible pointer-events-none"
                    viewBox="0 0 320 18"
                    fill="none"
                  >
                    <path
                      d="M 4 12 C 55 6, 175 4, 314 11 C 240 16, 120 14, 25 15"
                      stroke="#FF3358"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Sub-headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 mt-5 tracking-tight">
                YouTubers Finder Tool
              </h2>
            </div>

            {/* Short professional description */}
            <p className="text-base sm:text-lg text-neutral-600 font-medium max-w-xl leading-relaxed pt-1">
              Find the right YouTubers, reach out, and grow your business with ease. Our tool helps video editors, thumbnail designers, and agencies discover active creators who are looking for sponsorships, collaborations, and client work.
            </p>

            {/* CTA BUTTON WITH 2.5D DEPTH */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={currentUser ? '/dashboard/find' : '/signup'}
                onClick={(e) => handleNavClick(currentUser ? '/dashboard/find' : '/signup', e)}
                className="btn-25d py-3.5 px-8 sm:px-9 text-base sm:text-lg inline-flex items-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-neutral-900"
              >
                <span>{currentUser ? 'Open Dashboard →' : 'Sign Up →'}</span>
              </a>

              {/* Secondary Contact Us Button */}
              <a
                href="mailto:support@youtuberfinder.com?subject=Inquiry%20from%20YouTuber%20Finder"
                className="py-3.5 px-6 rounded-2xl border border-[#D8CFC5] bg-white/70 hover:bg-white text-neutral-800 font-bold text-sm sm:text-base transition-colors focus-visible:outline-2 focus-visible:outline-neutral-900 shadow-xs"
              >
                Contact us
              </a>
            </div>

            {/* BENEFIT TEXT UNDER CTA (3 statements with small clean icons) */}
            <div className="pt-4 flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm font-bold text-neutral-800">
              {/* 1000+ YouTubers List */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#FF3358]/10 text-[#FF3358] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <span>1000+ YouTubers List</span>
              </div>

              {/* Free Trial Available */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#FF3358]/10 text-[#FF3358] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                </div>
                <span>Free Trial Available</span>
              </div>

              {/* Affordable Plans */}
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#FF3358]/10 text-[#FF3358] flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <span>Affordable Plans</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT COLUMN (INTERACTIVE SAAS CLIENT-HUNTING WORKFLOW CARDS) */}
          <div className="lg:col-span-6 relative flex justify-center py-4 select-none">
            
            {/* The Outer Canvas Container */}
            <div className="relative w-full max-w-[560px] min-h-[510px]">

              {/* ========================================================
                  CARD 1: SEARCH YOUTUBERS CARD (Center-Left)
                 ======================================================== */}
              <div
                className="absolute top-2 left-0 sm:left-2 w-[280px] sm:w-[300px] bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-[#EAE3DB] z-20 animate-float-3"
              >
                <h3 className="font-extrabold text-base text-neutral-900 mb-3">
                  Find YouTubers
                </h3>

                {/* Search Bar Input */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F6F2EC] border border-[#E4DDD4] mb-3.5">
                  <span className="pl-2 text-neutral-400">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={heroSearchQuery}
                    onChange={(e) => setHeroSearchQuery(e.target.value)}
                    placeholder="Gaming, Tech, Lifestyle..."
                    className="w-full bg-transparent text-[11px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Search"
                    className="w-7 h-7 rounded-xl bg-[#FF3358] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#FF1F48] transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </div>

                {/* Creator List Rows */}
                <div className="space-y-2">
                  {/* Item 1: TechWithSam */}
                  <div
                    onClick={() => setSelectedCreator('TechWithSam')}
                    className={`p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                      selectedCreator === 'TechWithSam'
                        ? 'bg-purple-50/80 border border-purple-200'
                        : 'bg-neutral-50/60 border border-neutral-100 hover:bg-neutral-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        T
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs text-neutral-900 leading-tight">
                          <span>TechWithSam</span>
                          <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">1.2M subscribers</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                      Tech
                    </span>
                  </div>

                  {/* Item 2: GamingGirl */}
                  <div
                    onClick={() => setSelectedCreator('GamingGirl')}
                    className={`p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                      selectedCreator === 'GamingGirl'
                        ? 'bg-purple-50/80 border border-purple-200'
                        : 'bg-neutral-50/60 border border-neutral-100 hover:bg-neutral-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        G
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs text-neutral-900 leading-tight">
                          <span>GamingGirl</span>
                          <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">856K subscribers</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700">
                      Gaming
                    </span>
                  </div>

                  {/* Item 3: MrBeastFan */}
                  <div
                    onClick={() => setSelectedCreator('MrBeastFan')}
                    className={`p-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                      selectedCreator === 'MrBeastFan'
                        ? 'bg-purple-50/80 border border-purple-200'
                        : 'bg-neutral-50/60 border border-neutral-100 hover:bg-neutral-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        M
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs text-neutral-900 leading-tight">
                          <span>MrBeastFan</span>
                          <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-medium">423K subscribers</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                      Entertainment
                    </span>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SKETCH ANNOTATION 1: "Reach the right YouTubers" + Arrow
                 ======================================================== */}
              <div className="absolute -top-3 right-6 sm:right-10 flex flex-col items-center pointer-events-none z-30">
                <span className="font-serif italic font-bold text-xs sm:text-sm text-neutral-800 transform rotate-2">
                  Reach the right YouTubers
                </span>
                <svg className="w-8 h-8 text-neutral-800 -mt-1 ml-4" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M 6 6 Q 16 18 22 26 M 15 25 L 22 26 L 24 19"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* CURVED RED ARROW: Search Card -> Profile Card */}
              <svg
                className="absolute top-16 left-[270px] sm:left-[290px] w-24 h-16 text-[#FF3358] pointer-events-none z-25 hidden sm:block"
                viewBox="0 0 100 60"
                fill="none"
              >
                <path
                  d="M 5 15 Q 55 -5 85 45"
                  stroke="#FF3358"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 74 38 L 85 45 L 88 34"
                  stroke="#FF3358"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ========================================================
                  CARD 2: CREATOR PROFILE CARD (Top-Right)
                 ======================================================== */}
              <div
                className="absolute top-14 sm:top-12 right-0 sm:right-2 w-[240px] sm:w-[260px] bg-white rounded-3xl p-4 shadow-2xl border border-[#EAE3DB] z-25 animate-float-1"
              >
                {/* Thumbnail banner simulation with avatar and play badge */}
                <div className="relative w-full h-28 rounded-2xl bg-gradient-to-tr from-neutral-900 to-neutral-800 overflow-hidden flex items-center justify-center p-2 mb-3">
                  {/* Subtle video UI details */}
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  
                  {/* Floating Subscriber Pill */}
                  <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1.5 border border-white">
                    <svg className="w-3.5 h-3.5 text-red-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span className="text-[10px] font-extrabold text-neutral-900">
                      {selectedCreator === 'TechWithSam' ? '1.2M' : selectedCreator === 'GamingGirl' ? '856K' : '423K'}
                    </span>
                  </div>
                </div>

                {/* Creator Details */}
                <div className="flex items-center gap-1.5 font-black text-sm text-neutral-900 mb-1">
                  <span>{selectedCreator}</span>
                  <svg className="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" />
                  </svg>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {selectedCreator === 'TechWithSam' ? 'Tech' : selectedCreator === 'GamingGirl' ? 'Gaming' : 'Entertainment'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Video Editing
                  </span>
                </div>

                {/* Status Checks */}
                <div className="space-y-1 text-[11px] font-semibold text-neutral-700 mb-3">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Great engagement rate</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <polyline points="3 7 12 13 21 7" />
                    </svg>
                    <span>Direct Business Email available</span>
                  </div>
                </div>

                {/* Contact Red Button */}
                <a
                  href="/signup"
                  onClick={(e) => handleNavClick('/signup', e)}
                  className="block w-full py-2 rounded-xl text-center text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-md transition-colors"
                >
                  Contact
                </a>
              </div>

              {/* CURVED RED ARROW: Profile Card -> Client Card */}
              <svg
                className="absolute top-[280px] right-24 w-16 h-20 text-[#FF3358] pointer-events-none z-20 hidden sm:block"
                viewBox="0 0 60 80"
                fill="none"
              >
                <path
                  d="M 50 5 Q 55 45 15 65"
                  stroke="#FF3358"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 28 58 L 15 65 L 20 78"
                  stroke="#FF3358"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* ========================================================
                  SKETCH ANNOTATION 2: "Get Clients" + Curved Arrow
                 ======================================================== */}
              <div className="absolute bottom-28 left-6 sm:left-12 flex flex-col items-center pointer-events-none z-30">
                <span className="font-serif italic font-bold text-xs sm:text-sm text-neutral-800 -rotate-6">
                  Get Clients
                </span>
                <svg className="w-9 h-7 text-neutral-800 mt-0.5 ml-2" viewBox="0 0 36 28" fill="none">
                  <path
                    d="M 4 4 Q 12 24 28 20 M 20 15 L 28 20 L 22 26"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* ========================================================
                  CARD 3: CLIENT / OPPORTUNITY CARD (Bottom-Right)
                 ======================================================== */}
              <div
                className="absolute bottom-0 right-2 sm:right-6 w-[290px] sm:w-[320px] bg-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-[#EAE3DB] z-30 animate-float-2"
              >
                {/* Header with red briefcase badge and timestamp */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100 text-[#FF3358]">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide">Client</span>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">2m ago</span>
                </div>

                {/* Job Title */}
                <h4 className="font-extrabold text-xs sm:text-sm text-neutral-900 leading-snug mb-3">
                  Looking for YouTubers for brand collaboration & editing work
                </h4>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-rose-800">
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100">Gaming</span>
                  <span>|</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100">Tech</span>
                  <span>|</span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100">10K+ - 500K</span>
                </div>
              </div>

              {/* ========================================================
                  DECORATIVE 3D YOUTUBE BUTTON + "More Opportunities"
                 ======================================================== */}
              <div className="absolute -bottom-8 -right-4 sm:-right-6 flex flex-col items-center z-35 pointer-events-none">
                {/* 3D-ish Red YouTube Play Icon */}
                <div className="relative">
                  <div className="w-14 h-10 rounded-2xl bg-gradient-to-b from-[#FF2B52] to-[#D90429] flex items-center justify-center text-white shadow-xl shadow-red-500/30 transform -rotate-6 border border-white/40">
                    <svg className="w-5 h-5 ml-0.5 fill-current" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  {/* Subtle little burst ticks around play icon */}
                  <div className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-[#FF3358]" />
                  <div className="absolute -top-2.5 right-2 w-1 h-2 rounded-full bg-[#FF3358]" />
                </div>

                {/* Sketch card: "More Opportunities" */}
                <div className="mt-1 px-3 py-1 bg-white border border-neutral-900 rounded-xl shadow-xs transform rotate-3">
                  <span className="text-[10px] font-bold text-neutral-900">
                    More Opportunities
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SECTION 1: HOW IT WORKS (#how) */}
      <section id="how" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Streamlined 3-Step Outreach
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              From Search to Signed Client in Minutes
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 font-medium mt-2">
              Skip hours of manual video scraping. Discover creators who actually need your services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-[#FAF6F2] border border-[#EAE3DB] hover:border-[#FF3358]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-sm">
                01
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Filter Niche & Scale</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Filter across 9 niches and subscriber brackets from 1K to 1M+ to target creators who match your pricing tier.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF6F2] border border-[#EAE3DB] hover:border-[#FF3358]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-sm">
                02
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Inspect Video & CTR</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Review recent channel uploads, thumbnail weaknesses, and engagement rates to tailor your pitch specifically.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF6F2] border border-[#EAE3DB] hover:border-[#FF3358]/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-sm">
                03
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Pitch & Close Deal</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Unlock direct business inquiry emails and Instagram handles. Send sample thumbnails or sample edit cuts with 0% brokerage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: USE CASES (#use) */}
      <section id="use" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-[#FAF6F2]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Tailored For Creators & Freelancers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              Built for Those Who Want Paid Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-white border border-[#EAE3DB] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6B30FF] flex items-center justify-center mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Video Editors</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Find YouTubers uploading regularly with high potential who need faster turnarounds, sound design, and retention-focused pacing.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-[#EAE3DB] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#FF3358] flex items-center justify-center mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Thumbnail Designers</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Spot channels with great content but low CTR thumbnails. Send mock revamp concepts straight to their verified business email.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-[#EAE3DB] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-neutral-950 mb-2">Brands & Agencies</h3>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                Connect with micro and macro creators for sponsored integrations, product placements, and dedicated influencer partnerships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES (#features) */}
      <section id="features" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Core Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              Everything You Need to Close Deals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Verified Business Emails',
                desc: 'Direct inboxes parsed and validated for minimal bounces and maximum reply rates.',
              },
              {
                title: 'Granular Audience Sizing',
                desc: 'Instant filtering from 1K to 1M+ subscribers to fit both budget startups and high-end retainers.',
              },
              {
                title: 'Direct Instagram DMs',
                desc: 'Jump directly to their official Instagram profile for secondary DM pitches.',
              },
              {
                title: 'No Brokerage or Cuts',
                desc: '100% of the contract value is yours. We never take any percentage of your client deals.',
              },
              {
                title: 'Prospect Shortlist',
                desc: 'Save and categorize your target creators with one click to keep your outreach organized.',
              },
              {
                title: 'Pocket-Friendly Plans',
                desc: 'No expensive recurring lock-ins. Simple UPI passes starting at only ₹30 for 30 days.',
              },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-3xl bg-[#FAF6F2] border border-[#EAE3DB]">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE3DB] text-[#FF3358] font-bold text-sm flex items-center justify-center mb-3.5 shadow-xs">
                  ✦
                </div>
                <h3 className="font-extrabold text-neutral-950 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-neutral-600 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PRICING (#pricing) */}
      <section id="pricing" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-[#FAF6F2]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Affordable UPI Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              One Client Pays for the Entire Year
            </h2>
            <p className="text-sm text-neutral-600 font-medium mt-2">
              Start for free with 5 channels, or unlock all emails with our transparent passes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="p-7 rounded-3xl bg-white border border-[#EAE3DB] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-950">Free Tier</h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">Explore our creator list</p>
                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-950">₹0</span>
                  <span className="text-xs font-semibold text-neutral-500">/ forever</span>
                </div>
                <ul className="space-y-2 text-xs font-medium text-neutral-700 pt-3 border-t border-[#EAE3DB]">
                  <li className="flex items-center gap-2">✓ First 5 channel profiles</li>
                  <li className="flex items-center gap-2">✓ Channel & Instagram links</li>
                  <li className="flex items-center gap-2 text-neutral-400">✗ Emails locked</li>
                  <li className="flex items-center gap-2 text-neutral-400">✗ Channels 6+ locked</li>
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href="/signup"
                  onClick={(e) => handleNavClick('/signup', e)}
                  className="block w-full py-2.5 px-4 rounded-xl border border-[#D8CFC5] text-center text-xs font-bold text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  Start Free
                </a>
              </div>
            </div>

            {/* 30 Days Pass */}
            <div className="p-7 rounded-3xl bg-white border-2 border-rose-300 flex flex-col justify-between relative shadow-md">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-[#FF3358] border border-rose-200 shadow-xs">
                Limited Offer
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-neutral-950">30 Days Pass</h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">Close your first retainer</p>
                <div className="my-5 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-bold text-neutral-400 line-through">₹199</span>
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950">₹30</span>
                  <span className="text-xs font-semibold text-neutral-500">/ 30 days</span>
                </div>
                <ul className="space-y-2 text-xs font-medium text-neutral-700 pt-3 border-t border-rose-100">
                  <li className="flex items-center gap-2 text-emerald-700 font-bold">✓ Unlocks all creator emails</li>
                  <li className="flex items-center gap-2">✓ Verified Instagram handles</li>
                  <li className="flex items-center gap-2">✓ Unlimited saved shortlist ("Save It")</li>
                  <li className="flex items-center gap-2">✓ Instant activation via UPI</li>
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href={currentUser ? '/dashboard/plans' : '/signup'}
                  onClick={(e) => handleNavClick(currentUser ? '/dashboard/plans' : '/signup', e)}
                  className="block w-full py-3 px-4 rounded-xl text-center text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-md transition-colors"
                >
                  Get 30 Days (₹30)
                </a>
              </div>
            </div>

            {/* 1 Year Pro */}
            <div className="p-7 rounded-3xl bg-white border-2 border-neutral-900 flex flex-col justify-between relative shadow-xl">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-900 text-white shadow-xs">
                Popular
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-neutral-950">1 Year Pro</h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">Full agency & editor suite</p>
                <div className="my-5 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-950">₹299</span>
                  <span className="text-xs font-semibold text-neutral-500">/ 365 days</span>
                </div>
                <ul className="space-y-2 text-xs font-medium text-neutral-700 pt-3 border-t border-neutral-200">
                  <li className="flex items-center gap-2 text-emerald-700 font-bold">✓ Unlocks all creator emails</li>
                  <li className="flex items-center gap-2">✓ Direct Instagram contacts</li>
                  <li className="flex items-center gap-2">✓ Unlimited shortlists & exports</li>
                  <li className="flex items-center gap-2">✓ Fresh weekly creator leads</li>
                  <li className="flex items-center gap-2 font-bold text-rose-600">✓ Saves 83% vs monthly</li>
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href={currentUser ? '/dashboard/plans' : '/signup'}
                  onClick={(e) => handleNavClick(currentUser ? '/dashboard/plans' : '/signup', e)}
                  className="block w-full btn-25d py-3 text-center text-xs font-extrabold"
                >
                  Choose 1 Year Pro
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: USER & PRIVACY POLICY (#policy) */}
      <section id="policy" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-[#FAF6F2]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Ethical & Public Data Statement
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              User Policy & Privacy Policy
            </h2>
            <p className="text-sm text-neutral-600 font-medium mt-2">
              Our pledge on data integrity, creator protection, and transparent platform goals.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#EAE3DB] p-6 sm:p-10 shadow-sm space-y-8">
            {/* 1. Zero Sale of Personal Data */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF3358] border border-rose-100 flex items-center justify-center shrink-0 font-extrabold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-neutral-950">
                  1. Zero Sale of Personal Data
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                  YouTuber Finder strictly <strong>does NOT sell, rent, monetize, or trade anyone's personal, private, or confidential data</strong> to third parties or brokers. We take privacy seriously and never share private user records.
                </p>
              </div>
            </div>

            {/* 2. Public Data Aggregation Only */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF3358] border border-rose-100 flex items-center justify-center shrink-0 font-extrabold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-neutral-950">
                  2. Only Publicly Available Web Data is Organized
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                  Our system does not scrape private information or personal phone numbers. <strong>We solely organize and present data that creators have already openly and publicly shared across the web</strong> — including public YouTube channel links, verified Instagram handles, and official business inquiry inboxes placed in channel descriptions.
                </p>
              </div>
            </div>

            {/* 3. Platform Purpose */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF3358] border border-rose-100 flex items-center justify-center shrink-0 font-extrabold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-neutral-950">
                  3. Mission: Helping Creators Land Brand Deals & Freelancers Find Work
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                  The primary purpose of YouTuber Finder is to foster genuine, productive relationships: <strong>helping YouTubers receive sponsorships and brand collaborations, while empowering talented freelancers (video editors, thumbnail designers, sound artists, and agencies)</strong> to find meaningful work and build long-term retainers.
                </p>
              </div>
            </div>

            {/* 4. Business Emails & Removal Guarantee */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#FF3358] border border-rose-100 flex items-center justify-center shrink-0 font-extrabold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-black text-neutral-950">
                  4. Official Business Emails Only & Creator Removal
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">
                  Emails provided are designated strictly as <strong>Business Emails</strong> meant for professional correspondence. If you are a creator and wish to have your public channel removed from our directory, simply contact <strong className="text-neutral-900">support@youtuberfinder.com</strong> and we will delete your listing immediately with zero questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ ACCORDION (#faq) */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-t border-[#EAE3DB] bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#FF3358] mb-2 block">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-[#EAE3DB] bg-[#FAF6F2] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-neutral-950 text-sm sm:text-base flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF3358]"
                  >
                    <span>{faq.q}</span>
                    <span className="text-neutral-500 font-mono text-xl shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed border-t border-[#EAE3DB]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-4 sm:px-8 border-t border-[#EAE3DB] bg-[#FAF6F2] text-xs font-semibold text-neutral-600">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-[#0A0A0A] text-white font-bold flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="6" />
                <circle cx="12" cy="12" r="4.5" fill="#FAF6F2" />
              </svg>
            </div>
            <span className="font-extrabold text-neutral-950 text-sm">YouTuber Finder</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how" className="hover:text-black transition-colors">How it works</a>
            <a href="#use" className="hover:text-black transition-colors">Use cases</a>
            <a href="#pricing" className="hover:text-black transition-colors">Pricing</a>
            <a href="#policy" className="hover:text-black transition-colors">User & Privacy Policy</a>
            <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          </div>

          <div>
            © {new Date().getFullYear()} YouTuber Finder. Client Hunting Tool for Creators & Editors.
          </div>
        </div>
      </footer>
    </div>
  );
}
