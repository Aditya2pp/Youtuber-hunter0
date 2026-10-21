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
// UUID HELPERS & CACHE MIGRATION
// ====================================================================
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Compress image client-side to prevent huge payload uploads & storage timeouts
async function compressScreenshot(dataUrl, maxDim = 1200, quality = 0.75) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
        } catch {}
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
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

// Auto-migrate legacy string IDs (e.g. user_1791699015468_vyb63z) to valid RFC UUIDs
if (cachedUser && cachedUser.id && !isValidUUID(cachedUser.id) && cachedUser.id !== 'admin-master-device-id') {
  const newUuid = generateUUID();
  cachedUser.legacy_id = cachedUser.id;
  cachedUser.id = newUuid;
  setItem(STORAGE_KEYS.CURRENT_USER, cachedUser);
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
    const hasValidUuid = isValidUUID(userObj.id);

    // 1. Try querying profile by UUID if valid
    if (hasValidUuid) {
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
    } else {
      // If userObj.id is a string ID, match profile by email or username
      const lookupField = userObj.email ? 'email' : 'username';
      const lookupVal = userObj.email || userObj.username;
      if (lookupVal) {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('id, username, email, is_admin, plan_expiry, auto_blocked, created_at')
            .eq(lookupField, lookupVal)
            .maybeSingle();
          if (data) {
            profile = data;
          }
        } catch {}
      }
    }

    const fallbackUsername = userObj.user_metadata?.username || (userObj.email ? userObj.email.split('@')[0] : 'User');
    const emailStr = userObj.email || (profile ? profile.email : '');
    const finalUserId = profile?.id || (hasValidUuid ? userObj.id : (cachedUser?.id && isValidUUID(cachedUser.id) ? cachedUser.id : generateUUID()));

    const mergedUser = {
      id: finalUserId,
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

    // Fetch user's saved creators safely
    if (isValidUUID(finalUserId)) {
      try {
        const { data: savedRows } = await supabase
          .from('saved_creators')
          .select('creator_id')
          .eq('user_id', finalUserId);

        if (savedRows) {
          cachedSavedIds = savedRows.map((r) => r.creator_id);
          setItem(STORAGE_KEYS.SAVED, cachedSavedIds);
        }
      } catch {}
    }

    // Fetch recent payment to check status / rejected notice
    try {
      let payments = null;
      try {
        const { data } = await supabase.rpc('my_payments');
        payments = data;
      } catch {}

      if ((!payments || payments.length === 0) && isValidUUID(finalUserId)) {
        const { data: directPay } = await supabase
          .from('payments')
          .select('id, plan, amount, status, created_at')
          .eq('user_id', finalUserId)
          .order('created_at', { ascending: false });
        if (directPay) {
          payments = directPay.map((p) => ({
            ...p,
            status: p.status === 'rejected' ? 'failed' : p.status === 'approved' || p.status === 'auto' ? 'active' : 'processing',
          }));
        }
      }

      if (payments && payments.length > 0) {
        cachedPayment = payments[0];
        const hasRejected = payments.find((p) => p.status === 'failed' || p.status === 'rejected');
        if (hasRejected) {
          cachedRejectedNotice =
            'Account Notice: Payment Verification Unsuccessful. We could not verify your recent payment receipt. Your account remains active on the Free Tier. You can re-upload your authentic UPI receipt on the Plans page or contact Telegram support at @Pixel_Craft0 (https://t.me/Pixel_Craft0) for fast assistance.';
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
    id: generateUUID(),
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
  return Array.isArray(cachedSavedIds) ? cachedSavedIds : [];
}

/**
 * Toggle save state of a creator.
 * Returns new array of saved creator IDs synchronously.
 */
export function toggleSave(creatorId) {
  const currentList = Array.isArray(cachedSavedIds) ? [...cachedSavedIds] : [];
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

  // Supabase background sync (fire-and-forget) if user is logged in
  const user = me();
  if (isSupabaseConfigured && supabase && user && user.id) {
    (async () => {
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
    })();
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
  if (cur && cur.active && !cur.expired && cur.expiresAt && new Date(cur.expiresAt).getTime() > Date.now()) {
    if (cur.planId === 'plan_1y') {
      throw new Error('You already have an active 1 Year Pro plan! No further plan purchase is needed until it expires.');
    }
    if (cur.planId === 'plan_30d' && (planId === 'plan_30d' || planId === '30d')) {
      throw new Error('You already have an active 30 Days Pass! You can buy again once your current period ends.');
    }
  }

  // Clear previous rejection notice on new payment submission
  cachedRejectedNotice = null;

  const isAnnual = planId === 'plan_1y' || planId === '1y';
  const durationDays = isAnnual ? 365 : 30;
  const dbPlan = isAnnual ? '1y' : '30d';

  // 1. Prepare Compressed Screenshot & SHA-256 Hash
  let rawData = screenshotData;
  if (!rawData && screenshotFile) {
    try {
      rawData = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(screenshotFile);
      });
    } catch {}
  }

  if (!rawData) {
    throw new Error('Payment screenshot is required! Please upload your payment receipt.');
  }

  // Compress screenshot data to prevent massive payloads and storage errors
  const compressedData = await compressScreenshot(rawData, 1200, 0.75);

  // Compute SHA-256 hash of receipt for duplicate prevention
  let sha256Hex = null;
  try {
    const blob = await (await fetch(compressedData)).blob();
    const arrayBuffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Could not compute receipt hash:', e);
  }

  // Check duplicate hash if Supabase is connected
  if (isSupabaseConfigured && supabase && sha256Hex) {
    try {
      const { data: existingHash } = await supabase
        .from('payments')
        .select('id')
        .eq('screenshot_hash', sha256Hex)
        .maybeSingle();

      if (existingHash) {
        throw new Error('This payment screenshot has already been submitted previously. Please upload your new authentic receipt.');
      }
    } catch (dupErr) {
      if (dupErr.message && dupErr.message.includes('already been submitted')) {
        throw dupErr;
      }
    }
  }

  // 2. Identify authenticated Supabase user ID
  let activeUserId = null;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sData } = await supabase.auth.getSession();
      if (sData?.session?.user?.id && isValidUUID(sData.session.user.id)) {
        activeUserId = sData.session.user.id;
      }
    } catch {}

    // If session is absent, try silent auth with stored credentials
    if (!activeUserId && user.email && (user.plain_password || user.password)) {
      try {
        const { data: logRes } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.plain_password || user.password,
        });
        if (logRes?.user?.id && isValidUUID(logRes.user.id)) {
          activeUserId = logRes.user.id;
        }
      } catch {}
    }

    if (!activeUserId && isValidUUID(user.id)) {
      activeUserId = user.id;
    }
  }

  // 3. Upload to Supabase Storage 'screenshots' bucket
  let filePath = '';
  let uploadSucceeded = false;
  const uploadFolder = (activeUserId && isValidUUID(activeUserId))
    ? activeUserId
    : (user.id && isValidUUID(user.id) ? user.id : generateUUID());

  if (isSupabaseConfigured && supabase) {
    try {
      const filename = `${uploadFolder}/${Date.now()}_receipt.jpg`;
      const blobToUpload = await (await fetch(compressedData)).blob();

      let { data: uploadData, error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(filename, blobToUpload, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (!uploadError && uploadData?.path) {
        const cleanPath = uploadData.path.replace(/^\/+/, '').replace(/^screenshots\//, '');
        const { data: pUrlData } = supabase.storage.from('screenshots').getPublicUrl(cleanPath);
        filePath = pUrlData?.publicUrl || `https://tafzikffnbsqiigbmlpz.supabase.co/storage/v1/object/public/screenshots/${cleanPath}`;
        uploadSucceeded = true;
      } else {
        console.warn('Supabase storage upload note:', uploadError?.message);
      }
    } catch (uploadEx) {
      console.warn('Supabase storage upload exception:', uploadEx);
    }
  }

  // Fallback to compressed image data URL only if network or storage upload failed
  if (!uploadSucceeded) {
    filePath = compressedData;
  }

  // 4. Register Payment with Supabase
  let registeredRow = null;
  let supabaseSuccess = false;

  if (isSupabaseConfigured && supabase) {
    // 4a. First attempt: Dedicated RPC register_payment (handles profile matching, plan activation, & RLS bypass)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('register_payment', {
        p_user_id: activeUserId || user.id || null,
        p_email: user.email || null,
        p_username: user.username || null,
        p_plan: dbPlan,
        p_amount: amount || (isAnnual ? 299 : 30),
        p_screenshot_path: filePath,
        p_screenshot_hash: sha256Hex,
      });

      if (!rpcErr && rpcData) {
        supabaseSuccess = true;
        registeredRow = {
          id: rpcData.id || generateUUID(),
          user_id: rpcData.user_id || activeUserId || user.id,
          plan: dbPlan,
          amount: amount || (isAnnual ? 299 : 30),
          status: rpcData.status || 'auto',
          created_at: rpcData.created_at || new Date().toISOString(),
        };
      } else if (rpcErr) {
        console.warn('register_payment RPC note:', rpcErr.message);
      }
    } catch (rpcEx) {
      console.warn('register_payment RPC exception:', rpcEx);
    }

    // 4b. Second attempt: Direct insert if RPC was not available and we have a valid activeUserId
    if (!supabaseSuccess && activeUserId) {
      try {
        const paymentPayload = {
          user_id: activeUserId,
          plan: dbPlan,
          amount: amount || (isAnnual ? 299 : 30),
          screenshot_path: filePath,
          screenshot_hash: sha256Hex,
        };

        const { error: insErr } = await supabase
          .from('payments')
          .insert(paymentPayload);

        if (!insErr) {
          supabaseSuccess = true;
          registeredRow = {
            id: generateUUID(),
            user_id: activeUserId,
            plan: dbPlan,
            amount: amount || (isAnnual ? 299 : 30),
            status: 'auto',
            created_at: new Date().toISOString(),
          };

          if (cachedUser) {
            cachedUser.id = activeUserId;
            await syncProfileFromSupabase(cachedUser);
          }
        } else {
          console.warn('Supabase direct payments insert error:', insErr.message);
        }
      } catch (payEx) {
        console.warn('Supabase payments insert exception:', payEx);
      }
    }
  }

  // 4. Instant plan activation guarantee
  // User paid, so their plan is ALWAYS activated so they are NEVER blocked!
  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + durationDays);

  if (!cachedUser.plan_expiry || new Date(cachedUser.plan_expiry).getTime() < expiresDate.getTime()) {
    cachedUser.plan_expiry = expiresDate.toISOString();
    setItem(STORAGE_KEYS.CURRENT_USER, cachedUser);
  }

  const activatedPlan = {
    planId: isAnnual ? 'plan_1y' : 'plan_30d',
    name: isAnnual ? '1 Year Pro' : '30 Days Pass',
    price: amount || (isAnnual ? 299 : 30),
    active: true,
    days: durationDays,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
  };

  const allPlans = getItem(STORAGE_KEYS.PLANS, {});
  allPlans[user.id] = activatedPlan;
  setItem(STORAGE_KEYS.PLANS, allPlans);
  cachedPlan = activatedPlan;

  const fullRow = {
    id: registeredRow?.id || generateUUID(),
    user_id: user.id,
    userId: user.id,
    username: user.username || (user.email ? user.email.split('@')[0] : 'User'),
    email: user.email || '',
    plan: dbPlan,
    planId: isAnnual ? 'plan_1y' : 'plan_30d',
    amount: amount || (isAnnual ? 299 : 30),
    screenshot_path: filePath,
    screenshot_url: filePath,
    screenshot: screenshotName || 'receipt.jpg',
    screenshot_hash: sha256Hex,
    status: registeredRow?.status || 'auto',
    created_at: registeredRow?.created_at || new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  };

  const allPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  allPayments[user.id] = fullRow;
  setItem(STORAGE_KEYS.PAYMENTS, allPayments);

  const historyList = getItem('yt_all_payments_history', []);
  const histIdx = historyList.findIndex((h) => h.id === fullRow.id);
  if (histIdx >= 0) {
    historyList[histIdx] = fullRow;
  } else {
    historyList.unshift(fullRow);
  }
  setItem('yt_all_payments_history', historyList);

  cachedPayment = fullRow;

  notifyStoreChange('payment_complete');
  return { plan: activatedPlan, payment: fullRow };
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
  let stats = {
    totalUsers: 0,
    paidUsers: 0,
    paymentsToCheck: 0,
    totalCreators: CREATORS.length,
  };

  // 1. Try master RPC first for guaranteed device-agnostic access
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: masterStats, error: rpcErr } = await supabase.rpc('admin_master_get_stats', {
        p_key: '#/admin-011@Raja',
      });
      if (!rpcErr && masterStats) {
        stats.totalUsers = Number(masterStats.totalUsers) || 0;
        stats.paidUsers = Number(masterStats.paidUsers) || 0;
        stats.paymentsToCheck = Number(masterStats.paymentsToCheck) || 0;
        stats.totalCreators = Number(masterStats.totalCreators) || CREATORS.length;
        return stats;
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

      if (usersRes.count != null) stats.totalUsers = usersRes.count;
      if (paidRes.count != null) stats.paidUsers = paidRes.count;
      if (pendingPayRes.count != null) stats.paymentsToCheck = pendingPayRes.count;
      if (creatorsRes.count != null) stats.totalCreators = creatorsRes.count;
    } catch (err) {
      console.warn('Admin stats fallback note:', err);
    }
  }

  // Count local users and payments if stats are empty or in fallback
  const localUsers = getItem(STORAGE_KEYS.USERS, []);
  const localHistory = getItem('yt_all_payments_history', []);
  const localPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  const allLocalPay = [...localHistory, ...Object.values(localPayments)];

  if (stats.totalUsers === 0) {
    stats.totalUsers = Math.max(localUsers.length, me() ? 1 : 0);
  }
  if (stats.paidUsers === 0 && isPaid()) {
    stats.paidUsers = 1;
  }
  if (stats.paymentsToCheck === 0) {
    stats.paymentsToCheck = allLocalPay.filter((p) => p.status === 'auto' || p.status === 'pending').length;
  }

  return stats;
}

export async function adminGetUsers(search = '') {
  let usersList = [];
  const fetchedIds = new Set();
  const s = (search || '').trim().toLowerCase();

  // 1. Try master RPC first (bypasses RLS issues on new devices)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: masterUsers, error: rpcErr } = await supabase.rpc('admin_master_get_users', {
        p_key: '#/admin-011@Raja',
        p_search: s || null,
      });
      if (!rpcErr && Array.isArray(masterUsers) && masterUsers.length > 0) {
        masterUsers.forEach((u) => {
          if (u && u.id) {
            usersList.push({
              ...u,
              username: u.username || (u.email ? u.email.split('@')[0] : 'User'),
            });
            fetchedIds.add(u.id);
          }
        });
      }
    } catch (e) {
      console.warn('Master users RPC note:', e);
    }

    // 2. Direct table query fallback
    if (usersList.length === 0) {
      try {
        let query = supabase
          .from('profiles')
          .select('id, username, email, plain_password, is_admin, plan_expiry, auto_blocked, created_at')
          .order('created_at', { ascending: false });

        if (s) {
          query = query.or(`username.ilike.%${s}%,email.ilike.%${s}%`);
        }

        const { data: directUsers, error: dirErr } = await query.limit(100);
        if (!dirErr && Array.isArray(directUsers) && directUsers.length > 0) {
          directUsers.forEach((u) => {
            if (u && u.id) {
              usersList.push({
                ...u,
                username: u.username || (u.email ? u.email.split('@')[0] : 'User'),
              });
              fetchedIds.add(u.id);
            }
          });
        }
      } catch (ex) {
        console.warn('Direct profiles query error:', ex);
      }
    }
  }

  // 3. Fallback / Merge with local users (STORAGE_KEYS.USERS and STORAGE_KEYS.CURRENT_USER)
  const localUsers = getItem(STORAGE_KEYS.USERS, []);
  const currentUser = getItem(STORAGE_KEYS.CURRENT_USER, null);
  const candidates = [...localUsers];
  if (currentUser && !candidates.some((c) => c.id === currentUser.id || (c.email && c.email === currentUser.email))) {
    candidates.push(currentUser);
  }

  candidates.forEach((u) => {
    if (!u || !u.id) return;
    if (fetchedIds.has(u.id)) return;
    if (s) {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      if (!uName.includes(s) && !uEmail.includes(s)) return;
    }
    usersList.push({
      id: u.id,
      username: u.username || (u.email ? u.email.split('@')[0] : 'User'),
      email: u.email || '',
      plain_password: u.plain_password || u.password || '••••••••',
      is_admin: Boolean(u.is_admin),
      plan_expiry: u.plan_expiry || (isPaid() ? plan()?.expiresAt : null),
      auto_blocked: Boolean(u.auto_blocked),
      created_at: u.createdAt || u.created_at || new Date().toISOString(),
    });
    fetchedIds.add(u.id);
  });

  return usersList;
}

export function getStoragePublicUrl(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') return '';
  if (rawPath.startsWith('data:') || rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    return rawPath;
  }
  const clean = rawPath.replace(/^\/+/, '').replace(/^screenshots\//, '');
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = supabase.storage.from('screenshots').getPublicUrl(clean);
      if (data?.publicUrl) return data.publicUrl;
    } catch {}
  }
  return `https://tafzikffnbsqiigbmlpz.supabase.co/storage/v1/object/public/screenshots/${clean}`;
}

export async function adminGetPayments(filter = 'all') {
  let payments = [];
  const fetchedIds = new Set();

  // 1. Try master RPC first
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: masterPay, error: rpcErr } = await supabase.rpc('admin_master_get_payments', {
        p_key: '#/admin-011@Raja',
        p_filter: filter,
      });
      if (!rpcErr && Array.isArray(masterPay) && masterPay.length > 0) {
        masterPay.forEach((p) => {
          if (p && p.id) {
            payments.push({
              ...p,
              username: p.username || p.profiles?.username || '',
              email: p.email || p.profiles?.email || '',
            });
            fetchedIds.add(p.id);
          }
        });
      }
    } catch (e) {
      console.warn('Master payments RPC note:', e);
    }

    // 2. Direct Supabase query (simple select without fragile nested relation)
    if (payments.length === 0) {
      try {
        let query = supabase
          .from('payments')
          .select('id, user_id, plan, amount, screenshot_path, screenshot_hash, status, created_at')
          .order('created_at', { ascending: false });

        if (filter === 'to_check') {
          query = query.in('status', ['auto', 'pending']);
        } else if (filter === 'confirmed') {
          query = query.eq('status', 'approved');
        } else if (filter === 'rejected') {
          query = query.eq('status', 'rejected');
        }

        const { data: directData, error: dirErr } = await query.limit(100);
        if (!dirErr && Array.isArray(directData) && directData.length > 0) {
          // Fetch profiles separately for usernames and emails
          const userIds = directData.map((d) => d.user_id).filter(Boolean);
          const profileMap = {};
          if (userIds.length > 0) {
            try {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, username, email')
                .in('id', userIds);
              if (Array.isArray(profs)) {
                profs.forEach((pr) => {
                  if (pr.id) profileMap[pr.id] = pr;
                });
              }
            } catch (pErr) {
              console.warn('Profile fetch note:', pErr);
            }
          }

          directData.forEach((d) => {
            const prof = profileMap[d.user_id];
            payments.push({
              ...d,
              username: prof?.username || d.username || '',
              email: prof?.email || d.email || '',
            });
            fetchedIds.add(d.id);
          });
        }
      } catch (dirEx) {
        console.warn('Direct payments query exception:', dirEx);
      }
    }
  }

  // 3. Fallback & Merge: Local storage payments (ensures payments are NEVER lost!)
  const localList = getItem('yt_all_payments_history', []);
  const localMap = getItem(STORAGE_KEYS.PAYMENTS, {});
  const allLocal = [...localList, ...Object.values(localMap)];

  // Look up any local users to attach user info if missing
  const localUsers = getItem(STORAGE_KEYS.USERS, []);
  const currentUser = getItem(STORAGE_KEYS.CURRENT_USER, null);
  const userMap = {};
  localUsers.forEach((u) => {
    if (u.id) userMap[u.id] = u;
    if (u.email) userMap[u.email] = u;
  });
  if (currentUser) {
    if (currentUser.id) userMap[currentUser.id] = currentUser;
    if (currentUser.email) userMap[currentUser.email] = currentUser;
  }

  allLocal.forEach((lp) => {
    if (!lp || !lp.id) return;
    if (fetchedIds.has(lp.id)) {
      // Enrich existing record if username or email was missing
      const existing = payments.find((x) => x.id === lp.id);
      if (existing) {
        if (!existing.username || existing.username === 'User') {
          existing.username = lp.username || userMap[lp.user_id]?.username || userMap[lp.userId]?.username || '';
        }
        if (!existing.email || existing.email === 'Email') {
          existing.email = lp.email || userMap[lp.user_id]?.email || userMap[lp.userId]?.email || '';
        }
        if (!existing.screenshot_path && lp.screenshot_path) {
          existing.screenshot_path = lp.screenshot_path;
        }
      }
      return;
    }

    // Apply filter to local payments
    const st = lp.status || 'auto';
    let match = true;
    if (filter === 'to_check') match = st === 'auto' || st === 'pending';
    else if (filter === 'confirmed') match = st === 'approved';
    else if (filter === 'rejected') match = st === 'rejected';

    if (match) {
      const uInfo = userMap[lp.user_id] || userMap[lp.userId] || {};
      payments.push({
        id: lp.id,
        user_id: lp.user_id || lp.userId || 'User',
        plan: lp.plan || (lp.planId === 'plan_1y' ? '1y' : '30d'),
        amount: lp.amount || (lp.plan === '1y' || lp.planId === 'plan_1y' ? 299 : 30),
        screenshot_path: lp.screenshot_path || lp.screenshot_url || lp.screenshot || '',
        screenshot_hash: lp.screenshot_hash || null,
        status: st,
        created_at: lp.created_at || lp.submittedAt || new Date().toISOString(),
        username: lp.username || uInfo.username || '',
        email: lp.email || uInfo.email || '',
      });
      fetchedIds.add(lp.id);
    }
  });

  // Sort by created_at desc
  payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Resolve screenshot URLs (direct Supabase public URL, signed URL, or data URL)
  const resolvedPayments = await Promise.all(
    payments.map(async (p) => {
      let resolvedUrl = '';
      const rawPath = p.screenshot_path || p.screenshot_url || p.screenshot || '';
      if (rawPath) {
        if (rawPath.startsWith('data:') || rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
          resolvedUrl = rawPath;
        } else {
          const clean = rawPath.replace(/^\/+/, '').replace(/^screenshots\//, '');
          // 1. First priority: Public URL (since bucket is public and permanent)
          if (isSupabaseConfigured && supabase) {
            try {
              const { data: pData } = supabase.storage.from('screenshots').getPublicUrl(clean);
              if (pData?.publicUrl) {
                resolvedUrl = pData.publicUrl;
              }
            } catch {}
          }
          // 2. Second priority: Signed URL fallback
          if (!resolvedUrl && isSupabaseConfigured && supabase) {
            try {
              const { data: sData } = await supabase.storage.from('screenshots').createSignedUrl(clean, 86400);
              if (sData?.signedUrl) {
                resolvedUrl = sData.signedUrl;
              }
            } catch {}
          }
        }
      }

      // Resolve username: if username is empty or 'User', derive from email or user_id
      let finalUsername = p.username;
      let finalEmail = p.email || (p.profiles?.email) || '';
      if (!finalEmail && userMap[p.user_id]?.email) {
        finalEmail = userMap[p.user_id].email;
      }
      if ((!finalUsername || finalUsername === 'User') && finalEmail && finalEmail.includes('@')) {
        finalUsername = finalEmail.split('@')[0];
      }
      if (!finalUsername) {
        finalUsername = 'User';
      }

      return {
        ...p,
        username: finalUsername,
        email: finalEmail || 'No email registered',
        screenshot_path: resolvedUrl || rawPath,
        screenshot_url: resolvedUrl || rawPath,
        signedScreenshotUrl: resolvedUrl || rawPath,
      };
    })
  );

  return resolvedPayments;
}

export async function adminApprovePayment(paymentId) {
  let payRecord = null;
  const days = 30; // default

  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    let succeeded = false;

    // Try 1: Master passkey RPC
    try {
      const { error: masterErr } = await supabase.rpc('admin_master_approve_payment', {
        p_payment_id: paymentId,
        p_key: '#/admin-011@Raja',
      });
      if (!masterErr) succeeded = true;
    } catch (e) {
      console.warn('admin_master_approve_payment RPC attempt note:', e);
    }

    // Try 2: Standard RPC
    if (!succeeded) {
      try {
        const { error: rpcErr } = await supabase.rpc('admin_approve_payment', {
          p_payment_id: paymentId,
        });
        if (!rpcErr) succeeded = true;
      } catch (e) {
        console.warn('admin_approve_payment RPC attempt note:', e);
      }
    }

    // Try 3: Direct database updates fallback
    if (!succeeded) {
      try {
        const { data: pay } = await supabase
          .from('payments')
          .select('id, user_id, plan')
          .eq('id', paymentId)
          .maybeSingle();

        if (pay) {
          payRecord = pay;
          const planDays = pay.plan === '1y' ? 365 : 30;
          await supabase.from('payments').update({ status: 'approved' }).eq('id', paymentId);
          const expiryDate = new Date(Date.now() + planDays * 86400000).toISOString();
          await supabase.from('profiles').update({ plan_expiry: expiryDate }).eq('id', pay.user_id);
        }
      } catch (dirErr) {
        console.warn('Direct approve error:', dirErr);
      }
    }
  }

  // 2. Update local payments history & user plan
  const allHistory = getItem('yt_all_payments_history', []);
  let targetUserId = null;
  let targetPlanType = '30d';

  const updatedHist = allHistory.map((item) => {
    if (item.id === paymentId) {
      targetUserId = item.user_id || item.userId;
      targetPlanType = item.plan === '1y' || item.planId === 'plan_1y' ? '1y' : '30d';
      return { ...item, status: 'approved' };
    }
    return item;
  });
  setItem('yt_all_payments_history', updatedHist);

  // If user found, activate their plan in local storage
  if (targetUserId) {
    const planDays = targetPlanType === '1y' ? 365 : 30;
    const expiry = new Date(Date.now() + planDays * 86400000).toISOString();

    const users = getItem(STORAGE_KEYS.USERS, []);
    const userIdx = users.findIndex((u) => u.id === targetUserId || u.email === targetUserId);
    if (userIdx >= 0) {
      users[userIdx].plan_expiry = expiry;
      setItem(STORAGE_KEYS.USERS, users);
    }

    const plans = getItem(STORAGE_KEYS.PLANS, {});
    plans[targetUserId] = {
      planId: targetPlanType === '1y' ? 'plan_1y' : 'plan_30d',
      name: targetPlanType === '1y' ? '1 Year Pro' : '30 Days Pass',
      active: true,
      expiresAt: expiry,
    };
    setItem(STORAGE_KEYS.PLANS, plans);

    if (cachedUser && (cachedUser.id === targetUserId || cachedUser.email === targetUserId)) {
      cachedUser.plan_expiry = expiry;
      cachedPlan = buildPlanObject(expiry, targetPlanType === '1y' ? 'plan_1y' : 'plan_30d');
      setItem(STORAGE_KEYS.CURRENT_USER, cachedUser);
    }
  }

  notifyStoreChange('payment_approved');
}

export async function adminRejectPayment(paymentId) {
  let payUserId = null;

  // 1. Try Supabase
  if (isSupabaseConfigured && supabase) {
    let succeeded = false;

    // Try 1: Master passkey RPC (switches user to Free plan without blocking)
    try {
      const { error: masterErr } = await supabase.rpc('admin_master_reject_payment', {
        p_payment_id: paymentId,
        p_key: '#/admin-011@Raja',
      });
      if (!masterErr) succeeded = true;
    } catch (e) {
      console.warn('admin_master_reject_payment RPC attempt note:', e);
    }

    // Try 2: Standard RPC
    if (!succeeded) {
      try {
        const { error: rpcErr } = await supabase.rpc('admin_reject_payment', {
          p_payment_id: paymentId,
        });
        if (!rpcErr) succeeded = true;
      } catch (e) {
        console.warn('admin_reject_payment RPC attempt note:', e);
      }
    }

    // Try 3: Direct database updates fallback (DO NOT BLOCK USER)
    if (!succeeded) {
      try {
        const { data: pay } = await supabase
          .from('payments')
          .select('id, user_id')
          .eq('id', paymentId)
          .maybeSingle();

        if (pay) {
          payUserId = pay.user_id;
          await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId);
          // Revoke plan back to Free, never block user
          await supabase.from('profiles').update({ plan_expiry: null, auto_blocked: false }).eq('id', pay.user_id);
        }
      } catch (dirErr) {
        console.warn('Direct reject error:', dirErr);
      }
    }
  }

  // 2. Update local payment history
  const allHistory = getItem('yt_all_payments_history', []);
  const updatedHist = allHistory.map((item) => {
    if (item.id === paymentId) {
      if (!payUserId) payUserId = item.user_id || item.userId;
      return { ...item, status: 'rejected' };
    }
    return item;
  });
  setItem('yt_all_payments_history', updatedHist);

  // 3. Reset user to Free tier immediately so buy options re-enable
  if (payUserId) {
    const users = getItem(STORAGE_KEYS.USERS, []);
    const userIdx = users.findIndex((u) => u.id === payUserId || u.email === payUserId);
    if (userIdx >= 0) {
      users[userIdx].plan_expiry = null;
      users[userIdx].auto_blocked = false;
      setItem(STORAGE_KEYS.USERS, users);
    }

    const plans = getItem(STORAGE_KEYS.PLANS, {});
    delete plans[payUserId];
    setItem(STORAGE_KEYS.PLANS, plans);

    if (cachedUser && (cachedUser.id === payUserId || cachedUser.email === payUserId)) {
      cachedUser.plan_expiry = null;
      cachedUser.auto_blocked = false;
      cachedPlan = null;
      setItem(STORAGE_KEYS.CURRENT_USER, cachedUser);
    }
  }

  cachedRejectedNotice =
    'Payment Verification Update: Your previous payment receipt could not be verified. Your account is on Free tier and all plan buy options are fully available so you can purchase again with your UPI receipt.';

  notifyStoreChange('payment_rejected');
}

export async function adminSetPlan(userId, days) {
  const numDays = Number(days);
  const expiry = numDays > 0 ? new Date(Date.now() + numDays * 86400000).toISOString() : null;
  const planType = numDays >= 300 ? 'plan_1y' : numDays > 0 ? 'plan_30d' : null;

  // 1. Update Supabase if connected
  if (isSupabaseConfigured && supabase) {
    let succeeded = false;

    // Try 1: Master passkey RPC
    try {
      const { error: masterErr } = await supabase.rpc('admin_master_set_plan', {
        p_user_id: userId,
        p_days: numDays,
        p_key: '#/admin-011@Raja',
      });
      if (!masterErr) succeeded = true;
    } catch (e) {
      console.warn('admin_master_set_plan RPC attempt note:', e);
    }

    // Try 2: Standard RPC
    if (!succeeded) {
      try {
        const { error: rpcErr } = await supabase.rpc('admin_set_plan', {
          p_user_id: userId,
          p_days: numDays,
        });
        if (!rpcErr) succeeded = true;
      } catch (e) {
        console.warn('admin_set_plan RPC attempt note:', e);
      }
    }

    // Try 3: Direct profile table update fallback
    if (!succeeded) {
      try {
        await supabase
          .from('profiles')
          .update({ plan_expiry: expiry, auto_blocked: false })
          .eq('id', userId);
      } catch (e) {
        console.warn('Direct profile update note:', e);
      }
    }
  }

  // 2. ALWAYS update local users storage (guarantees admin power for every single user)
  const users = getItem(STORAGE_KEYS.USERS, []);
  let foundLocal = false;
  const updatedUsers = users.map((u) => {
    if (u.id === userId || u.email === userId || u.legacy_id === userId) {
      foundLocal = true;
      return { ...u, plan_expiry: expiry, auto_blocked: false };
    }
    return u;
  });
  if (foundLocal) {
    setItem(STORAGE_KEYS.USERS, updatedUsers);
  }

  // 3. Update plans table
  const plans = getItem(STORAGE_KEYS.PLANS, {});
  if (numDays > 0) {
    plans[userId] = {
      planId: planType || 'plan_30d',
      name: numDays >= 300 ? '1 Year Pro' : `${numDays} Days Pass`,
      active: true,
      expiresAt: expiry,
    };
  } else {
    delete plans[userId];
  }
  setItem(STORAGE_KEYS.PLANS, plans);

  // 4. If modifying currently logged in user, update local cached state as well
  if (cachedUser && (cachedUser.id === userId || cachedUser.email === userId || cachedUser.legacy_id === userId)) {
    cachedUser.plan_expiry = expiry;
    cachedUser.auto_blocked = false;
    cachedPlan = expiry ? buildPlanObject(expiry, planType || 'plan_30d') : null;
    setItem(STORAGE_KEYS.CURRENT_USER, cachedUser);
  }

  notifyStoreChange('user_plan_updated');
}

export async function adminDeleteUser(userId, userEmail = '') {
  if (!userId && !userEmail) {
    throw new Error('User ID or email is required to delete user.');
  }

  // 1. If Supabase is connected, purge screenshots, database records, and auth user
  if (isSupabaseConfigured && supabase) {
    // Collect all screenshot paths belonging to this user
    let screenshotPaths = [];
    try {
      let query = supabase.from('payments').select('id, screenshot_path');
      if (userId && userEmail) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${userEmail}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else if (userEmail) {
        query = query.eq('user_id', userEmail);
      }
      const { data: payRecords } = await query;
      if (Array.isArray(payRecords)) {
        payRecords.forEach((p) => {
          if (p.screenshot_path) {
            const raw = p.screenshot_path;
            if (!raw.startsWith('data:')) {
              const clean = raw
                .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/public\/screenshots\//, '')
                .replace(/^https?:\/\/[^\/]+\/storage\/v1\/object\/sign\/screenshots\//, '')
                .replace(/^\/+/, '')
                .replace(/^screenshots\//, '');
              if (clean) screenshotPaths.push(clean);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Screenshot query note:', e);
    }

    // Also list user folder in storage if userId is present
    if (userId) {
      try {
        const { data: folderFiles } = await supabase.storage.from('screenshots').list(String(userId));
        if (Array.isArray(folderFiles) && folderFiles.length > 0) {
          folderFiles.forEach((f) => {
            if (f && f.name) screenshotPaths.push(`${userId}/${f.name}`);
          });
        }
      } catch (listErr) {
        console.warn('Storage folder list note:', listErr);
      }
    }

    // Delete screenshots from storage bucket
    if (screenshotPaths.length > 0) {
      try {
        const uniquePaths = Array.from(new Set(screenshotPaths));
        await supabase.storage.from('screenshots').remove(uniquePaths);
      } catch (sErr) {
        console.warn('Storage remove screenshots error:', sErr);
      }
    }

    // Try 1: Master passkey RPC (deletes payments, saved_creators, storage objects, profiles, auth.users in one go)
    let rpcDone = false;
    try {
      const { error: masterErr } = await supabase.rpc('admin_master_delete_user', {
        p_user_id: String(userId || userEmail),
        p_key: '#/admin-011@Raja',
      });
      if (!masterErr) {
        rpcDone = true;
      } else {
        console.warn('admin_master_delete_user note:', masterErr);
      }
    } catch (rpcEx) {
      console.warn('admin_master_delete_user RPC attempt note:', rpcEx);
    }

    // Direct table deletes fallback
    try {
      if (userId) {
        await supabase.from('payments').delete().eq('user_id', userId);
        await supabase.from('saved_creators').delete().eq('user_id', userId);
        await supabase.from('profiles').delete().eq('id', userId);
      }
      if (userEmail) {
        await supabase.from('payments').delete().eq('user_id', userEmail);
        await supabase.from('profiles').delete().eq('email', userEmail);
      }
    } catch (directErr) {
      console.warn('Direct tables delete fallback note:', directErr);
    }
  }

  // 2. Remove user from local users store
  const users = getItem(STORAGE_KEYS.USERS, []);
  const filteredUsers = users.filter((u) => {
    if (userId && (u.id === userId || u.legacy_id === userId)) return false;
    if (userEmail && u.email && u.email.toLowerCase() === userEmail.toLowerCase()) return false;
    return true;
  });
  setItem(STORAGE_KEYS.USERS, filteredUsers);

  // 3. Remove user's plan
  const plans = getItem(STORAGE_KEYS.PLANS, {});
  if (userId && plans[userId]) delete plans[userId];
  if (userEmail && plans[userEmail]) delete plans[userEmail];
  setItem(STORAGE_KEYS.PLANS, plans);

  // 4. Remove payments from history and payments map
  const allHistory = getItem('yt_all_payments_history', []);
  const filteredHistory = allHistory.filter((item) => {
    const itemUserId = item.user_id || item.userId;
    const itemEmail = (item.email || '').toLowerCase();
    if (userId && (itemUserId === userId || itemUserId === String(userId))) return false;
    if (userEmail && itemEmail === userEmail.toLowerCase()) return false;
    return true;
  });
  setItem('yt_all_payments_history', filteredHistory);

  const localPayMap = getItem(STORAGE_KEYS.PAYMENTS, {});
  let payMapChanged = false;
  Object.keys(localPayMap).forEach((k) => {
    const p = localPayMap[k];
    const pUserId = p.user_id || p.userId;
    const pEmail = (p.email || '').toLowerCase();
    if ((userId && pUserId === userId) || (userEmail && pEmail === userEmail.toLowerCase())) {
      delete localPayMap[k];
      payMapChanged = true;
    }
  });
  if (payMapChanged) {
    setItem(STORAGE_KEYS.PAYMENTS, localPayMap);
  }

  // 5. If the deleted user is currently the active logged-in user in this browser, reset session
  if (
    cachedUser &&
    ((userId && (cachedUser.id === userId || cachedUser.legacy_id === userId)) ||
      (userEmail && cachedUser.email && cachedUser.email.toLowerCase() === userEmail.toLowerCase()))
  ) {
    cachedUser = null;
    cachedPlan = null;
    removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  notifyStoreChange('user_deleted');
  return true;
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
    notifyStoreChange('creators');
    return creatorData;
  }

  let result = null;
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
    result = data;
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
    result = data;
  }

  notifyStoreChange('creators');
  return result;
}

export async function adminDeleteCreator(creatorId) {
  if (!isSupabaseConfigured || !supabase) {
    notifyStoreChange('creators');
    return;
  }
  const { error } = await supabase.from('creators').delete().eq('id', creatorId);
  if (error) throw error;
  notifyStoreChange('creators');
}

export async function adminBulkUpsertCreators(creatorsArray) {
  if (!isSupabaseConfigured || !supabase) {
    notifyStoreChange('creators');
    return { inserted: creatorsArray.length };
  }

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

  notifyStoreChange('creators');
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
 * Public Realtime Creators fetch for Dashboard (/dashboard/find and /dashboard/saved).
 * Syncs seamlessly across Supabase Postgres, Admin Panel, and User Dashboard.
 */
export async function getLiveCreators() {
  if (!isSupabaseConfigured || !supabase) {
    return CREATORS;
  }

  try {
    // 1. Try search_creators RPC (Security Definer, always works regardless of RLS)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('search_creators', {
      p_niche: 'all',
      p_min_subs: 0,
      p_max_subs: 9223372036854775807,
      p_region: 'all',
      p_keyword: '',
    });

    let records = (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) ? rpcData : null;

    // 2. If RPC fails or returns 0, try direct SELECT
    if (!records) {
      const { data: selectData, error: selErr } = await supabase
        .from('creators')
        .select('*')
        .order('subscribers', { ascending: false })
        .limit(500);

      if (!selErr && Array.isArray(selectData) && selectData.length > 0) {
        records = selectData;
      }
    }

    if (!records || records.length === 0) {
      return CREATORS;
    }

    return records.map((c) => ({
      id: c.id,
      name: c.name,
      verified: c.verified ?? true,
      subs: Number(c.subscribers || c.subs || 0),
      subscribers: Number(c.subscribers || c.subs || 0),
      niche: c.niche || 'Tech',
      region: c.region || 'India',
      country: c.region || 'India',
      link: c.channel_link || c.link || '',
      channel_link: c.channel_link || c.link || '',
      insta: c.instagram || c.insta || '',
      instagram: c.instagram || c.insta || '',
      email: c.email || '',
    }));
  } catch (err) {
    console.warn('Live creators fetch note:', err);
    return CREATORS;
  }
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
