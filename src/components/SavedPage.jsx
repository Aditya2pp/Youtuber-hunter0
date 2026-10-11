/**
 * src/components/SavedPage.jsx
 * "Saved YouTubers" dashboard view.
 * Lists all bookmarked creators with quick unsave and direct contact info.
 */
import React, { useState, useEffect } from 'react';
import { CREATORS } from '../../lib/data.js';
import { isPaid, savedIds, toggleSave, subscribeStore } from '../../lib/store.js';
import CreatorCard from '../../lib/CreatorCard.js';

export default function SavedPage({ onNavigate }) {
  const [userIsPaid, setUserIsPaid] = useState(false);
  const [savedList, setSavedList] = useState([]);

  useEffect(() => {
    const update = () => {
      setUserIsPaid(isPaid());
      setSavedList(savedIds());
    };
    update();
    const unsub = subscribeStore(update);
    return () => unsub();
  }, []);

  const handleToggleSave = (id) => {
    const updated = toggleSave(id);
    setSavedList(updated);
  };

  const savedCreators = CREATORS.filter((c) => savedList.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-3xl bg-white border border-[#EAE3DB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-950">
            Your Outreach Shortlist ({savedCreators.length})
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
            Keep track of candidates for your upcoming pitch emails, thumbnail samples, and video editing tests.
          </p>
        </div>
        <button
          onClick={() => onNavigate && onNavigate('/dashboard/find')}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold border border-[#EAE3DB] bg-[#FAF6F2] hover:bg-neutral-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#FF3358] cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Find More Creators</span>
        </button>
      </div>

      {/* Empty State */}
      {savedCreators.length === 0 ? (
        <div className="p-12 sm:p-16 text-center rounded-3xl bg-white border border-[#EAE3DB] shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-extrabold text-neutral-950">
            No saved creators yet
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1.5 max-w-md mx-auto leading-relaxed">
            Browse through the creator directory and click &quot;Save it&quot; on any YouTuber to pin them to your client hunting shortlist.
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate && onNavigate('/dashboard/find')}
              className="py-2.5 px-6 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              Browse YouTubers Directory
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {savedCreators.map((creator, index) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              index={index}
              isPaid={userIsPaid}
              isSaved={true}
              onToggleSave={handleToggleSave}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
