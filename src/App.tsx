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
    // If hash routing is used (e.g. #/login, #/dashboard/find)
    if (window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '/');
      if (hash) return hash;
    }
    const path = window.location.pathname || '/';
    // Match potential route inside repository subfolder or root
    // e.g. /dashboard/find, /my-repo/dashboard/find, /docs/dashboard/find
    const match = path.match(/\/(login|signup|dashboard(?:\/[a-zA-Z0-9_-]+)*)/);
    if (match) {
      const targetRoute = '/' + match[1];
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
      const cleanTarget = path.startsWith('/') ? path : '/' + path;
      // Always update hash - works universally on GitHub Pages, preview environments, custom domains
      window.location.hash = '#' + cleanTarget;
      setCurrentPath(cleanTarget);
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
}
