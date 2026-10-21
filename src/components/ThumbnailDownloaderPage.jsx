/**
 * src/components/ThumbnailDownloaderPage.jsx
 * YT Video Link To Thumbnail Downloader.
 * Exclusively available for subscription members.
 * Allows users to paste any YouTube video or Shorts link and download
 * thumbnails in Ultra HD (1080p), High Quality (720p), and Standard definition.
 */
import React, { useState, useEffect } from 'react';
import { isPaid, me, subscribeStore } from '../../lib/store.js';

export function extractYouTubeId(url) {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;

  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];

  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch) return watchMatch[1];

  const shortsMatch = cleanUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = cleanUrl.match(/\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) return embedMatch[1];

  const liveMatch = cleanUrl.match(/\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch) return liveMatch[1];

  return null;
}

export default function ThumbnailDownloaderPage({ onNavigate }) {
  const [userIsPaid, setUserIsPaid] = useState(() => isPaid());
  const [urlInput, setUrlInput] = useState('');
  const [activeVideoId, setActiveVideoId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [copiedQuality, setCopiedQuality] = useState('');

  useEffect(() => {
    const update = () => {
      setUserIsPaid(isPaid());
    };
    update();
    const unsub = subscribeStore(update);
    return () => unsub();
  }, []);

  const handleFetchThumbnail = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const id = extractYouTubeId(urlInput);
    if (!id) {
      setErrorMessage('Please enter a valid YouTube video link, shorts link, or 11-digit video ID.');
      return;
    }
    setActiveVideoId(id);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text);
          const id = extractYouTubeId(text);
          if (id) {
            setActiveVideoId(id);
            setErrorMessage('');
          }
        }
      }
    } catch {
      // Clipboard permission denied or unavailable
    }
  };

  const handleDownload = async (imageUrl, qualityName) => {
    if (!activeVideoId) return;
    setDownloadingId(qualityName);
    try {
      // Use proxy or direct fetch to download blob
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `YouTube_Thumbnail_${activeVideoId}_${qualityName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch {
      // Fallback: direct window download link
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `YouTube_Thumbnail_${activeVideoId}_${qualityName}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setDownloadingId(''), 800);
    }
  };

  const handleCopyLink = (url, qualityName) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopiedQuality(qualityName);
    setTimeout(() => setCopiedQuality(''), 2500);
  };

  const qualities = activeVideoId
    ? [
        {
          id: 'maxres',
          title: 'Ultra HD (1080p / MaxRes)',
          resolution: '1920 × 1080 / 1280 × 720',
          badge: 'Highest Quality',
          url: `https://img.youtube.com/vi/${activeVideoId}/maxresdefault.jpg`,
          fallbackUrl: `https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`,
        },
        {
          id: 'hq',
          title: 'High Quality (720p / 480p)',
          resolution: '640 × 480 (HQ)',
          badge: 'Standard HD',
          url: `https://img.youtube.com/vi/${activeVideoId}/hqdefault.jpg`,
        },
        {
          id: 'sd',
          title: 'Medium Quality (SD / 360p)',
          resolution: '480 × 360 (SD)',
          badge: 'Compact Size',
          url: `https://img.youtube.com/vi/${activeVideoId}/sddefault.jpg`,
          fallbackUrl: `https://img.youtube.com/vi/${activeVideoId}/mqdefault.jpg`,
        },
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAE3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#FF3358] bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
              <svg className="w-3 h-3 text-[#FF3358]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Subscription Member Tool</span>
            </span>
            {userIsPaid && (
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Unlocked
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight mt-1">
            YT Video Link To Thumbnail Downloader
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium mt-0.5">
            Download high-resolution YouTube thumbnails in Ultra HD (1080p), High Quality (720p), and Standard sizes.
          </p>
        </div>

        {!userIsPaid && (
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('/dashboard/plans')}
            className="self-start sm:self-center py-2.5 px-4 rounded-xl text-xs font-black text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>Upgrade to Pro (₹30) →</span>
          </button>
        )}
      </div>

      {/* IF USER IS NOT PAID: SHOW PRO LOCKED GATE */}
      {!userIsPaid ? (
        <div className="p-6 sm:p-10 rounded-[32px] bg-white border-2 border-neutral-900 shadow-md text-center max-w-2xl mx-auto space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-[#FF3358] border border-rose-200 flex items-center justify-center">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200 inline-block mb-1.5">
              Pro Member Access Only
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-neutral-950">
              Unlock YT Thumbnail Downloader
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-md mx-auto mt-1 leading-relaxed">
              This tool is exclusively available for active subscription members. Extract and download Full HD 1080p, 720p, and SD thumbnails for any YouTube video or Shorts link in 1 click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto pt-2 text-left">
            <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">Ultra HD</span>
              <strong className="text-xs text-neutral-900">1080p MaxRes</strong>
              <p className="text-[10px] text-neutral-500 mt-0.5">Crisp original asset</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">Standard HD</span>
              <strong className="text-xs text-neutral-900">720p & 480p</strong>
              <p className="text-[10px] text-neutral-500 mt-0.5">Instant downloads</p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB]">
              <span className="text-[10px] font-black uppercase text-neutral-500 block">Experience</span>
              <strong className="text-xs text-neutral-900">100% Ad-Free</strong>
              <p className="text-[10px] text-neutral-500 mt-0.5">Zero delays or popups</p>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('/dashboard/plans')}
              className="w-full sm:w-auto min-w-[240px] py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Get 30 Days Pass (₹30) to Unlock →</span>
            </button>
            <span className="text-[11px] text-neutral-500 font-semibold block mt-2">
              Instant activation via any UPI app (GPay, PhonePe, Paytm)
            </span>
          </div>
        </div>
      ) : (
        /* PAID MEMBER TOOL INTERFACE */
        <div className="space-y-6">
          {/* SEARCH / INPUT CARD */}
          <div className="p-5 sm:p-7 rounded-[28px] bg-white border-2 border-neutral-900 shadow-sm space-y-4">
            <form onSubmit={handleFetchThumbnail} className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-700">
                Paste YouTube Video or Shorts URL:
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or youtu.be/..."
                    className="w-full pl-10 pr-24 py-3.5 rounded-2xl border-2 border-[#EAE3DB] focus:border-neutral-950 focus:ring-0 text-xs sm:text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 transition-colors bg-[#FAF6F2] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-black bg-white border border-[#EAE3DB] text-neutral-700 hover:border-black transition-colors cursor-pointer shadow-2xs"
                  >
                    Paste
                  </button>
                </div>

                <button
                  type="submit"
                  className="py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-black text-white bg-[#FF3358] hover:bg-[#FF1F48] shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Get Thumbnails</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Sample test buttons */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-neutral-500 font-semibold">
                <span>Try sample:</span>
                {[
                  { label: "MrBeast", url: "https://www.youtube.com/watch?v=0e3GPea1Tyg" },
                  { label: "Tech Burner", url: "https://www.youtube.com/watch?v=4TgrbW-4X00" },
                  { label: "Veritasium", url: "https://www.youtube.com/watch?v=bBC-nXj3Ng4" },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setUrlInput(sample.url);
                      setActiveVideoId(extractYouTubeId(sample.url));
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF6F2] hover:bg-neutral-100 text-neutral-800 border border-[#EAE3DB] font-bold cursor-pointer transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* RESULTS DISPLAY: 3 QUALITIES */}
          {activeVideoId && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-neutral-950">
                    Extracted Thumbnails
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Video ID: {activeVideoId}
                  </span>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#FF3358] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Video on YouTube</span>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {qualities.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-3xl bg-white border-2 border-neutral-900 p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-200 shadow-2xs group">
                        <img
                          src={q.url}
                          alt={q.title}
                          loading="lazy"
                          onError={(e) => {
                            if (q.fallbackUrl && e.currentTarget.src !== q.fallbackUrl) {
                              e.currentTarget.src = q.fallbackUrl;
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/80 text-white backdrop-blur-xs">
                          {q.badge}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-3">
                        <h4 className="text-sm font-black text-neutral-950">
                          {q.title}
                        </h4>
                        <span className="text-[11px] text-neutral-500 font-mono font-bold block mt-0.5">
                          {q.resolution}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-[#F0EAE3]">
                      <button
                        type="button"
                        onClick={() => handleDownload(q.url, q.id)}
                        disabled={downloadingId === q.id}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-neutral-950 hover:bg-neutral-800 shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {downloadingId === q.id ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                            </svg>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download ({q.id === 'maxres' ? '1080p' : q.id === 'hq' ? '720p' : 'SD'})</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(q.url, q.id)}
                          className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-neutral-700 bg-[#FAF6F2] hover:bg-neutral-100 border border-[#EAE3DB] transition-colors cursor-pointer text-center"
                        >
                          {copiedQuality === q.id ? 'Copied Link!' : 'Copy Link'}
                        </button>
                        <a
                          href={q.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-neutral-700 bg-[#FAF6F2] hover:bg-neutral-100 border border-[#EAE3DB] transition-colors text-center inline-flex items-center gap-1"
                        >
                          <span>Preview</span>
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
