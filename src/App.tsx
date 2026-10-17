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
import React, { useState, useEffect, useRef } from 'react';
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
    const match = path.match(/\/(login|signup|admin-011@?|admin-011%40|admin|dashboard(?:\/[a-zA-Z0-9_-]+)*)/i);
    if (match) {
      let targetRoute = '/' + match[1];
      if (targetRoute === '/admin-011%40' || targetRoute === '/admin-011') targetRoute = '/admin-011@';
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
  const currentPathRef = useRef(currentPath);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Keep ref synchronized
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  // Safe View Transition helper that suppresses aborted/skipped transition rejections
  const safeStartViewTransition = (callback: () => void) => {
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      typeof (document as any).startViewTransition === 'function'
    ) {
      try {
        const transition = (document as any).startViewTransition(() => {
          callback();
        });
        if (transition) {
          if (transition.ready && typeof transition.ready.catch === 'function') {
            transition.ready.catch(() => {});
          }
          if (transition.finished && typeof transition.finished.catch === 'function') {
            transition.finished.catch(() => {});
          }
          if (transition.updateCallbackDone && typeof transition.updateCallbackDone.catch === 'function') {
            transition.updateCallbackDone.catch(() => {});
          }
        }
        return transition;
      } catch {
        callback();
      }
    } else {
      callback();
    }
  };

  useEffect(() => {
    const onLocationChange = () => {
      const next = getCleanPath();
      if (next !== currentPathRef.current) {
        currentPathRef.current = next;
        safeStartViewTransition(() => {
          setCurrentPath(next);
        });
      }
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
  }, [currentPath]);

  // Run scroll reveal observer whenever path changes or after DOM updates
  useEffect(() => {
    const timer = setTimeout(() => {
      initScrollReveal();
    }, 40);
    return () => clearTimeout(timer);
  }, [currentPath]);

  const navigate = (path: string) => {
    if (typeof window === 'undefined') return;
    let cleanTarget = path.startsWith('/') ? path : '/' + path;
    cleanTarget = '/' + cleanTarget.replace(/^\/+|\/+$/g, '');
    if (cleanTarget === currentPathRef.current) return;

    currentPathRef.current = cleanTarget;
    safeStartViewTransition(() => {
      setCurrentPath(cleanTarget);
      if (window.location.hash !== '#' + cleanTarget) {
        window.location.hash = '#' + cleanTarget;
      }
      window.scrollTo(0, 0);
    });
  };

  // Route matching with persistent layout and scene transitions
  const renderRoute = () => {
    if (currentPath === '/login') {
      return (
        <div key="login" className="scene-view-transition min-h-screen w-full">
          <AuthForm mode="login" onNavigate={navigate} />
        </div>
      );
    }

    if (currentPath === '/signup') {
      return (
        <div key="signup" className="scene-view-transition min-h-screen w-full">
          <AuthForm mode="signup" onNavigate={navigate} />
        </div>
      );
    }

    if (
      currentPath === '/admin-011@' ||
      currentPath === '/admin-011%40' ||
      currentPath === '/admin-011' ||
      currentPath === '/admin'
    ) {
      return (
        <div key="admin" className="scene-view-transition min-h-screen w-full">
          <AdminPage onNavigate={navigate} />
        </div>
      );
    }

    // Persist DashboardLayout across dashboard routes to eliminate sidebar/header flashing
    if (currentPath.startsWith('/dashboard')) {
      if (currentPath === '/dashboard/saved') {
        return (
          <DashboardLayout activeMenu="saved" onNavigate={navigate}>
            <div key="saved" className="scene-view-transition w-full">
              <SavedPage onNavigate={navigate} />
            </div>
          </DashboardLayout>
        );
      }
      if (currentPath === '/dashboard/plans') {
        return (
          <DashboardLayout activeMenu="plans" onNavigate={navigate}>
            <div key="plans" className="scene-view-transition w-full">
              <PlansPage onNavigate={navigate} />
            </div>
          </DashboardLayout>
        );
      }
      if (currentPath === '/dashboard/settings') {
        return (
          <DashboardLayout activeMenu="settings" onNavigate={navigate}>
            <div key="settings" className="scene-view-transition w-full">
              <SettingsPage onNavigate={navigate} />
            </div>
          </DashboardLayout>
        );
      }
      return (
        <DashboardLayout activeMenu="find" onNavigate={navigate}>
          <div key="find" className="scene-view-transition w-full">
            <FindPage onNavigate={navigate} />
          </div>
        </DashboardLayout>
      );
    }

    return (
      <div key="landing" className="scene-view-transition min-h-screen w-full">
        <LandingPage onNavigate={navigate} />
      </div>
    );
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
      <div className="min-h-screen w-full bg-[#FAF6F2] dark:bg-[#13100E] text-neutral-900 dark:text-[#FAF6F2] transition-colors duration-200">
        {renderRoute()}
      </div>
    </ErrorBoundary>
  );
}
