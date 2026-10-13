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

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(getCleanPath());
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('hashchange', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('hashchange', onLocationChange);
    };
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      let cleanTarget = path.startsWith('/') ? path : '/' + path;
      cleanTarget = '/' + cleanTarget.replace(/^\/+|\/+$/g, '');
      // Always update hash - works universally on GitHub Pages, preview environments, custom domains
      window.location.hash = '#' + cleanTarget;
      setCurrentPath(cleanTarget);
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

  return <ErrorBoundary>{renderRoute()}</ErrorBoundary>;
}
