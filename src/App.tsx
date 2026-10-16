/**
 * src/App.tsx
 * Client-side App Router supporting:
 * - / (Landing Page)
 * - /login (Log In)
 * - /signup (Sign Up)
 * - /dashboard/find (Find YouTubers)
 * - /dashboard/saved (Saved YouTubers)
 * - /dashboard/plans (Subscription & Plans)
 * - /dashboard/settings (Settings)
 */
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import AuthForm from '../lib/AuthForm.js';
import DashboardLayout from './components/DashboardLayout.jsx';
import FindPage from './components/FindPage.jsx';
import SavedPage from './components/SavedPage.jsx';
import PlansPage from './components/PlansPage.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initScrollReveal } from '../lib/scrollReveal.js';

export default function App() {
  const getCleanPath = () => {
    if (typeof window === 'undefined') return '/';
    // If hash routing is used (e.g. #/login, #/admin-011@, #/dashboard/find)
    if (window.location.hash) {
      let rawHash = window.location.hash.replace(/^#\/?/, '/');
      try {
        rawHash = decodeURIComponent(rawHash);
      } catch {}
      rawHash = '/' + rawHash.replace(/^\/+|\/+$/g, '');
      if (rawHash === '/admin-011' || rawHash === '/admin-011@' || rawHash === '/admin-011%40' || rawHash === '/admin') {
        return '/admin-011@';
      }
      if (rawHash) return rawHash;
    }
    let path = window.location.pathname || '/';
    try {
      path = decodeURIComponent(path);
    } catch {}
    // Match potential route inside repository subfolder or root
    // e.g. /admin-011, /admin-011@, /admin, /dashboard/find, /my-repo/dashboard/find
    const match = path.match(/\/(login|signup|admin-011@?|admin-011%40|admin|dashboard(?:\/[a-zA-Z0-9_-]+)*)/i);
    if (match) {
      let targetRoute = '/' + match[1];
      if (targetRoute === '/admin-011%40' || targetRoute === '/admin-011') targetRoute = '/admin-011@';
      // Convert direct path to hash route smoothly without reloading if on GitHub Pages
      if (typeof window.history.replaceState === 'function') {
        const repoBase = path.slice(0, match.index) || '';
        try {
          window.history.replaceState({}, '', (repoBase || '') + '/#' + targetRoute + (window.location.search || ''));
        } catch {
          window.location.hash = '#' + targetRoute;
        }
      }
      return targetRoute;
    }
    return '/';
  };

  const [currentPath, setCurrentPath] = useState(getCleanPath);
  const [navKey, setNavKey] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(getCleanPath());
      setNavKey((prev) => prev + 1);
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  // Smooth scroll progress tracker
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath, navKey]);

  // Run scroll reveal observer whenever path changes or after DOM updates
  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollReveal();
    }, 50);
    return () => clearTimeout(timer);
  }, [currentPath, navKey]);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      let cleanTarget = path.startsWith('/') ? path : '/' + path;
      cleanTarget = '/' + cleanTarget.replace(/^\/+|\/+$/g, '');
      // Always update hash - works universally on GitHub Pages, preview environments, custom domains
      window.location.hash = '#' + cleanTarget;
      setCurrentPath(cleanTarget);
      setNavKey((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  // Route matching
  const renderRoute = () => {
    if (currentPath === '/login') {
      return <AuthForm mode="login" onNavigate={navigate} />;
    }

    if (currentPath === '/signup') {
      return <AuthForm mode="signup" onNavigate={navigate} />;
    }

    if (
      currentPath === '/admin-011@' ||
      currentPath === '/admin-011%40' ||
      currentPath === '/admin-011' ||
      currentPath === '/admin'
    ) {
      return <AdminPage onNavigate={navigate} />;
    }

    if (currentPath === '/dashboard/saved') {
      return (
        <DashboardLayout activeMenu="saved" onNavigate={navigate}>
          <SavedPage onNavigate={navigate} />
        </DashboardLayout>
      );
    }

    if (currentPath === '/dashboard/plans') {
      return (
        <DashboardLayout activeMenu="plans" onNavigate={navigate}>
          <PlansPage onNavigate={navigate} />
        </DashboardLayout>
      );
    }

    if (currentPath === '/dashboard/settings') {
      return (
        <DashboardLayout activeMenu="settings" onNavigate={navigate}>
          <SettingsPage onNavigate={navigate} />
        </DashboardLayout>
      );
    }

    if (currentPath === '/dashboard/find' || currentPath.startsWith('/dashboard')) {
      return (
        <DashboardLayout activeMenu="find" onNavigate={navigate}>
          <FindPage onNavigate={navigate} />
        </DashboardLayout>
      );
    }

    return <LandingPage onNavigate={navigate} />;
  };

  return (
    <ErrorBoundary>
      {/* Silky smooth reading/scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#6B30FF] via-[#FF3358] to-[#FF783E] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%`, opacity: scrollProgress > 1 ? 1 : 0 }}
        />
      </div>
      <div key={`${currentPath}-${navKey}`} className="scene-page-transition min-h-screen w-full">
        {renderRoute()}
      </div>
    </ErrorBoundary>
  );
}
