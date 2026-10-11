/**
 * src/components/DashboardLayout.jsx
 * Dashboard wrapper matching the new warm minimal aesthetic (#FAF6F2):
 * - Clean sidebar with EXACTLY 4 Menus: Find YouTubers, Saved YouTubers, Plans, Settings
 * - Desktop (>=900px): collapsible sidebar with smooth transitions
 * - Mobile (<900px): slide-in drawer with backdrop
 * - Auth guard: redirects unauthenticated users to /login
 */
import React, { useState, useEffect } from 'react';
import { me, isPaid, plan, subscribeStore } from '../../lib/store.js';

export default function DashboardLayout({ activeMenu = 'find', onNavigate, children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userIsPaid, setUserIsPaid] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // Check auth and plan status
  useEffect(() => {
    const checkState = () => {
      const u = me();
      if (!u) {
        if (onNavigate) {
          onNavigate('/login');
        } else if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }
      setCurrentUser(u);
      setUserIsPaid(isPaid());
      setUserPlan(plan());
    };

    checkState();
    const unsub = subscribeStore(checkState);
    return () => unsub();
  }, [onNavigate]);

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
      href: '/dashboard/find',
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
      href: '/dashboard/saved',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'plans',
      label: 'Plans & Pricing',
      href: '/dashboard/plans',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/dashboard/settings',
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
    if (onNavigate) {
      onNavigate(item.href);
    } else if (typeof window !== 'undefined') {
      window.location.href = item.href;
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

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F2] text-neutral-500">
        <div className="w-8 h-8 border-3 border-[#FF3358] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            href="/"
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
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-[#FF3358] ${
                  isActive
                    ? 'bg-[#FAF6F2] text-[#FF3358] shadow-xs'
                    : 'text-neutral-600 hover:bg-[#FAF6F2] hover:text-neutral-950'
                } ${isDesktop && !sidebarOpen ? 'justify-center px-0' : ''}`}
              >
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

        {/* Bottom: Plan Status Box */}
        <div className="p-3 border-t border-[#EAE3DB]">
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
              {!userIsPaid && (
                <a
                  href="/dashboard/plans"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('/dashboard/plans');
                    if (!isDesktop) setMobileDrawerOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center py-2 px-2.5 rounded-xl font-bold text-xs text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-xs transition-colors"
                >
                  Unlock All (₹30)
                </a>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <a
                href="/dashboard/plans"
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
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#EAE3DB] bg-[#FAF6F2]/90 backdrop-blur-md">
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

          {/* Right Header: Profile Badge */}
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/settings"
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
                  {userIsPaid ? 'Pro Hunter' : 'Free Tier'}
                </span>
              </div>
            </a>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
