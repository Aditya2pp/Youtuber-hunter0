/**
 * lib/AuthForm.jsx
 * Unified authentication form component for /login and /signup.
 * Updated with warm off-white background (#FAF6F2), bold typography,
 * 2.5D button styling, and password eye toggle. No purple background.
 */
import React, { useState } from 'react';
import { signup, login } from './store.js';
import Loader from './Loader.js';

export default function AuthForm({ mode = 'login', onNavigate }) {
  const isSignup = mode === 'signup';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or username for login
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (isSignup) {
      if (!username.trim() || !email.trim() || !password) {
        setError('Please fill in all fields.');
        return;
      }
      setIsSubmitting(true);
      const err = signup({ username, email, password });
      setIsSubmitting(false);

      if (err) {
        setError(err);
      } else {
        setShowLoader(true);
      }
    } else {
      if (!identifier.trim() || !password) {
        setError('Please enter your email or username and password.');
        return;
      }
      setIsSubmitting(true);
      const err = login(identifier, password);
      setIsSubmitting(false);

      if (err) {
        setError(err);
      } else {
        setShowLoader(true);
      }
    }
  };

  const handleLoaderComplete = () => {
    if (onNavigate) {
      onNavigate('/dashboard/find');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/find';
    }
  };

  return (
    <>
      {showLoader && <Loader onComplete={handleLoaderComplete} />}

      <div className="min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 bg-[#FAF6F2]">
        <div className="w-full max-w-md">
          {/* Back to Home Link */}
          <div className="mb-6 flex justify-between items-center">
            <a
              href="/"
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate('/');
                }
              }}
              className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-950 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] rounded-lg py-1 px-2 -ml-2"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to home
            </a>
            <span className="text-neutral-400 text-xs font-semibold">
              Client Hunting Tool
            </span>
          </div>

          {/* Centered White Card */}
          <div className="bg-white rounded-3xl sm:rounded-[32px] p-7 sm:p-10 shadow-xl border border-[#EAE3DB]">
            {/* Logo */}
            <div className="flex flex-col items-center text-center mb-7">
              <a
                href="/"
                onClick={(e) => {
                  if (onNavigate) {
                    e.preventDefault();
                    onNavigate('/');
                  }
                }}
                className="w-13 h-13 rounded-2xl bg-[#0A0A0A] flex items-center justify-center text-white mb-4 shadow-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#FF3358]"
                aria-label="YouTuber Finder Home"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="6" />
                  <circle cx="12" cy="12" r="4.5" fill="#FAF6F2" />
                </svg>
              </a>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
                {isSignup ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1.5 max-w-xs">
                {isSignup
                  ? 'Access 10,000+ creators for video editing and thumbnail deals.'
                  : 'Log in to your YouTuber Finder hunting workspace.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5"
              >
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5 text-rose-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup ? (
                <>
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-xs font-bold text-neutral-800 mb-1.5"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. aditya_editor"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF3358] focus:ring-2 focus:ring-[#FF3358]/20 transition-all placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-bold text-neutral-800 mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aditya@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF3358] focus:ring-2 focus:ring-[#FF3358]/20 transition-all placeholder:text-neutral-400"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-bold text-neutral-800 mb-1.5"
                  >
                    Email or username
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="aditya@example.com or aditya"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF3358] focus:ring-2 focus:ring-[#FF3358]/20 transition-all placeholder:text-neutral-400"
                  />
                </div>
              )}

              {/* Password field with eye toggle */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-neutral-800 mb-1.5"
                >
                  Password {isSignup && <span className="text-neutral-400 font-normal">(min. 6 characters)</span>}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-[#FF3358] focus:ring-2 focus:ring-[#FF3358]/20 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 rounded-lg focus-visible:outline-2 focus-visible:outline-[#FF3358]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit 2.5D Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 btn-25d py-3 text-center text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
                    <svg
                      className="w-4 h-4"
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
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Link */}
            <div className="mt-6 pt-5 border-t border-[#EAE3DB] text-center">
              {isSignup ? (
                <p className="text-xs text-neutral-500 font-medium">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate('/login');
                      }
                    }}
                    className="font-bold text-[#FF3358] hover:underline"
                  >
                    Log in here
                  </a>
                </p>
              ) : (
                <p className="text-xs text-neutral-500 font-medium">
                  Don&apos;t have an account yet?{' '}
                  <a
                    href="/signup"
                    onClick={(e) => {
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate('/signup');
                      }
                    }}
                    className="font-bold text-[#FF3358] hover:underline"
                  >
                    Sign up free
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
