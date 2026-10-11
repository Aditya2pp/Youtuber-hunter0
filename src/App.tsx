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

export default function App() {
  const getCleanPath = () => {
    if (typeof window === 'undefined') return '/';
    // If hash routing is used (e.g. /#login or /#/login)
    if (window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '/');
      if (hash) return hash;
    }
    const path = window.location.pathname || '/';
    // Remove potential GitHub Pages repository subfolder if path starts with it
    // e.g. /repo-name/dashboard -> /dashboard
    const match = path.match(/\/(login|signup|dashboard.*)$/);
    if (match) {
      return '/' + match[1];
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
      // If running on GitHub Pages (username.github.io) or file protocol,
      // use hash routing (e.g. #/login, #/dashboard/plans) so page reload never gives 404
      const isGitHubPages =
        window.location.hostname.includes('github.io') ||
        window.location.protocol === 'file:' ||
        Boolean(window.location.hash);

      if (isGitHubPages) {
        window.location.hash = '#' + (path.startsWith('/') ? path : '/' + path);
      } else {
        try {
          window.history.pushState({}, '', path);
        } catch {
          window.location.hash = '#' + path;
        }
      }
      setCurrentPath(getCleanPath());
      window.scrollTo(0, 0);
    }
  };

  // Route matching
  if (currentPath === '/login') {
    return <AuthForm mode="login" onNavigate={navigate} />;
  }

  if (currentPath === '/signup') {
    return <AuthForm mode="signup" onNavigate={navigate} />;
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
        <PlansPage />
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
}
