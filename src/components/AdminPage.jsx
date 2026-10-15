import React, { useState, useEffect, useMemo } from 'react';
import {
  me,
  isAdmin,
  isMasterAdmin,
  adminLoginMaster,
  adminLogoutMaster,
  subscribeStore,
  adminGetStats,
  adminGetUsers,
  adminGetPayments,
  adminApprovePayment,
  adminRejectPayment,
  adminSetPlan,
  adminSendPasswordReset,
  adminGetCreatorsList,
  adminSaveCreator,
  adminDeleteCreator,
  adminBulkUpsertCreators,
  adminExportAllCreators,
  getStoragePublicUrl,
} from '../../lib/store.js';
import { getTheme, toggleTheme } from '../../lib/theme.js';

// Format relative time: "Registered 2 mins ago / 3 hrs ago / 5 days ago"
function timeAgo(dateString) {
  if (!dateString) return 'recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Format number into readable format: 1200000 -> 1.2M, 50000 -> 50K
function formatSubs(num) {
  if (!num || isNaN(num)) return '0';
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-IN');
}

// Parse user entered subscriber string (e.g. "240K", "1.5M", "240000")
function parseSubscriberCount(str) {
  if (!str) return 0;
  const cleaned = String(str).trim().toUpperCase();
  if (cleaned.endsWith('M')) {
    const val = parseFloat(cleaned.slice(0, -1));
    return isNaN(val) ? 0 : Math.round(val * 1000000);
  }
  if (cleaned.endsWith('K')) {
    const val = parseFloat(cleaned.slice(0, -1));
    return isNaN(val) ? 0 : Math.round(val * 1000);
  }
  const direct = parseInt(cleaned.replace(/,/g, ''), 10);
  return isNaN(direct) ? 0 : direct;
}

// Clean instagram format
function cleanInstagram(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  const handle = s.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

export default function AdminPage({ onNavigate }) {
  const [currentUser, setCurrentUser] = useState(me);
  const [isMasterAuth, setIsMasterAuth] = useState(() => isMasterAdmin());
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('payments'); // 'users' | 'payments' | 'creators'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    paymentsToCheck: 0,
    totalCreators: 0,
  });

  // Users Tab
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPlanModal, setUserPlanModal] = useState(null); // { user, days }

  // Payments Tab
  const [paymentsList, setPaymentsList] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState('to_check'); // 'to_check' | 'confirmed' | 'rejected' | 'all'
  const [viewScreenshotModal, setViewScreenshotModal] = useState(null); // url string
  const [copiedUrlId, setCopiedUrlId] = useState(null);
  const [copiedEmailId, setCopiedEmailId] = useState(null);

  // Creators Tab
  const [creatorsList, setCreatorsList] = useState([]);
  const [creatorPage, setCreatorPage] = useState(1);
  const [creatorTotal, setCreatorTotal] = useState(0);
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorModal, setCreatorModal] = useState(null); // null | 'add' | { editObject }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // creator object

  // CSV Import State
  const [csvPreviewModal, setCsvPreviewModal] = useState(null); // { validRows, errors, fileName }

  // Theme state
  const [themeState, setThemeState] = useState(() => getTheme());

  useEffect(() => {
    const onThemeChange = (e) => {
      if (e.detail?.theme) setThemeState(e.detail.theme);
    };
    window.addEventListener('theme-change', onThemeChange);
    return () => window.removeEventListener('theme-change', onThemeChange);
  }, []);

  // Sync auth state
  useEffect(() => {
    const checkUser = () => {
      setCurrentUser(me());
      setIsMasterAuth(isMasterAdmin());
    };
    const unsub = subscribeStore(checkUser);
    return () => unsub();
  }, []);

  const isUserAdmin = isMasterAuth || currentUser?.is_admin || isAdmin();

  const handleMasterLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    const u = loginUsername.trim();
    const p = loginPassword.trim();

    if (!u || !p) {
      setAuthError('Kripya Username aur Password dono daalein.');
      return;
    }

    if (u === 'Adminraja@' && p === '#/admin-011@Raja') {
      try {
        setAuthLoading(true);
        await adminLoginMaster(u, p);
        setIsMasterAuth(true);
        showNotification('👑 Admin login successful! Welcome Raja.');
      } catch (err) {
        setAuthError(err.message || 'Login error occurred.');
      } finally {
        setAuthLoading(false);
      }
    } else {
      setAuthError('Galt Username ya Password! Access denied.');
    }
  };

  const handleMasterLogout = async () => {
    await adminLogoutMaster();
    setIsMasterAuth(false);
    setLoginUsername('');
    setLoginPassword('');
    showNotification('Admin panel locked. Successfully logged out.');
  };

  // Load stats
  const refreshStats = async () => {
    try {
      const s = await adminGetStats();
      setStats(s);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  useEffect(() => {
    if (isUserAdmin) {
      refreshStats();
    }
  }, [isUserAdmin]);

  // Load tab-specific data
  useEffect(() => {
    if (!isUserAdmin) return;

    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    const loadData = async () => {
      try {
        if (activeTab === 'users') {
          const list = await adminGetUsers(userSearch);
          if (isMounted) setUsersList(list);
        } else if (activeTab === 'payments') {
          const list = await adminGetPayments(paymentFilter);
          if (isMounted) setPaymentsList(list);
        } else if (activeTab === 'creators') {
          const res = await adminGetCreatorsList({
            page: creatorPage,
            pageSize: 50,
            search: creatorSearch,
          });
          if (isMounted) {
            setCreatorsList(res.data);
            setCreatorTotal(res.count);
          }
        }
      } catch (err) {
        console.error('Admin data load error:', err);
        if (isMounted) setErrorMsg(err.message || 'Error loading records.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isUserAdmin, activeTab, userSearch, paymentFilter, creatorPage, creatorSearch]);

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Payment Actions
  const handleApprovePayment = async (paymentId) => {
    try {
      setLoading(true);
      await adminApprovePayment(paymentId);
      showNotification('Payment approved successfully! Plan verified.');
      const updated = await adminGetPayments(paymentFilter);
      setPaymentsList(updated);
      refreshStats();
    } catch (e) {
      showNotification(e.message || 'Failed to approve payment', true);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to REJECT this payment? User plan will be revoked immediately and future auto-activation will be blocked.')) {
      return;
    }
    try {
      setLoading(true);
      await adminRejectPayment(paymentId);
      showNotification('Payment rejected. Granted plan revoked and user notified.');
      const updated = await adminGetPayments(paymentFilter);
      setPaymentsList(updated);
      refreshStats();
    } catch (e) {
      showNotification(e.message || 'Failed to reject payment', true);
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleSetPlan = async (userId, days) => {
    try {
      setLoading(true);
      await adminSetPlan(userId, days);
      showNotification(`Plan updated: ${days > 0 ? `+${days} days added` : 'Plan removed'}.`);
      setUserPlanModal(null);
      const list = await adminGetUsers(userSearch);
      setUsersList(list);
      refreshStats();
    } catch (e) {
      showNotification(e.message || 'Failed to update user plan', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async (email) => {
    try {
      const res = await adminSendPasswordReset(email);
      showNotification(res || 'Password reset link sent to user email.');
    } catch (e) {
      showNotification(e.message || 'Could not send reset email', true);
    }
  };

  // Creator Actions
  const handleSaveCreator = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const creatorPayload = {
      id: creatorModal?.id,
      name: formData.get('name')?.toString().trim(),
      subscribers: parseSubscriberCount(formData.get('subscribers')),
      niche: formData.get('niche')?.toString().trim(),
      region: formData.get('region')?.toString().trim() || 'India',
      channel_link: formData.get('channel_link')?.toString().trim(),
      instagram: cleanInstagram(formData.get('instagram')),
      email: formData.get('email')?.toString().trim() || null,
      verified: formData.get('verified') === 'on',
    };

    if (!creatorPayload.name || !creatorPayload.channel_link || !creatorPayload.niche) {
      showNotification('Name, Niche, and Channel Link are required.', true);
      return;
    }

    try {
      setLoading(true);
      await adminSaveCreator(creatorPayload);
      showNotification(creatorPayload.id ? 'YouTuber updated successfully!' : 'YouTuber added successfully!');
      setCreatorModal(null);
      const res = await adminGetCreatorsList({ page: creatorPage, pageSize: 50, search: creatorSearch });
      setCreatorsList(res.data);
      setCreatorTotal(res.count);
      refreshStats();
    } catch (err) {
      showNotification(err.message || 'Failed to save creator.', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCreator = async (creatorId) => {
    try {
      setLoading(true);
      await adminDeleteCreator(creatorId);
      showNotification('YouTuber deleted.');
      setDeleteConfirm(null);
      const res = await adminGetCreatorsList({ page: creatorPage, pageSize: 50, search: creatorSearch });
      setCreatorsList(res.data);
      setCreatorTotal(res.count);
      refreshStats();
    } catch (err) {
      showNotification(err.message || 'Failed to delete creator.', true);
    } finally {
      setLoading(false);
    }
  };

  // CSV File Processing & Validation
  const handleCsvFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        showNotification('CSV file is empty or missing headers.', true);
        return;
      }

      // Parse Header
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      const colIdx = {
        name: headers.indexOf('name'),
        subscribers: headers.findIndex((h) => h.includes('subscriber') || h === 'subs'),
        niche: headers.indexOf('niche'),
        region: headers.indexOf('region'),
        channel_link: headers.findIndex((h) => h.includes('channel') || h.includes('link') || h === 'youtube'),
        instagram: headers.findIndex((h) => h.includes('insta') || h.includes('instagram')),
        email: headers.indexOf('email'),
        verified: headers.indexOf('verified'),
      };

      if (colIdx.name === -1 || colIdx.channel_link === -1 || colIdx.niche === -1) {
        showNotification('CSV must have columns: name, niche, channel_link (plus subscribers, region, email, instagram)', true);
        return;
      }

      const validRows = [];
      const errors = [];
      const seenLinks = new Set();

      for (let i = 1; i < lines.length; i++) {
        const rawLine = lines[i];
        // Basic CSV split supporting quoted strings
        const cols = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
        const cleanCols = cols.map((c) => c.trim().replace(/^"|"$/g, ''));

        const name = cleanCols[colIdx.name] || '';
        const niche = cleanCols[colIdx.niche] || '';
        const channelLink = cleanCols[colIdx.channel_link] || '';
        const subsRaw = colIdx.subscribers !== -1 ? cleanCols[colIdx.subscribers] : '0';
        const regionRaw = colIdx.region !== -1 ? cleanCols[colIdx.region] : 'India';
        const instaRaw = colIdx.instagram !== -1 ? cleanCols[colIdx.instagram] : '';
        const emailRaw = colIdx.email !== -1 ? cleanCols[colIdx.email] : '';
        const verifiedRaw = colIdx.verified !== -1 ? cleanCols[colIdx.verified] : 'true';

        if (!name) {
          errors.push({ row: i + 1, reason: 'Missing Name' });
          continue;
        }
        if (!channelLink || (!channelLink.startsWith('http://') && !channelLink.startsWith('https://'))) {
          errors.push({ row: i + 1, reason: 'Invalid or missing YouTube channel link' });
          continue;
        }
        if (!niche) {
          errors.push({ row: i + 1, reason: 'Missing Niche' });
          continue;
        }

        if (seenLinks.has(channelLink)) {
          errors.push({ row: i + 1, reason: `Duplicate channel_link in CSV: ${channelLink}` });
          continue;
        }
        seenLinks.add(channelLink);

        const subscribers = parseSubscriberCount(subsRaw);
        const region = regionRaw.toLowerCase().includes('inter') ? 'International' : 'India';
        const instagram = cleanInstagram(instaRaw);
        const email = emailRaw ? emailRaw.trim().toLowerCase() : null;
        const verified = verifiedRaw.toLowerCase() !== 'false';

        validRows.push({
          name,
          subscribers,
          niche,
          region,
          channel_link: channelLink,
          instagram,
          email,
          verified,
        });
      }

      setCsvPreviewModal({
        fileName: file.name,
        validRows,
        errors,
      });

      // Clear file input value
      event.target.value = '';
    };

    reader.readAsText(file);
  };

  // Perform CSV Import in 200 chunks
  const executeCsvImport = async () => {
    if (!csvPreviewModal || csvPreviewModal.validRows.length === 0) return;
    try {
      setLoading(true);
      const res = await adminBulkUpsertCreators(csvPreviewModal.validRows);
      showNotification(`Successfully imported ${res.inserted || csvPreviewModal.validRows.length} YouTubers!`);
      setCsvPreviewModal(null);
      const updated = await adminGetCreatorsList({ page: 1, pageSize: 50, search: '' });
      setCreatorsList(updated.data);
      setCreatorTotal(updated.count);
      setCreatorPage(1);
      refreshStats();
    } catch (e) {
      showNotification(e.message || 'CSV Import failed.', true);
    } finally {
      setLoading(false);
    }
  };

  // Export full CSV
  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const allData = await adminExportAllCreators();
      if (!allData || allData.length === 0) {
        showNotification('No creator records to export.', true);
        return;
      }

      const headers = ['name', 'subscribers', 'niche', 'region', 'channel_link', 'instagram', 'email', 'verified'];
      const csvRows = [headers.join(',')];

      allData.forEach((c) => {
        const row = [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          c.subscribers || 0,
          `"${(c.niche || '').replace(/"/g, '""')}"`,
          `"${(c.region || 'India').replace(/"/g, '""')}"`,
          `"${(c.channel_link || '').replace(/"/g, '""')}"`,
          `"${(c.instagram || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          c.verified ? 'true' : 'false',
        ];
        csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `youtubers_backup_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('CSV backup downloaded successfully.');
    } catch (e) {
      showNotification(e.message || 'Export failed.', true);
    } finally {
      setLoading(false);
    }
  };

  // MASTER ADMIN AUTH GATE:
  // Direct login on any phone/device using Master credentials:
  // Username: Adminraja@
  // Password: #/admin-011@Raja
  if (!isUserAdmin) {
    return (
      <div className="min-h-screen bg-[#FAF6F2] flex items-center justify-center p-4">
        <div className="bg-white border border-[#EAE3DB] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF3358]/10 text-[#FF3358] border border-[#FF3358]/20 flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-xs">
              👑
            </div>
            <h2 className="text-2xl font-black text-neutral-900 tracking-tight">
              Master Admin Access
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-1.5 font-medium">
              Kisi bhi device se control panel kholne ke liye Master Username aur Password enter karein.
            </p>
          </div>

          <form onSubmit={handleMasterLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                <span>⛔</span>
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter admin username"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full px-4 py-3 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB] text-sm text-neutral-900 font-semibold focus:outline-none focus:border-[#FF3358] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  className="w-full pl-4 pr-16 py-3 rounded-xl bg-[#FAF6F2] border border-[#EAE3DB] text-sm text-neutral-900 font-semibold focus:outline-none focus:border-[#FF3358] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-800 text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-[#FF3358] hover:bg-[#FF1F48] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {authLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Open Admin Panel</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#EAE3DB] text-center">
            <button
              onClick={() => onNavigate ? onNavigate('/') : (window.location.hash = '#/')}
              className="text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              ← Back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-neutral-900 antialiased font-sans">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-[#FAF6F2]/95 backdrop-blur-md border-b border-[#EAE3DB] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF3358] text-white flex items-center justify-center font-black shadow-sm text-sm">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-neutral-950">
                  Admin Control Panel
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FF3358]/10 text-[#FF3358] border border-[#FF3358]/20">
                  Owner
                </span>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Logged in as @Adminraja@ (Master Administrator)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const next = toggleTheme();
                setThemeState(next);
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-[#EAE3DB] bg-white hover:bg-neutral-50 text-neutral-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Toggle Dark / Light Mode"
            >
              <span>{themeState === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
            </button>

            <button
              onClick={() => onNavigate ? onNavigate('/dashboard/find') : (window.location.hash = '#/dashboard/find')}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[#EAE3DB] bg-white hover:bg-neutral-50 text-neutral-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to App</span>
            </button>

            <button
              onClick={handleMasterLogout}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Lock and logout from Admin Panel"
            >
              <span>🔒 Lock / Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* NOTIFICATIONS */}
      {successMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-sm font-semibold flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-950 font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* STATS TILES (4 CARDS) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-white rounded-2xl border border-[#EAE3DB] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Users</span>
              <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">👥</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">Registered accounts</div>
          </div>

          {/* Card 2: Paid Users */}
          <div className="bg-white rounded-2xl border border-[#EAE3DB] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Paid Users</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">💎</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {stats.paidUsers.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">Active subscriptions</div>
          </div>

          {/* Card 3: Payments To Check */}
          <div className="bg-white rounded-2xl border border-[#EAE3DB] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">To Verify</span>
              <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">⚡</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {stats.paymentsToCheck.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">Auto-activated / pending</div>
          </div>

          {/* Card 4: Total YouTubers */}
          <div className="bg-white rounded-2xl border border-[#EAE3DB] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">YouTubers</span>
              <span className="w-7 h-7 rounded-lg bg-[#FF3358]/10 text-[#FF3358] flex items-center justify-center text-xs font-bold">🎬</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
              {stats.totalCreators.toLocaleString()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">Database entries</div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center border-b border-[#EAE3DB] gap-2 sm:gap-6 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 pt-1 px-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-[#FF3358] text-[#FF3358]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>💰 UPI Payments</span>
            {stats.paymentsToCheck > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#FF3358] text-white">
                {stats.paymentsToCheck}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 pt-1 px-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-[#FF3358] text-[#FF3358]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>👥 Registered Users</span>
            <span className="text-xs text-neutral-400 font-bold">({stats.totalUsers})</span>
          </button>

          <button
            onClick={() => setActiveTab('creators')}
            className={`pb-3 pt-1 px-3 text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'creators'
                ? 'border-[#FF3358] text-[#FF3358]'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>🎬 YouTubers Database</span>
            <span className="text-xs text-neutral-400 font-bold">({stats.totalCreators})</span>
          </button>
        </div>

        {/* =============================================================== */}
        {/* TAB 1: PAYMENTS */}
        {/* =============================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EAE3DB]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mr-1">Filter:</span>
                {[
                  { id: 'to_check', label: '⚡ To Verify / Active', count: stats.paymentsToCheck },
                  { id: 'confirmed', label: '✅ Confirmed' },
                  { id: 'rejected', label: '❌ Rejected' },
                  { id: 'all', label: 'All Payments' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPaymentFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      paymentFilter === f.id
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-[#FAF6F2] text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {f.label} {f.count ? `(${f.count})` : ''}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const list = await adminGetPayments(paymentFilter);
                      setPaymentsList(list);
                      refreshStats();
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF6F2] hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-700 cursor-pointer flex items-center gap-1 transition-colors"
                  title="Refresh Payments"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <div className="text-xs text-neutral-500 font-medium">
                  {paymentsList.length} payment records
                </div>
              </div>
            </div>

            {/* Payments List Table / Cards */}
            {paymentsList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#EAE3DB] p-10 sm:p-12 text-center">
                <div className="text-4xl mb-3">☕</div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {paymentFilter === 'to_check' ? 'No pending payments to verify' : 'No payments found in this filter'}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-md mx-auto">
                  {paymentFilter === 'to_check'
                    ? 'All user payments have either been verified or none are pending verification.'
                    : 'When users submit payments, their user data and direct Supabase screenshot URLs appear here instantly.'}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                  {paymentFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setPaymentFilter('all')}
                      className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
                    >
                      Show All Payments
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const list = await adminGetPayments(paymentFilter);
                        setPaymentsList(list);
                        refreshStats();
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="px-4 py-2 bg-[#FAF6F2] border border-[#EAE3DB] text-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    🔄 Check Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentsList.map((p) => {
                  const isAuto = p.status === 'auto';
                  const isPending = p.status === 'pending';
                  const isApproved = p.status === 'approved';
                  const isRejected = p.status === 'rejected';

                  const rawScreenshot = p.signedScreenshotUrl || p.screenshot_path || p.screenshot || '';
                  const screenshotSrc = rawScreenshot.startsWith('data:') || rawScreenshot.startsWith('http://') || rawScreenshot.startsWith('https://')
                    ? rawScreenshot
                    : (rawScreenshot ? getStoragePublicUrl(rawScreenshot) : '');

                  const isDataUrl = screenshotSrc.startsWith('data:');
                  const displayUsername = p.username && p.username !== 'User' 
                    ? p.username 
                    : (p.email && p.email.includes('@') ? p.email.split('@')[0] : (p.username || 'User'));
                  const displayEmail = p.email && p.email !== 'Email' ? p.email : '';

                  const handleOpenReceiptSafe = (url) => {
                    if (!url) return;
                    if (url.startsWith('data:')) {
                      try {
                        const parts = url.split(',');
                        const mime = parts[0].match(/:(.*?);/)[1];
                        const bstr = atob(parts[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) u8arr[n] = bstr.charCodeAt(n);
                        const blob = new Blob([u8arr], { type: mime });
                        const blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, '_blank');
                      } catch {
                        setViewScreenshotModal(url);
                      }
                    } else {
                      window.open(url, '_blank');
                    }
                  };

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all ${
                        isAuto || isPending
                          ? 'border-amber-400 ring-2 ring-amber-300/40'
                          : 'border-[#EAE3DB]'
                      }`}
                    >
                      <div>
                        {/* Header: User & Status Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-neutral-950 text-base">
                                @{displayUsername}
                              </span>
                              <span className="text-xs text-neutral-400 font-medium">
                                • {timeAgo(p.created_at)}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500 truncate max-w-[220px]">
                              {displayEmail || 'No email provided'}
                            </div>
                          </div>

                          {/* Status Badge */}
                          {isAuto && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              Active, please check
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-300">
                              Waiting (plan not active)
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Confirmed
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                              Rejected
                            </span>
                          )}
                        </div>

                        {/* User Data Details */}
                        <div className="bg-[#FAF6F2] rounded-xl p-3.5 border border-[#EAE3DB] mb-3 space-y-2.5 text-xs">
                          {/* Amount & Plan */}
                          <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DB]">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-neutral-900">₹{p.amount}</span>
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF3358]/10 text-[#FF3358] border border-[#FF3358]/20">
                                {p.plan === '1y' ? '1 Year Pro (365 Days)' : '30 Days Pass'}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-500 font-semibold">
                              {p.created_at ? new Date(p.created_at).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }) : 'Recent'}
                            </span>
                          </div>

                          {/* User ID & Email info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                            <div>
                              <span className="text-neutral-500 font-bold block mb-0.5">User Email:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-neutral-900 truncate" title={displayEmail}>
                                  {displayEmail || 'No email provided'}
                                </span>
                                {displayEmail && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(displayEmail);
                                      setCopiedEmailId(p.id);
                                      setTimeout(() => setCopiedEmailId(null), 2000);
                                    }}
                                    className="text-[10px] text-neutral-600 hover:text-neutral-950 font-bold px-1.5 py-0.5 rounded border border-[#EAE3DB] bg-white cursor-pointer shrink-0"
                                    title="Copy Email"
                                  >
                                    {copiedEmailId === p.id ? '✓ Copied' : 'Copy'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-neutral-500 font-bold block mb-0.5">User ID:</span>
                              <span className="font-mono text-[10px] text-neutral-700 truncate block bg-white px-2 py-1 rounded border border-[#EAE3DB]" title={p.user_id}>
                                {p.user_id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Screenshot URL Section (User data + URL only, no image) */}
                        <div className="mb-4 bg-white rounded-xl p-3 border border-[#EAE3DB] shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                              <span>🔗</span>
                              <span>Screenshot URL:</span>
                            </span>
                            {screenshotSrc ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isDataUrl 
                                  ? 'text-amber-800 bg-amber-50 border-amber-300' 
                                  : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                              }`}>
                                {isDataUrl ? 'Local Receipt Attached' : 'Uploaded on Supabase'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                                No URL
                              </span>
                            )}
                          </div>

                          {screenshotSrc ? (
                            <div className="space-y-2">
                              {/* Readonly URL Box */}
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  readOnly
                                  value={isDataUrl ? 'data:image/... [Embedded Local Receipt]' : screenshotSrc}
                                  className="w-full text-[11px] font-mono py-2 pl-3 pr-24 bg-[#FAF6F2] border border-[#EAE3DB] rounded-lg text-neutral-800 truncate select-all focus:outline-none focus:border-[#FF3358]"
                                  title={screenshotSrc}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(screenshotSrc);
                                    setCopiedUrlId(p.id);
                                    setTimeout(() => setCopiedUrlId(null), 2000);
                                  }}
                                  className="absolute right-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs border border-neutral-700"
                                >
                                  {copiedUrlId === p.id ? 'Copied! ✓' : '📋 Copy URL'}
                                </button>
                              </div>

                              {/* Action Link to open screenshot */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceiptSafe(screenshotSrc)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FF3358] text-white hover:bg-[#FF1F48] rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                  >
                                    <span>Open in New Tab ↗</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setViewScreenshotModal(screenshotSrc)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#EAE3DB] text-neutral-800 hover:bg-neutral-50 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                    title="Open modal preview"
                                  >
                                    <span>👁 Preview</span>
                                  </button>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {isDataUrl ? 'Direct Image Payload' : 'Direct Supabase Storage URL'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-neutral-400 italic py-1">
                              No screenshot URL available for this record
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-[#EAE3DB] flex flex-wrap items-center gap-2">
                        {isApproved ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              ✅ Plan confirmed & active.
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setUserPlanModal({ id: p.user_id, username: p.username || 'User', email: p.email })}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#EAE3DB] bg-white hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                              >
                                Modify Plan
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p.id)}
                                disabled={loading}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : isRejected ? (
                          <div className="w-full flex items-center justify-between gap-2">
                            <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                              ❌ Rejected (Plan Reset to Free).
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprovePayment(p.id)}
                                disabled={loading}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 cursor-pointer"
                              >
                                Re-approve
                              </button>
                              <button
                                onClick={() => setUserPlanModal({ id: p.user_id, username: p.username || 'User', email: p.email })}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#EAE3DB] bg-white hover:bg-neutral-50 text-neutral-800 cursor-pointer"
                              >
                                Set Plan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              disabled={loading}
                              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <span>Confirm Payment</span>
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p.id)}
                              disabled={loading}
                              className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <span>Reject & Remove Plan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserPlanModal({ id: p.user_id, username: p.username || 'User', email: p.email })}
                              className="py-2 px-3 bg-white hover:bg-neutral-50 text-neutral-800 border border-[#EAE3DB] rounded-xl text-xs font-bold transition-all cursor-pointer"
                              title="Directly edit days"
                            >
                              ⚙️ Plan
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: REGISTERED USERS */}
        {/* =============================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#EAE3DB] flex items-center gap-3">
              <svg className="w-4 h-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-sm bg-transparent outline-none placeholder:text-neutral-400 font-medium"
              />
              {userSearch && (
                <button onClick={() => setUserSearch('')} className="text-xs font-bold text-neutral-400 hover:text-neutral-700">
                  Clear
                </button>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-[#EAE3DB] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF6F2] border-b border-[#EAE3DB] text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Password</th>
                      <th className="py-3 px-4">Current Plan</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DB]">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400 font-medium">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const hasPlan = u.plan_expiry && new Date(u.plan_expiry).getTime() > Date.now();
                        const expiryDate = hasPlan
                          ? new Date(u.plan_expiry).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : null;

                        return (
                          <tr key={u.id} className="hover:bg-[#FAF6F2]/50 transition-colors">
                            {/* User details */}
                            <td className="py-3 px-4">
                              <div className="font-extrabold text-neutral-900 flex items-center gap-1.5">
                                <span>@{u.username}</span>
                                {u.is_admin && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                                    ADMIN
                                  </span>
                                )}
                                {u.auto_blocked && (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                    AUTO-BLOCKED
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-500 font-medium">
                                {u.email}
                              </div>
                            </td>

                            {/* Password display (Visible to Admin) */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-[#FAF6F2] px-2.5 py-1 rounded-lg border border-[#EAE3DB] text-neutral-900 select-all">
                                  {u.plain_password || u.password || '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pwd = u.plain_password || u.password || '';
                                    if (pwd && pwd !== '••••••••') {
                                      navigator.clipboard?.writeText(pwd);
                                      showNotification(`Password for @${u.username} copied to clipboard!`);
                                    } else {
                                      handleSendResetLink(u.email);
                                    }
                                  }}
                                  className="text-[11px] font-bold text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                                  title="Copy user password"
                                >
                                  Copy
                                </button>
                              </div>
                            </td>

                            {/* Plan status */}
                            <td className="py-3 px-4">
                              {hasPlan ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span>Active till {expiryDate}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
                                  Free
                                </span>
                              )}
                            </td>

                            {/* Registration time ago */}
                            <td className="py-3 px-4 text-neutral-500 text-xs whitespace-nowrap">
                              {timeAgo(u.created_at)}
                            </td>

                            {/* Action Dropdown / Button */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setUserPlanModal(u)}
                                className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-[#EAE3DB] rounded-xl text-xs font-bold text-neutral-800 transition-all shadow-xs cursor-pointer"
                              >
                                Modify Plan ▾
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 3: YOUTUBERS DATABASE */}
        {/* =============================================================== */}
        {activeTab === 'creators' && (
          <div className="space-y-4">
            {/* Top Toolbar: Search, Upload CSV, Add One, Export Backup */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE3DB] flex flex-wrap items-center justify-between gap-3 shadow-xs">
              {/* Search */}
              <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-[#FAF6F2] px-3.5 py-2 rounded-xl border border-[#EAE3DB]">
                <svg className="w-4 h-4 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, niche, email..."
                  value={creatorSearch}
                  onChange={(e) => {
                    setCreatorSearch(e.target.value);
                    setCreatorPage(1);
                  }}
                  className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-neutral-400 font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Add One */}
                <button
                  onClick={() => setCreatorModal('add')}
                  className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>+ Add One</span>
                </button>

                {/* Import CSV */}
                <label className="px-3 py-2 bg-[#FF3358] hover:brightness-105 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <span>📂 Import CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Export CSV Backup */}
                <button
                  onClick={handleExportCsv}
                  disabled={loading}
                  className="px-3 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-[#EAE3DB] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <span>📥 Export All (CSV)</span>
                </button>
              </div>
            </div>

            {/* Creators List Table */}
            <div className="bg-white rounded-2xl border border-[#EAE3DB] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF6F2] border-b border-[#EAE3DB] text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">YouTuber</th>
                      <th className="py-3 px-4">Subscribers</th>
                      <th className="py-3 px-4">Niche & Region</th>
                      <th className="py-3 px-4">Contact (Email / Insta)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DB]">
                    {creatorsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-neutral-400 font-medium">
                          No YouTubers found matching search.
                        </td>
                      </tr>
                    ) : (
                      creatorsList.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAF6F2]/50 transition-colors">
                          {/* Name + channel link */}
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-neutral-900 flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.verified && (
                                <span className="text-blue-500 text-xs" title="Verified Creator">✓</span>
                              )}
                            </div>
                            <a
                              href={c.channel_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-neutral-400 hover:text-[#FF3358] truncate block max-w-[200px]"
                            >
                              {c.channel_link}
                            </a>
                          </td>

                          {/* Subscribers */}
                          <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                            {formatSubs(c.subscribers)}
                          </td>

                          {/* Niche & Region */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF6F2] border border-[#EAE3DB] text-xs font-semibold text-neutral-800">
                              {c.niche}
                            </span>
                            <span className="text-neutral-400 text-xs ml-1.5">
                              • {c.region || 'India'}
                            </span>
                          </td>

                          {/* Contact Info */}
                          <td className="py-3 px-4">
                            {c.email ? (
                              <div className="text-xs font-mono text-neutral-700 truncate max-w-[180px]">
                                ✉️ {c.email}
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-400 italic">No email</div>
                            )}
                            {c.instagram && (
                              <a
                                href={c.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#FF3358] hover:underline block truncate max-w-[180px]"
                              >
                                📷 Instagram
                              </a>
                            )}
                          </td>

                          {/* Actions: Edit & Delete */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setCreatorModal(c)}
                                className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-[#EAE3DB] text-neutral-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(c)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination (50 items per page) */}
              <div className="p-3.5 bg-[#FAF6F2] border-t border-[#EAE3DB] flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">
                  Showing {(creatorPage - 1) * 50 + 1} - {Math.min(creatorPage * 50, creatorTotal)} of {creatorTotal} creators
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCreatorPage((p) => Math.max(1, p - 1))}
                    disabled={creatorPage <= 1}
                    className="px-3 py-1.5 bg-white border border-[#EAE3DB] rounded-lg font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="font-extrabold text-neutral-800">Page {creatorPage}</span>
                  <button
                    onClick={() => setCreatorPage((p) => p + 1)}
                    disabled={creatorPage * 50 >= creatorTotal}
                    className="px-3 py-1.5 bg-white border border-[#EAE3DB] rounded-lg font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =============================================================== */}
      {/* MODAL 1: VIEW SCREENSHOT ENLARGED */}
      {/* =============================================================== */}
      {viewScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#EAE3DB] flex items-center justify-between">
              <h3 className="font-black text-neutral-900 text-base">Payment Slip Receipt</h3>
              <button
                onClick={() => setViewScreenshotModal(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-950 min-h-[300px]">
              <img
                src={viewScreenshotModal}
                alt="Enlarged Payment Slip"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fb = e.target.parentElement?.querySelector('.modal-img-error');
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <div className="modal-img-error hidden flex-col items-center justify-center p-8 text-center text-white">
                <span className="text-4xl mb-2">⚠️</span>
                <p className="font-bold text-sm">Image preview could not load directly in frame.</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  You can click below to open the authentic payment receipt directly in a new browser tab.
                </p>
                <a
                  href={viewScreenshotModal}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 px-4 py-2 bg-[#FF3358] text-white rounded-xl text-xs font-bold hover:bg-[#FF1F48]"
                >
                  Open Direct Link ↗
                </a>
              </div>
            </div>
            <div className="p-4 border-t border-[#EAE3DB] flex flex-wrap items-center justify-between gap-2 bg-[#FAF6F2]">
              <span className="text-xs text-neutral-500 font-medium truncate max-w-xs">
                Receipt Verification
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={viewScreenshotModal}
                  target="_blank"
                  rel="noreferrer"
                  download="payment_slip.jpg"
                  className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all cursor-pointer shadow-xs border border-neutral-700"
                >
                  Open in New Tab ↗
                </a>
                <button
                  onClick={() => setViewScreenshotModal(null)}
                  className="px-4 py-2 bg-white border border-[#EAE3DB] text-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 2: USER PLAN ADJUSTMENT */}
      {/* =============================================================== */}
      {userPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#EAE3DB]">
            <h3 className="text-lg font-black text-neutral-900 mb-1">
              Adjust Plan for @{userPlanModal.username}
            </h3>
            <p className="text-xs text-neutral-500 mb-5">{userPlanModal.email}</p>

            <div className="space-y-3">
              <button
                onClick={() => handleSetPlan(userPlanModal.id, 30)}
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-extrabold flex items-center justify-between cursor-pointer transition-all"
              >
                <span>➕ Add 30 Days Pass</span>
                <span className="font-mono text-emerald-700">+30 Days</span>
              </button>

              <button
                onClick={() => handleSetPlan(userPlanModal.id, 365)}
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 rounded-2xl text-xs font-extrabold flex items-center justify-between cursor-pointer transition-all"
              >
                <span>➕ Add 1 Year Pro</span>
                <span className="font-mono text-purple-700">+365 Days</span>
              </button>

              <button
                onClick={() => handleSetPlan(userPlanModal.id, 0)}
                disabled={loading}
                className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 rounded-2xl text-xs font-extrabold flex items-center justify-between cursor-pointer transition-all"
              >
                <span>❌ Remove Plan (Reset to Free)</span>
                <span className="font-mono text-rose-700">0 Days</span>
              </button>

              <div className="pt-3 border-t border-[#EAE3DB]">
                <label className="block text-[11px] font-bold text-neutral-600 mb-1.5">
                  Or enter custom active days:
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-custom-plan-days"
                    type="number"
                    min="1"
                    placeholder="e.g. 60 or 90"
                    className="flex-1 px-3 py-2 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] text-xs font-bold outline-none text-neutral-900 focus:border-[#FF3358]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inp = document.getElementById('admin-custom-plan-days');
                      const val = parseInt(inp?.value, 10);
                      if (val && val > 0) {
                        handleSetPlan(userPlanModal.id, val);
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Set Days
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setUserPlanModal(null)}
                className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 3: ADD / EDIT CREATOR */}
      {/* =============================================================== */}
      {creatorModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#EAE3DB] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-neutral-900 mb-4">
              {creatorModal === 'add' ? 'Add New YouTuber' : `Edit @${creatorModal.name}`}
            </h3>

            <form onSubmit={handleSaveCreator} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Creator Name *
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={creatorModal === 'add' ? '' : creatorModal.name}
                  placeholder="e.g. Tech With Sam"
                  className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Subscribers *
                  </label>
                  <input
                    name="subscribers"
                    type="text"
                    required
                    defaultValue={creatorModal === 'add' ? '' : creatorModal.subscribers}
                    placeholder="e.g. 240K or 1.2M"
                    className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Niche *
                  </label>
                  <input
                    name="niche"
                    type="text"
                    required
                    defaultValue={creatorModal === 'add' ? '' : creatorModal.niche}
                    placeholder="e.g. Tech, Gaming, Vlog"
                    className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Region
                  </label>
                  <select
                    name="region"
                    defaultValue={creatorModal === 'add' ? 'India' : (creatorModal.region || 'India')}
                    className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                  >
                    <option value="India">India</option>
                    <option value="International">International</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-neutral-700">
                    <input
                      name="verified"
                      type="checkbox"
                      defaultChecked={creatorModal === 'add' ? true : Boolean(creatorModal.verified)}
                      className="w-4 h-4 rounded text-[#FF3358]"
                    />
                    <span>Verified Badge</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  YouTube Channel Link *
                </label>
                <input
                  name="channel_link"
                  type="url"
                  required
                  defaultValue={creatorModal === 'add' ? '' : creatorModal.channel_link}
                  placeholder="https://youtube.com/@channelname"
                  className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Instagram Link or Handle
                </label>
                <input
                  name="instagram"
                  type="text"
                  defaultValue={creatorModal === 'add' ? '' : creatorModal.instagram}
                  placeholder="@handle or https://instagram.com/handle"
                  className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Business Email (Visible to Paid Users)
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={creatorModal === 'add' ? '' : (creatorModal.email || '')}
                  placeholder="creator@business.com"
                  className="w-full p-2.5 bg-[#FAF6F2] rounded-xl border border-[#EAE3DB] outline-none font-medium text-neutral-900"
                />
              </div>

              <div className="pt-3 border-t border-[#EAE3DB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreatorModal(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#FF3358] text-white rounded-xl text-xs font-black shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  Save YouTuber
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* =============================================================== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#EAE3DB] text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
              🗑️
            </div>
            <h3 className="text-base font-extrabold text-neutral-900 mb-1">
              Delete YouTuber?
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Are you sure you want to permanently delete <strong>{deleteConfirm.name}</strong> from the database?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCreator(deleteConfirm.id)}
                disabled={loading}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL 5: CSV PREVIEW & VALIDATION */}
      {/* =============================================================== */}
      {csvPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-[#EAE3DB] max-h-[90vh] flex flex-col">
            <div className="border-b border-[#EAE3DB] pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-neutral-900">
                  CSV Import Preview: {csvPreviewModal.fileName}
                </h3>
                <p className="text-xs text-neutral-500">
                  Review valid rows and errors before committing to database.
                </p>
              </div>
              <button
                onClick={() => setCsvPreviewModal(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs sm:text-sm">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-700 uppercase block">Valid Rows</span>
                  <span className="text-2xl font-black text-emerald-900">{csvPreviewModal.validRows.length}</span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">Ready to be upserted in chunks of 200</span>
                </div>
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-700 uppercase block">Rejected Rows</span>
                  <span className="text-2xl font-black text-rose-900">{csvPreviewModal.errors.length}</span>
                  <span className="text-[11px] text-rose-700 block mt-0.5">Will be skipped automatically</span>
                </div>
              </div>

              {/* Error Details */}
              {csvPreviewModal.errors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                  <h4 className="text-xs font-extrabold text-rose-900 mb-2 uppercase tracking-wide">
                    Errors Detected ({csvPreviewModal.errors.length} rows):
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 font-mono text-xs text-rose-800">
                    {csvPreviewModal.errors.map((err, idx) => (
                      <div key={idx} className="bg-white/80 p-1.5 rounded-lg border border-rose-200">
                        <strong>Line {err.row}:</strong> {err.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Valid Rows Preview */}
              {csvPreviewModal.validRows.length > 0 && (
                <div>
                  <h4 className="text-xs font-extrabold text-neutral-700 mb-2 uppercase tracking-wide">
                    Sample Valid YouTubers (First 5):
                  </h4>
                  <div className="border border-[#EAE3DB] rounded-xl overflow-hidden divide-y divide-[#EAE3DB]">
                    {csvPreviewModal.validRows.slice(0, 5).map((r, i) => (
                      <div key={i} className="p-2.5 bg-[#FAF6F2] flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-neutral-900">{r.name}</strong> ({r.niche} • {formatSubs(r.subscribers)})
                          <span className="block text-neutral-500 font-mono text-[11px] truncate max-w-sm">{r.channel_link}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">Valid</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#EAE3DB] pt-4 mt-4 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Duplicates with matching channel_link will be ignored safely.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCsvPreviewModal(null)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeCsvImport}
                  disabled={loading || csvPreviewModal.validRows.length === 0}
                  className="px-5 py-2 bg-[#FF3358] text-white rounded-xl text-xs font-black shadow-md hover:brightness-105 cursor-pointer disabled:opacity-50"
                >
                  Confirm & Import {csvPreviewModal.validRows.length} Rows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
