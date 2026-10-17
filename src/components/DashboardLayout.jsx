/**
 * src/components/DashboardLayout.jsx
 * Dashboard wrapper matching the new warm minimal aesthetic (#FAF6F2):
 * - Clean sidebar with EXACTLY 4 Menus: Find YouTubers, Saved YouTubers, Plans, Settings
 * - Desktop (>=900px): collapsible sidebar with smooth transitions
 * - Mobile (<900px): slide-in drawer with backdrop
 * - Auth guard: redirects unauthenticated users to /login
 */
import React, { useState, useEffect } from 'react';
import { me, isPaid, plan, rejectedNotice, subscribeStore } from '../../lib/store.js';
import { getTheme, toggleTheme } from '../../lib/theme.js';

export default function DashboardLayout({ activeMenu = 'find', onNavigate, children }) {
  const [currentUser, setCurrentUser] = useState(() => me() || {
    id: 'guest',
    username: 'Guest',
    email: '',
    is_admin: false,
    isGuest: true,
  });
  const [userIsPaid, setUserIsPaid] = useState(() => isPaid());
  const [userPlan, setUserPlan] = useState(() => plan());
  const [rejectionAlert, setRejectionAlert] = useState(() => rejectedNotice());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(() => getTheme());

  useEffect(() => {
    const onThemeChange = (e) => {
      if (e.detail?.theme) setCurrentTheme(e.detail.theme);
    };
    window.addEventListener('theme-change', onThemeChange);
    return () => window.removeEventListener('theme-change', onThemeChange);
  }, []);

  // Check auth and plan status seamlessly
  useEffect(() => {
    const checkState = () => {
      const u = me();
      if (u) {
        setCurrentUser(u);
      } else {
        setCurrentUser({
          id: 'guest',
          username: 'Guest',
          email: '',
          is_admin: false,
          isGuest: true,
        });
      }
      setUserIsPaid(isPaid());
      setUserPlan(plan());
      setRejectionAlert(rejectedNotice());
    };

    checkState();
    const unsub = subscribeStore(checkState);
    return () => {
      unsub();
    };
  }, []);

  // Window resize listener for 900px breakpoint
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 900;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileDrawerOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menus = [
    {
      id: 'find',
      label: 'Find YouTubers',
      href: '#/dashboard/find',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      id: 'saved',
      label: 'Saved YouTubers',
      href: '#/dashboard/saved',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'plans',
      label: 'Plans & Pricing',
      href: '#/dashboard/plans',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '#/dashboard/settings',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  const pageTitle = {
    find: 'Find YouTubers',
    saved: 'Saved YouTubers',
    plans: 'Subscription & Plans',
    settings: 'Account Settings',
  }[activeMenu] || 'Dashboard';

  const handleMenuClick = (item, e) => {
    e.preventDefault();
    const cleanPath = item.href.replace(/^#\/?/, '/');
    if (onNavigate) {
      onNavigate(cleanPath);
    } else if (typeof window !== 'undefined') {
      window.location.hash = item.href;
    }
    if (!isDesktop) {
      setMobileDrawerOpen(false);
    }
  };

  const toggleHamburger = () => {
    if (isDesktop) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setMobileDrawerOpen(!mobileDrawerOpen);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAF6F2] text-[#0D0A10] relative overflow-x-hidden">
      {/* MOBILE DRAWER BACKDROP */}
      {mobileDrawerOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar menu"
          onClick={() => setMobileDrawerOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setMobileDrawerOpen(false);
          }}
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-300 md:hidden cursor-pointer"
        />
      )}

      {/* SIDEBAR (Desktop collapsible + Mobile slide-in) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between bg-white border-r border-[#EAE3DB] transition-all duration-300 ease-in-out ${
          isDesktop
            ? sidebarOpen
              ? 'w-64 translate-x-0'
              : 'w-20 translate-x-0'
            : mobileDrawerOpen
            ? 'w-72 translate-x-0 shadow-2xl'
            : '-translate-x-full w-72'
        }`}
      >
        {/* Top: Logo */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EAE3DB]">
          <a
            href="#/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-[#FF3358] rounded-xl overflow-hidden"
          >
            <div className="w-10 h-10 rounded-[14px] bg-[#0A0A0A] flex items-center justify-center text-white shrink-0 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="6" />
                <circle cx="12" cy="12" r="4.5" fill="#FAF6F2" />
              </svg>
            </div>
            {(isDesktop ? sidebarOpen : true) && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="font-extrabold text-base tracking-tight text-neutral-950">
                  YouTuber Finder
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Client Hunting
                </span>
              </div>
            )}
          </a>

          {!isDesktop && (
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Center: EXACTLY 4 MENUS */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto" aria-label="Dashboard Navigation">
          {menus.map((item) => {
            const isActive = activeMenu === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleMenuClick(item, e)}
                title={item.label}
                className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#FF3358] ${
                  isActive
                    ? 'bg-[#FAF6F2] text-[#FF3358] shadow-xs'
                    : 'text-neutral-600 hover:bg-[#FAF6F2] hover:text-neutral-950'
                } ${isDesktop && !sidebarOpen ? 'justify-center px-0' : ''}`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#FF3358] rounded-r-full" />
                )}
                <div className={`shrink-0 ${isActive ? 'text-[#FF3358]' : ''}`}>
                  {item.icon}
                </div>
                {(isDesktop ? sidebarOpen : true) && (
                  <span className="truncate">{item.label}</span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom: Plan Status Box & Telegram Support */}
        <div className="p-3 border-t border-[#EAE3DB] space-y-2">
          {(isDesktop ? sidebarOpen : true) ? (
            <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-neutral-900">
                  {userIsPaid ? 'Pro Member' : 'Free Tier'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    userIsPaid
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-[#FF3358]'
                  }`}
                >
                  {userIsPaid ? 'ACTIVE' : 'FREE'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-medium mb-2.5 leading-tight">
                {userIsPaid
                  ? `Valid till ${userPlan?.expiresAt ? new Date(userPlan.expiresAt).toLocaleDateString() : 'Active'}`
                  : 'First 5 channel emails revealed.'}
              </p>
              {!userIsPaid ? (
                <a
                  href="#/dashboard/plans"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/dashboard/plans');
                    if (!isDesktop) setMobileDrawerOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center py-2 px-2.5 rounded-xl font-bold text-xs text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-xs transition-colors"
                >
                  Unlock All (₹30)
                </a>
              ) : (
                <a
                  href="https://t.me/Pixel_Craft0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold text-[11px] text-neutral-700 bg-white border border-[#EAE3DB] hover:border-neutral-900 transition-colors shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                  </svg>
                  <span>Support: @Pixel_Craft0</span>
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <a
                href="#/dashboard/plans"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate('/dashboard/plans');
                }}
                title={userIsPaid ? 'Plan Active' : 'Upgrade Plan'}
                className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-[#FF3358] border border-rose-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </a>
              <a
                href="https://t.me/Pixel_Craft0"
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram Support: @Pixel_Craft0"
                className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#229ED9] border border-[#EAE3DB] hover:border-black"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isDesktop ? (sidebarOpen ? 'ml-64' : 'ml-20') : 'ml-0'
        }`}
      >
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-[#EAE3DB] bg-[#FAF6F2]/90 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            {/* Hamburger button */}
            <button
              type="button"
              onClick={toggleHamburger}
              className="p-2.5 rounded-xl border border-[#EAE3DB] bg-white text-neutral-900 hover:bg-neutral-50 transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] cursor-pointer shadow-xs"
              aria-label={isDesktop ? 'Collapse sidebar' : 'Open navigation drawer'}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right Header: Theme Toggle + Telegram Support + Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Telegram Support Quick Button */}
            <a
              href="https://t.me/Pixel_Craft0"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DB] bg-white hover:border-neutral-900 text-xs font-bold text-neutral-800 transition-colors hidden sm:flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Official Telegram Support: @Pixel_Craft0"
            >
              <svg className="w-3.5 h-3.5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
              </svg>
              <span>Support</span>
            </a>

            {/* Theme Toggle Button with Crisp SVG Icons */}
            <button
              type="button"
              onClick={() => {
                const next = toggleTheme();
                setCurrentTheme(next);
              }}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#EAE3DB] bg-white text-xs font-bold text-neutral-800 hover:border-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Toggle Theme"
            >
              {currentTheme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              <span className="hidden sm:inline">{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {currentUser?.isGuest ? (
              <div className="flex items-center gap-2">
                <a
                  href="#/login"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/login');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#EAE3DB] bg-white text-xs font-bold text-neutral-800 hover:border-black transition-colors"
                >
                  Log In
                </a>
                <a
                  href="#/signup"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/signup');
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-xs transition-colors"
                >
                  Sign Up
                </a>
              </div>
            ) : (
              <a
                href="#/dashboard/settings"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate('/dashboard/settings');
                }}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-[#EAE3DB] bg-white hover:border-black transition-all focus-visible:outline-2 focus-visible:outline-[#FF3358] shadow-xs"
              >
                <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-black text-xs flex items-center justify-center">
                  {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <span className="font-extrabold block text-neutral-900 max-w-[120px] truncate leading-tight">
                    {currentUser?.username}
                  </span>
                  <span className="text-[10px] text-neutral-500 block font-semibold">
                    {userIsPaid ? 'Pro Member' : 'Free Tier'}
                  </span>
                </div>
              </a>
            )}
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-8 max-w-7xl w-full mx-auto">
          {rejectionAlert && (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong className="block font-black text-amber-950 mb-0.5">Important Account Notice</strong>
                  <p className="leading-relaxed font-medium text-amber-900">{rejectionAlert}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <a
                  href="#/dashboard/plans"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/dashboard/plans');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
                >
                  Re-upload Receipt →
                </a>
                <a
                  href="https://t.me/Pixel_Craft0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-neutral-900 border border-amber-300 hover:border-black transition-colors"
                >
                  Contact Telegram
                </a>
              </div>
            </div>
          )}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
