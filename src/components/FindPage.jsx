/**
 * src/components/FindPage.jsx
 * "Find YouTubers" dashboard view.
 * Filter creators by Niche, Subscriber range, Language, and Services Needed.
 * Enforces freemium rules with CreatorCard.
 */
import React, { useState, useEffect } from 'react';
import { CREATORS, NICHES, COUNTRIES, RANGES } from '../../lib/data.js';
import { isPaid, savedIds, toggleSave, subscribeStore } from '../../lib/store.js';
import CreatorCard from '../../lib/CreatorCard.js';

export default function FindPage({ onNavigate }) {
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [selectedRange, setSelectedRange] = useState('any');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    niche: 'all',
    range: 'any',
    country: 'all',
    q: '',
  });

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

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      niche: selectedNiche,
      range: selectedRange,
      country: selectedCountry,
      q: searchQuery.trim().toLowerCase(),
    });
  };

  const handleReset = () => {
    setSelectedNiche('all');
    setSelectedRange('any');
    setSelectedCountry('all');
    setSearchQuery('');
    setAppliedFilters({ niche: 'all', range: 'any', country: 'all', q: '' });
  };

  const handleToggleSave = (id) => {
    const updated = toggleSave(id);
    setSavedList(updated);
  };

  // Filter creators
  const filteredCreators = CREATORS.filter((c) => {
    // Niche filter
    if (appliedFilters.niche !== 'all' && c.niche.toLowerCase() !== appliedFilters.niche.toLowerCase()) {
      return false;
    }

    // Country / Region filter (India, International, All Countries)
    if (appliedFilters.country !== 'all') {
      const creatorRegion = (c.region || 'India').toLowerCase();
      if (creatorRegion !== appliedFilters.country.toLowerCase()) {
        return false;
      }
    }

    // Subscriber range filter
    if (appliedFilters.range !== 'any') {
      const rangeObj = RANGES.find((r) => r.id === appliedFilters.range);
      if (rangeObj) {
        if (c.subs < rangeObj.min || c.subs > rangeObj.max) {
          return false;
        }
      }
    }

    // Keyword search
    if (appliedFilters.q) {
      const matchName = c.name.toLowerCase().includes(appliedFilters.q);
      const matchNiche = c.niche.toLowerCase().includes(appliedFilters.q);
      const matchRegion = (c.region || '').toLowerCase().includes(appliedFilters.q);
      if (!matchName && !matchNiche && !matchRegion) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-3xl bg-white border border-[#EAE3DB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-neutral-950">
              Client & Creator Directory
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-[#FF3358] border border-rose-100">
              1000+ List
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
            {userIsPaid ? (
              <span className="text-emerald-700 font-bold">
                ✓ Pro Hunter: All direct creator inquiry emails & Instagram handles unlocked.
              </span>
            ) : (
              <span>
                Free tier: First 5 channels visible, emails locked. Unlock all leads for only ₹30.
              </span>
            )}
          </p>
        </div>
        {!userIsPaid && (
          <button
            onClick={() => onNavigate && onNavigate('/dashboard/plans')}
            className="py-2.5 px-5 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            Unlock All (₹30)
          </button>
        )}
      </div>

      {/* FILTER BAR WITH 3 SELECTS + SEARCH INPUT */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#EAE3DB] shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Niche Select */}
            <div>
              <label htmlFor="select-niche" className="block text-xs font-bold text-neutral-900 mb-1.5">
                Category / Niche
              </label>
              <select
                id="select-niche"
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF3358] focus:bg-white"
              >
                <option value="all">All Niches</option>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Subscriber Range Select */}
            <div>
              <label htmlFor="select-range" className="block text-xs font-bold text-neutral-900 mb-1.5">
                Subscriber Bracket
              </label>
              <select
                id="select-range"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF3358] focus:bg-white"
              >
                {RANGES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Country / Region Select */}
            <div>
              <label htmlFor="select-country" className="block text-xs font-bold text-neutral-900 mb-1.5">
                Country / Region
              </label>
              <select
                id="select-country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF3358] focus:bg-white"
              >
                <option value="all">All Countries</option>
                <option value="India">India</option>
                <option value="International">International</option>
              </select>
            </div>

            {/* Keyword / Name Search */}
            <div>
              <label htmlFor="search-input" className="block text-xs font-bold text-neutral-900 mb-1.5">
                Keyword or Creator
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="e.g. Sam, Gaming, Tech..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-[#EAE3DB] bg-[#FAF6F2] text-neutral-900 text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#FF3358] focus:bg-white placeholder:text-neutral-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs p-1"
                    aria-label="Clear input"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0EAE3]">
            <div className="text-xs font-bold text-neutral-600">
              Found <strong className="text-neutral-950 font-black">{filteredCreators.length}</strong> matching creators
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-4 rounded-xl border border-[#EAE3DB] text-xs font-bold text-neutral-600 hover:text-black transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 rounded-xl text-xs font-extrabold text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Find Opportunities</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* RESULTS GRID */}
      {filteredCreators.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#EAE3DB]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-500">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h3 className="text-base font-extrabold text-neutral-950">
            No creators match this filter
          </h3>
          <p className="text-xs text-neutral-500 font-medium mt-1 max-w-sm mx-auto">
            Try resetting your filters or widening your subscriber bracket.
          </p>
          <button
            onClick={handleReset}
            className="mt-4 py-2 px-4 rounded-xl border border-[#EAE3DB] text-xs font-bold text-neutral-900 hover:bg-[#FAF6F2] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCreators.map((creator, index) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              index={index}
              isPaid={userIsPaid}
              isSaved={savedList.includes(creator.id)}
              onToggleSave={handleToggleSave}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
