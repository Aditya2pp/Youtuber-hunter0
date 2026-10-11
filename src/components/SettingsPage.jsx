/**
 * src/components/SettingsPage.jsx
 * "Settings" dashboard view.
 * Displays user profile, email, active plan status, demo toggle, and logout button -> /
 * Styled with warm minimal aesthetic (#FAF6F2).
 */
import React, { useState, useEffect } from 'react';
import { me, plan, isPaid, logout, demoActivate, savedIds, subscribeStore } from '../../lib/store.js';

export default function SettingsPage({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userIsPaid, setUserIsPaid] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const update = () => {
      setCurrentUser(me());
      setCurrentPlan(plan());
      setUserIsPaid(isPaid());
      setSavedCount(savedIds().length);
    };
    update();
    const unsub = subscribeStore(update);
    return () => unsub();
  }, []);

  const handleLogout = () => {
    logout();
    if (onNavigate) {
      onNavigate('/');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Details Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3DB] shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-[#F0EAE3] mb-6">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white font-black text-2xl flex items-center justify-center shadow-sm">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-950">
              {currentUser.username}
            </h2>
            <p className="text-xs text-neutral-500 font-semibold">
              Client Hunter since {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <span className="text-neutral-500 block mb-1">Username</span>
            <span className="font-extrabold text-sm text-neutral-950 font-mono">
              @{currentUser.username}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <span className="text-neutral-500 block mb-1">Registered Email</span>
            <span className="font-extrabold text-sm text-neutral-950 font-mono">
              {currentUser.email}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <span className="text-neutral-500 block mb-1">Current Membership Plan</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${userIsPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="font-extrabold text-sm text-neutral-950">
                {userIsPaid
                  ? `Active till ${currentPlan?.expiresAt ? new Date(currentPlan.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active'}`
                  : 'Free Tier (5 Channels)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <span className="text-neutral-500 block mb-1">Saved Pitch Shortlist</span>
            <span className="font-extrabold text-sm text-neutral-950">
              {savedCount} creators saved
            </span>
          </div>
        </div>

        {!userIsPaid && (
          <div className="mt-6 pt-6 border-t border-[#F0EAE3] flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500 font-medium">
              Want access to all creator business emails?
            </span>
            <button
              onClick={() => onNavigate && onNavigate('/dashboard/plans')}
              className="py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] cursor-pointer shadow-xs"
            >
              Upgrade Plan (₹30)
            </button>
          </div>
        )}
      </div>

      {/* USER POLICY & PRIVACY POLICY SECTION (FOR READING) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3DB] shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0EAE3]">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-black text-neutral-950">
              User Policy & Privacy Policy
            </h3>
            <span className="text-[11px] text-neutral-500 font-medium">
              Transparency, Public Data Integrity & Ethics
            </span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-neutral-600 font-medium leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <h4 className="font-extrabold text-neutral-950 mb-1">
              1. We Never Sell Any Personal Data
            </h4>
            <p>
              YouTuber Finder strictly <strong>does NOT sell, trade, rent, or commercialize anyone's personal, private, or confidential data</strong>. We respect creator and user privacy above all else.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <h4 className="font-extrabold text-neutral-950 mb-1">
              2. Only Publicly Published Web Data is Organized
            </h4>
            <p>
              This platform only indexes and organizes information that creators themselves have already made publicly accessible across the web — such as public channel links, official social media usernames, and publicly stated business contact emails from YouTube channel "About" sections. We do not uncover hidden or private phone numbers, home addresses, or private accounts.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <h4 className="font-extrabold text-neutral-950 mb-1">
              3. Purpose: Helping Creators Get Deals & Freelancers Find Work
            </h4>
            <p>
              The core mission of our tool is to build genuine professional opportunities. We help YouTube creators discover sponsorships, brand partnerships, and connect with talented creative freelancers — such as video editors, thumbnail artists, motion designers, and marketing agencies who can help their channels scale.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF6F2] border border-[#EAE3DB]">
            <h4 className="font-extrabold text-neutral-950 mb-1">
              4. Business Inquiries & Removal Requests
            </h4>
            <p>
              All email addresses indexed on this platform are official public business emails intended solely for professional business inquiries. If any creator wishes to update or immediately remove their public listing from our search directory, simply reach out to <strong>support@youtuberfinder.com</strong> and we will delete your record with zero questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* Account Actions Card (Log out) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE3DB] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-neutral-950">
            Sign Out of Your Workspace
          </h3>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Log out from this browser session and return to the homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="py-2.5 px-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-extrabold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}
