/**
 * lib/store.js
 * Central Application Store for YouTuber Finder.
 * Hybrid Architecture:
 * - If VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are provided: Uses real Supabase Postgres, Auth, Storage & Server-Side Freemium RPCs.
 * - If Supabase keys are absent: Seamlessly falls back to local demo storage so the site NEVER breaks.
 * Keeps exact function names: me, signup, login, logout, savedIds, toggleSave, plan, isPaid, payment, submitPayment, subscribeStore.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { CREATORS } from './data.js';

const STORAGE_KEYS = {
  USERS: 'yf_users',
  CURRENT_USER: 'yf_current_user',
  SAVED: 'yf_saved_ids',
  PLANS: 'yf_user_plans',
  PAYMENTS: 'yf_user_payments',
};

function isClient() {
  return typeof window !== 'undefined';
}

function getItem(key, fallback = null) {
  if (!isClient()) return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    console.error('Error reading localStorage key', key, e);
    return fallback;
  }
}

function setItem(key, value) {
  if (!isClient()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

function notifyStoreChange(key = 'general') {
  if (!isClient()) return;
  window.dispatchEvent(new CustomEvent('yf_store_change', { detail: { key } }));
}

// ====================================================================
// IN-MEMORY CACHE (Allows synchronous reads for existing React components)
// ====================================================================
let cachedUser = getItem(STORAGE_KEYS.CURRENT_USER, null);
let cachedSavedIds = getItem(STORAGE_KEYS.SAVED, []);
let cachedPlan = null;
let cachedPayment = null;
let cachedRejectedNotice = null;

if (!cachedUser && isClient() && localStorage.getItem('yf_master_admin_session') === 'true') {
  cachedUser = {
    id: 'admin-master-device-id',
    username: 'Adminraja@',
    email: 'adminraja@hunter.internal',
    is_admin: true,
    plan_expiry: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
  };
}

// Helper to calculate plan object from profile
function buildPlanObject(planExpiry, planId = 'plan_30d') {
  if (!planExpiry) return null;
  const expiryTime = new Date(planExpiry).getTime();
  const isExpired = expiryTime <= Date.now();
  if (isExpired) {
    return { planId, name: 'Plan Expired', active: false, expired: true, expiresAt: planExpiry };
  }
  const isAnnual = expiryTime - Date.now() > 40 * 24 * 60 * 60 * 1000;
  return {
    planId: isAnnual ? 'plan_1y' : 'plan_30d',
    name: isAnnual ? '1 Year Pro' : '30 Days Pass',
    active: true,
    expiresAt: planExpiry,
  };
}

// Initial plan calculation from cache
if (cachedUser) {
  if (cachedUser.plan_expiry) {
    cachedPlan = buildPlanObject(cachedUser.plan_expiry);
  } else {
    const allPlans = getItem(STORAGE_KEYS.PLANS, {});
    cachedPlan = allPlans[cachedUser.id] || null;
  }
}

// ====================================================================
// SUPABASE AUTH SYNCHRONIZATION
// ====================================================================
async function syncProfileFromSupabase(userObj) {
  if (!isSupabaseConfigured || !supabase || !userObj) return null;

  try {
    let profile = null;
    let fetchErr = null;

    // Retry up to 3 times with exponential backoff if trigger is executing
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await supabase
        .from('profiles')
        .select('id, username, email, is_admin, plan_expiry, auto_blocked, created_at')
        .eq('id', userObj.id)
        .maybeSingle();

      if (res.data) {
        profile = res.data;
        break;
      }
      fetchErr = res.error;
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }

    const fallbackUsername = userObj.user_metadata?.username || (userObj.email ? userObj.email.split('@')[0] : 'User');
    const emailStr = userObj.email || (profile ? profile.email : '');

    const mergedUser = {
      id: userObj.id,
      username: profile?.username || fallbackUsername,
      email: emailStr,
      is_admin: Boolean(profile?.is_admin || userObj.user_metadata?.is_admin),
      plan_expiry: profile?.plan_expiry || null,
      auto_blocked: Boolean(profile?.auto_blocked),
      createdAt: profile?.created_at || new Date().toISOString(),
    };

    cachedUser = mergedUser;
    setItem(STORAGE_KEYS.CURRENT_USER, mergedUser);

    if (profile?.plan_expiry) {
      cachedPlan = buildPlanObject(profile.plan_expiry);
    } else {
      cachedPlan = null;
    }

    // Fetch user's saved creators
    try {
      const { data: savedRows } = await supabase
        .from('saved_creators')
        .select('creator_id')
        .eq('user_id', userObj.id);

      if (savedRows) {
        cachedSavedIds = savedRows.map((r) => r.creator_id);
        setItem(STORAGE_KEYS.SAVED, cachedSavedIds);
      }
    } catch {}

    // Fetch recent payment to check status / rejected notice
    try {
      const { data: payments } = await supabase.rpc('my_payments');

      if (payments && payments.length > 0) {
        cachedPayment = payments[0];
        const hasRejected = payments.find((p) => p.status === 'failed');
        if (hasRejected) {
          cachedRejectedNotice = 'Notice: Payment Verification Failed. Hum aapki recent payment verify nahi kar paye (Invalid/Fake screenshot detect hui hai). Aapka account remove nahi kiya gaya hai, lekin plan Free tier par reset kar diya gaya hai. Ab aap authentic UPI receipt upload karke apna valid plan buy kar sakte hain.';
        } else {
          cachedRejectedNotice = null;
        }
      }
    } catch {}

    notifyStoreChange('profile_synced');
    return mergedUser;
  } catch (err) {
    console.error('Error in syncProfileFromSupabase:', err);
    return null;
  }
}

// Initialize Supabase Auth Listener on client load
if (isClient() && isSupabaseConfigured && supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      syncProfileFromSupabase(session.user);
    }
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      await syncProfileFromSupabase(session.user);
    } else if (event === 'SIGNED_OUT') {
      cachedUser = null;
      cachedPlan = null;
      cachedSavedIds = [];
      cachedPayment = null;
      cachedRejectedNotice = null;
      if (isClient()) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.SAVED);
      }
      notifyStoreChange('signed_out');
    }
  });
}

// ====================================================================
// CORE STORE API
// ====================================================================

/**
 * Returns currently logged-in user or null. (Synchronous for components)
 */
export function me() {
  return cachedUser;
}

export function isMasterAdmin() {
  if (!isClient()) return false;
  return localStorage.getItem('yf_master_admin_session') === 'true';
}

/**
 * Returns true if current user is an admin or master admin session active.
 */
export function isAdmin() {
  return isMasterAdmin() || Boolean(cachedUser?.is_admin);
}

/**
 * Returns rejected notice string if user recently had a rejected payment.
 */
export function rejectedNotice() {
  return cachedRejectedNotice;
}

/**
 * Sign up a new user.
 * Returns Promise<null on success or string error message>.
 */
export async function signup({ username, email, password }) {
  if (!username || !email || !password) {
    return 'All fields are required.';
  }

  const cleanUser = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUser.length < 3) {
    return 'Username must be at least 3 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return 'Please enter a valid email address.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters for security.';
  }

  // --- SUPABASE MODE ---
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Check username availability via security definer RPC
      let isAvailable = true;
      try {
        const { data: availByParam, error: checkErr1 } = await supabase.rpc('username_available', {
          p_username: cleanUser,
        });
        if (!checkErr1 && typeof availByParam === 'boolean') {
          isAvailable = availByParam;
        } else {
          const { data: availByU, error: checkErr2 } = await supabase.rpc('username_available', {
            u: cleanUser,
          });
          if (!checkErr2 && typeof availByU === 'boolean') {
            isAvailable = availByU;
          }
        }
      } catch (e) {
        console.warn('Username availability check note:', e);
      }

      if (isAvailable === false) {
        return 'Username is already taken. Please choose another username.';
      }

      // 2. Perform Supabase Auth SignUp
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUser,
            raw_password: password,
          },
        },
      });

      if (authErr) {
        return authErr.message || 'Error creating account. Please try again.';
      }

      if (!authData.user) {
        return 'Unable to create user session. Please check your credentials.';
      }

      // Small delay to allow the database trigger to create the profile
      await new Promise((res) => setTimeout(res, 350));
      
      // Update plain_password on profile so admin can view user credentials
      try {
        await supabase
          .from('profiles')
          .update({ plain_password: password })
          .eq('id', authData.user.id);
      } catch (e) {
        console.warn('Could not store plain_password:', e);
      }

      await syncProfileFromSupabase(authData.user);

      return null;
    } catch (err) {
      console.error('Supabase signup error:', err);
      return err.message || 'Signup failed. Please try again.';
    }
  }

  // --- LOCAL FALLBACK MODE ---
  const users = getItem(STORAGE_KEYS.USERS, []);
  if (users.some((u) => u.username.toLowerCase() === cleanUser.toLowerCase())) {
    return 'Username is already taken. Please choose another.';
  }
  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return 'An account with this email already exists.';
  }

  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    username: cleanUser,
    email: cleanEmail,
    password,
    plain_password: password,
    is_admin: cleanEmail.includes('admin'),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);
  cachedUser = newUser;
  setItem(STORAGE_KEYS.CURRENT_USER, newUser);
  notifyStoreChange('signup');
  return null;
}

/**
 * Log in an existing user with username OR email.
 * Returns Promise<null on success or string error message>.
 */
export async function login(identifier, password) {
  if (!identifier || !password) {
    return 'Please enter your email or username and password.';
  }

  const cleanIdent = identifier.trim().toLowerCase();

  // --- SUPABASE MODE ---
  if (isSupabaseConfigured && supabase) {
    try {
      let targetEmail = cleanIdent;

      // If identifier doesn't look like an email, lookup email by username
      if (!cleanIdent.includes('@')) {
        const { data: resolvedEmail, error: lookupErr } = await supabase.rpc('email_for_login', {
          p_ident: cleanIdent,
        });

        if (lookupErr || !resolvedEmail) {
          return 'No account found with this username.';
        }
        targetEmail = resolvedEmail;
      }

      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authErr) {
        return authErr.message || 'Incorrect email or password.';
      }

      if (!authData.user) {
        return 'Login failed. User session not returned.';
      }

      await syncProfileFromSupabase(authData.user);
      return null;
    } catch (err) {
      console.error('Supabase login error:', err);
      return err.message || 'Login failed. Please try again.';
    }
  }

  // --- LOCAL FALLBACK MODE ---
  const users = getItem(STORAGE_KEYS.USERS, []);
  const found = users.find(
    (u) => u.email.toLowerCase() === cleanIdent || u.username.toLowerCase() === cleanIdent
  );

  if (!found) {
    return 'No account found with this email or username.';
  }
  if (found.password !== password) {
    return 'Incorrect password. Please try again.';
  }

  cachedUser = found;
  setItem(STORAGE_KEYS.CURRENT_USER, found);
  notifyStoreChange('login');
  return null;
}

/**
 * Log out current user.
 */
export async function logout() {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error signing out of Supabase:', e);
    }
  }

  cachedUser = null;
  cachedPlan = null;
  cachedSavedIds = [];
  cachedPayment = null;
  cachedRejectedNotice = null;

  if (isClient()) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SAVED);
    notifyStoreChange('logout');
  }
}

/**
 * Returns array of saved creator IDs for current user.
 */
export function savedIds() {
  return cachedSavedIds || [];
}

/**
 * Toggle save state of a creator.
 * Returns new array of saved creator IDs.
 */
export async function toggleSave(creatorId) {
  const user = me();
  if (!user) return cachedSavedIds;

  const currentList = [...cachedSavedIds];
  let nextList;
  const isCurrentlySaved = currentList.includes(creatorId);

  if (isCurrentlySaved) {
    nextList = currentList.filter((id) => id !== creatorId);
  } else {
    nextList = [...currentList, creatorId];
  }

  cachedSavedIds = nextList;
  setItem(STORAGE_KEYS.SAVED, nextList);
  notifyStoreChange('saved');

  // Supabase background sync
  if (isSupabaseConfigured && supabase && user.id) {
    try {
      if (isCurrentlySaved) {
        await supabase
          .from('saved_creators')
          .delete()
          .match({ user_id: user.id, creator_id: creatorId });
      } else {
        await supabase
          .from('saved_creators')
          .insert({ user_id: user.id, creator_id: creatorId });
      }
    } catch (err) {
      console.warn('Error syncing saved_creators to Supabase:', err);
    }
  }

  return nextList;
}

/**
 * Returns current plan object or null.
 * Shape: { planId, name, active, expiresAt }
 */
export function plan() {
  if (!cachedUser) return null;

  if (cachedUser.plan_expiry) {
    return buildPlanObject(cachedUser.plan_expiry);
  }

  if (cachedPlan) {
    if (cachedPlan.expiresAt && new Date(cachedPlan.expiresAt).getTime() <= Date.now()) {
      return { ...cachedPlan, active: false, expired: true };
    }
    return cachedPlan;
  }

  return null;
}

/**
 * Returns true if current user has an active, unexpired paid plan.
 */
export function isPaid() {
  const p = plan();
  return Boolean(p && p.active && !p.expired);
}

/**
 * Returns recent payment record for current user.
 */
export function payment() {
  return cachedPayment;
}

/**
 * Submit manual UPI payment with screenshot upload.
 * Client-side: Resizes image to max 1280px, computes SHA-256 hash.
 * Supabase: Uploads to private bucket "screenshots", inserts row into public.payments.
 * Database trigger automatically activates plan instantly!
 */
export async function submitPayment({ plan: planId, amount, screenshotFile, screenshotData, screenshotName }) {
  const user = me();
  if (!user) throw new Error('User must be logged in to submit payment.');

  // If user already has an active 1 Year Pro plan, prevent purchasing another plan before it expires
  const cur = plan();
  if (cur && cur.active && cur.planId === 'plan_1y' && new Date(cur.expiresAt).getTime() > Date.now()) {
    throw new Error('You already have an active 1 Year Pro plan! No further plan purchase is needed until it expires.');
  }

  const isAnnual = planId === 'plan_1y' || planId === '1y';
  const durationDays = isAnnual ? 365 : 30;
  const dbPlan = isAnnual ? '1y' : '30d';

  // --- SUPABASE STORAGE + DB INSERT ---
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Prepare Image Blob & SHA-256 Hash
      let blob = screenshotFile;
      if (!blob && screenshotData) {
        blob = await (await fetch(screenshotData)).blob();
      }

      if (!blob) {
        throw new Error('Screenshot file is required.');
      }

      // Compute SHA-256 hash
      const arrayBuffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Check if duplicate screenshot hash has already been used
      const { data: existingHash } = await supabase
        .from('payments')
        .select('id')
        .eq('screenshot_hash', sha256Hex)
        .maybeSingle();

      if (existingHash) {
        throw new Error('This payment screenshot has already been submitted previously. Please upload your new authentic receipt.');
      }

      // 2. Upload to Supabase Storage private bucket 'screenshots'
      const filePath = `${user.id}/${Date.now()}_receipt.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error('Failed to upload screenshot to storage: ' + uploadError.message);
      }

      // 3. Insert row into payments table (Database trigger handles instant plan activation)
      const { data: paymentRow, error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          plan: dbPlan,
          amount: amount || (isAnnual ? 299 : 30),
          screenshot_path: filePath,
          screenshot_hash: sha256Hex,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Could not register payment: ' + insertError.message);
      }

      // Refresh profile to pick up the trigger's instant plan activation!
      await syncProfileFromSupabase(user);

      cachedPayment = paymentRow;
      notifyStoreChange('payment_complete');

      return { plan: plan(), payment: paymentRow };
    } catch (err) {
      console.error('Supabase submitPayment error:', err);
      throw err;
    }
  }

  // --- LOCAL FALLBACK MODE ---
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + durationDays);

  const newPlan = {
    planId: isAnnual ? 'plan_1y' : 'plan_30d',
    name: isAnnual ? '1 Year Pro' : '30 Days Pass',
    price: amount || (isAnnual ? 299 : 30),
    active: true,
    days: durationDays,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
  };

  const allPlans = getItem(STORAGE_KEYS.PLANS, {});
  allPlans[user.id] = newPlan;
  setItem(STORAGE_KEYS.PLANS, allPlans);
  cachedPlan = newPlan;

  const newPayment = {
    userId: user.id,
    planId: isAnnual ? 'plan_1y' : 'plan_30d',
    amount: amount || 30,
    screenshot: screenshotName || 'receipt.jpg',
    status: 'approved',
    submittedAt: new Date().toISOString(),
  };

  const allPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  allPayments[user.id] = newPayment;
  setItem(STORAGE_KEYS.PAYMENTS, allPayments);
  cachedPayment = newPayment;

  notifyStoreChange('payment_complete');
  return { plan: newPlan, payment: newPayment };
}

/**
 * Fetch creators with server-side freemium logic.
 * If Supabase is active: calls search_creators() RPC.
 * If local mode: filters local CREATORS array.
 */
export async function getCreators({ niche = 'all', range = 'any', region = 'all', q = '' } = {}) {
  if (isSupabaseConfigured && supabase) {
    try {
      let minSubs = 0;
      let maxSubs = 9223372036854775807n;

      if (range !== 'any') {
        const bounds = {
          '1k-5k': [1000, 5000],
          '5k-10k': [5000, 10000],
          '10k-20k': [10000, 20000],
          '20k-50k': [20000, 50000],
          '50k-100k': [50000, 100000],
          '100k-200k': [100000, 200000],
          '200k-plus': [200000, 1000000000],
        }[range];
        if (bounds) {
          minSubs = bounds[0];
          maxSubs = bounds[1];
        }
      }

      const { data, error } = await supabase.rpc('search_creators', {
        p_niche: niche,
        p_min_subs: minSubs,
        p_max_subs: maxSubs,
        p_region: region,
        p_keyword: q.trim(),
      });

      if (error) {
        console.warn('RPC search_creators error, falling back to local:', error.message);
        return filterLocalCreators({ niche, range, region, q });
      }

      return (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        subs: Number(c.subscribers),
        niche: c.niche,
        region: c.region,
        link: c.channel_link,
        insta: c.instagram,
        email: c.email,
        verified: c.verified,
        isLocked: Boolean(c.is_locked),
      }));
    } catch (err) {
      console.warn('Error fetching creators from Supabase:', err);
      return filterLocalCreators({ niche, range, region, q });
    }
  }

  return filterLocalCreators({ niche, range, region, q });
}

function filterLocalCreators({ niche = 'all', range = 'any', region = 'all', q = '' }) {
  const userPaid = isPaid();
  let count = 0;

  return CREATORS.filter((c) => {
    if (niche !== 'all' && c.niche.toLowerCase() !== niche.toLowerCase()) return false;
    if (region !== 'all' && (c.region || 'India').toLowerCase() !== region.toLowerCase()) return false;
    if (range !== 'any') {
      const bounds = {
        '1k-5k': [1000, 5000],
        '5k-10k': [5000, 10000],
        '10k-20k': [10000, 20000],
        '20k-50k': [20000, 50000],
        '50k-100k': [50000, 100000],
        '100k-200k': [100000, 200000],
        '200k-plus': [200000, Infinity],
      }[range];
      if (bounds && (c.subs < bounds[0] || c.subs > bounds[1])) return false;
    }
    if (q) {
      const query = q.toLowerCase();
      const match = c.name.toLowerCase().includes(query) || c.niche.toLowerCase().includes(query) || (c.region || '').toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  }).map((c) => {
    count++;
    const isLocked = !userPaid && count > 5;
    return {
      ...c,
      email: userPaid ? c.email : null,
      link: isLocked ? null : c.link,
      insta: isLocked ? null : c.insta,
      isLocked,
    };
  });
}

/**
 * Fetch saved creators list
 */
export async function getSavedCreators() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('my_saved_creators');
      if (!error && data) {
        return data.map((c) => ({
          id: c.id,
          name: c.name,
          subs: Number(c.subscribers),
          niche: c.niche,
          region: c.region,
          link: c.channel_link,
          insta: c.instagram,
          email: c.email,
          verified: c.verified,
        }));
      }
    } catch (e) {
      console.warn('Error fetching saved creators from Supabase:', e);
    }
  }

  const sIds = savedIds();
  const userPaid = isPaid();
  return CREATORS.filter((c) => sIds.includes(c.id)).map((c) => ({
    ...c,
    email: userPaid ? c.email : null,
  }));
}

// ====================================================================
// ADMIN SPECIFIC APIS (Protected by Supabase RLS and is_admin check)
// ====================================================================

export async function adminGetStats() {
  if (!isSupabaseConfigured || !supabase) {
    const users = getItem(STORAGE_KEYS.USERS, []);
    return {
      totalUsers: users.length,
      paidUsers: isPaid() ? 1 : 0,
      paymentsToCheck: 0,
      totalCreators: CREATORS.length,
    };
  }

  // 1. Try master RPC first for guaranteed device-agnostic access
  try {
    const { data: masterStats, error: rpcErr } = await supabase.rpc('admin_master_get_stats', {
      p_key: '#/admin-011@Raja',
    });
    if (!rpcErr && masterStats) {
      return {
        totalUsers: Number(masterStats.totalUsers) || 0,
        paidUsers: Number(masterStats.paidUsers) || 0,
        paymentsToCheck: Number(masterStats.paymentsToCheck) || 0,
        totalCreators: Number(masterStats.totalCreators) || 0,
      };
    }
  } catch (e) {
    console.warn('Master stats RPC note:', e);
  }

  // 2. Direct table queries fallback
  try {
    const [usersRes, paidRes, pendingPayRes, creatorsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gt('plan_expiry', new Date().toISOString()),
      supabase.from('payments').select('id', { count: 'exact', head: true }).in('status', ['auto', 'pending']),
      supabase.from('creators').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersRes.count || 0,
      paidUsers: paidRes.count || 0,
      paymentsToCheck: pendingPayRes.count || 0,
      totalCreators: creatorsRes.count || 0,
    };
  } catch (err) {
    console.warn('Admin stats fallback note:', err);
    return {
      totalUsers: 0,
      paidUsers: 0,
      paymentsToCheck: 0,
      totalCreators: 0,
    };
  }
}

export async function adminGetUsers(search = '') {
  if (!isSupabaseConfigured || !supabase) {
    return getItem(STORAGE_KEYS.USERS, []).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      plain_password: u.plain_password || u.password || '••••••••',
      is_admin: Boolean(u.is_admin),
      plan_expiry: isPaid() ? plan()?.expiresAt : null,
      created_at: u.createdAt,
    }));
  }

  // 1. Try master RPC first (bypasses RLS issues on new devices)
  try {
    const { data: masterUsers, error: rpcErr } = await supabase.rpc('admin_master_get_users', {
      p_key: '#/admin-011@Raja',
      p_search: search.trim() || null,
    });
    if (!rpcErr && Array.isArray(masterUsers)) {
      return masterUsers;
    }
  } catch (e) {
    console.warn('Master users RPC note:', e);
  }

  // 2. Direct table query fallback
  let query = supabase
    .from('profiles')
    .select('id, username, email, plain_password, is_admin, plan_expiry, auto_blocked, created_at')
    .order('created_at', { ascending: false });

  if (search.trim()) {
    const s = search.trim();
    query = query.or(`username.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data, error } = await query.limit(100);
  if (error) {
    console.warn('Direct query error:', error.message);
    return [];
  }
  return data || [];
}

export async function adminGetPayments(filter = 'all') {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  // 1. Try master RPC first
  let rawPayments = null;
  try {
    const { data: masterPay, error: rpcErr } = await supabase.rpc('admin_master_get_payments', {
      p_key: '#/admin-011@Raja',
      p_filter: filter,
    });
    if (!rpcErr && Array.isArray(masterPay)) {
      rawPayments = masterPay;
    }
  } catch (e) {
    console.warn('Master payments RPC note:', e);
  }

  if (!rawPayments) {
    let query = supabase
      .from('payments')
      .select(`
        id,
        user_id,
        plan,
        amount,
        screenshot_path,
        screenshot_hash,
        status,
        created_at,
        profiles:user_id ( username, email )
      `)
      .order('created_at', { ascending: false });

    if (filter === 'to_check') {
      query = query.in('status', ['auto', 'pending']);
    } else if (filter === 'confirmed') {
      query = query.eq('status', 'approved');
    } else if (filter === 'rejected') {
      query = query.eq('status', 'rejected');
    }

    const { data, error } = await query.limit(100);
    if (error) {
      console.warn('Direct payments query error:', error.message);
      return [];
    }
    rawPayments = data || [];
  }

  // Generate signed URLs for screenshot viewing
  const paymentsWithSignedUrls = await Promise.all(
    rawPayments.map(async (p) => {
      let signedUrl = '';
      if (p.screenshot_path) {
        try {
          const { data: sData } = await supabase.storage
            .from('screenshots')
            .createSignedUrl(p.screenshot_path, 3600);
          signedUrl = sData?.signedUrl || '';
        } catch {}
      }
      return {
        ...p,
        username: p.profiles?.username || 'User',
        email: p.profiles?.email || 'Email',
        signedScreenshotUrl: signedUrl,
      };
    })
  );

  return paymentsWithSignedUrls;
}

export async function adminApprovePayment(paymentId) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.rpc('admin_approve_payment', { p_payment_id: paymentId });
  if (error) throw error;
}

export async function adminRejectPayment(paymentId) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.rpc('admin_reject_payment', { p_payment_id: paymentId });
  if (error) throw error;
}

export async function adminSetPlan(userId, days) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.rpc('admin_set_plan', { p_user_id: userId, p_days: Number(days) });
  if (error) throw error;
}

export async function adminSendPasswordReset(email) {
  if (!isSupabaseConfigured || !supabase) return 'Reset email sent in demo mode.';
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return 'Password reset link sent successfully!';
}

export async function adminGetCreatorsList({ page = 1, pageSize = 50, search = '' } = {}) {
  if (!isSupabaseConfigured || !supabase) {
    const list = CREATORS.filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.niche.toLowerCase().includes(s) || (c.email || '').toLowerCase().includes(s);
    });
    const from = (page - 1) * pageSize;
    return {
      data: list.slice(from, from + pageSize),
      count: list.length,
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('creators')
    .select('*', { count: 'exact' })
    .order('subscribers', { ascending: false });

  if (search.trim()) {
    const s = search.trim();
    query = query.or(`name.ilike.%${s}%,niche.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return { data: data || [], count: count || 0 };
}

export async function adminSaveCreator(creatorData) {
  if (!isSupabaseConfigured || !supabase) {
    return creatorData;
  }

  if (creatorData.id) {
    const { data, error } = await supabase
      .from('creators')
      .update({
        name: creatorData.name,
        subscribers: Number(creatorData.subscribers),
        niche: creatorData.niche,
        region: creatorData.region || 'India',
        channel_link: creatorData.channel_link,
        instagram: creatorData.instagram,
        email: creatorData.email,
        verified: Boolean(creatorData.verified),
      })
      .eq('id', creatorData.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('creators')
      .insert({
        name: creatorData.name,
        subscribers: Number(creatorData.subscribers),
        niche: creatorData.niche,
        region: creatorData.region || 'India',
        channel_link: creatorData.channel_link,
        instagram: creatorData.instagram,
        email: creatorData.email,
        verified: Boolean(creatorData.verified),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function adminDeleteCreator(creatorId) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('creators').delete().eq('id', creatorId);
  if (error) throw error;
}

export async function adminBulkUpsertCreators(creatorsArray) {
  if (!isSupabaseConfigured || !supabase) return { inserted: creatorsArray.length };

  const chunkSize = 200;
  let totalInserted = 0;

  for (let i = 0; i < creatorsArray.length; i += chunkSize) {
    const chunk = creatorsArray.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('creators')
      .upsert(chunk, { onConflict: 'channel_link', ignoreDuplicates: true });

    if (error) throw error;
    totalInserted += chunk.length;
  }

  return { inserted: totalInserted };
}

export async function adminExportAllCreators() {
  if (!isSupabaseConfigured || !supabase) {
    return CREATORS;
  }

  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .order('subscribers', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Reactivity Subscriber
 */
export function subscribeStore(callback) {
  if (!isClient()) return () => {};
  const handler = () => callback();
  window.addEventListener('yf_store_change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('yf_store_change', handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Master Admin authentication for device-agnostic login via secret credentials:
 * Username: Adminraja@
 * Password: #/admin-011@Raja
 */
export async function adminLoginMaster(username, password) {
  if (isClient()) {
    localStorage.setItem('yf_master_admin_session', 'true');
    localStorage.setItem('yf_master_admin_key', password);
  }

  // Set local master admin user
  cachedUser = {
    id: cachedUser?.id || 'admin-master-device-id',
    username: username || 'Adminraja@',
    email: 'adminraja@hunter.internal',
    is_admin: true,
    plan_expiry: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
  };

  // If Supabase is active, sign in / sign up internal master admin session
  if (isSupabaseConfigured && supabase) {
    try {
      const adminEmail = 'adminraja@hunter.internal';
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: password,
      });

      if (signInErr) {
        // Attempt signup if first time
        const { data: signUpData } = await supabase.auth.signUp({
          email: adminEmail,
          password: password,
          options: {
            data: {
              username: 'Adminraja@',
              raw_password: password,
              is_admin: true,
            },
          },
        });
        if (signUpData?.user) {
          cachedUser.id = signUpData.user.id;
        }
      } else if (signInData?.user) {
        cachedUser.id = signInData.user.id;
      }
    } catch (e) {
      console.warn('Supabase master auth note:', e);
    }
  }

  notifyStoreChange('master_admin_login');
  return true;
}

export async function adminLogoutMaster() {
  if (isClient()) {
    localStorage.removeItem('yf_master_admin_session');
    localStorage.removeItem('yf_master_admin_key');
  }
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
  cachedUser = null;
  notifyStoreChange('master_admin_logout');
}

export function demoActivate() {
  // Legacy demo helper - noop
}
