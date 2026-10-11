/**
 * lib/store.js
 * Browser storage (localStorage) store for YouTuber Finder.
 * Clean, SSR-safe methods ready to be swapped with Supabase.
 */

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
    window.dispatchEvent(new CustomEvent('yf_store_change', { detail: { key } }));
  } catch (e) {
    console.error('Error writing localStorage key', key, e);
  }
}

function getUsers() {
  const users = getItem(STORAGE_KEYS.USERS, []);
  if (!users || users.length === 0) {
    // Seed an initial demo account
    const demoUser = {
      id: 'demo_user_1',
      username: 'aditya',
      email: 'aditya@example.com',
      password: 'password123',
      createdAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.USERS, [demoUser]);
    return [demoUser];
  }
  return users;
}

/**
 * Returns currently logged-in user or null.
 */
export function me() {
  return getItem(STORAGE_KEYS.CURRENT_USER, null);
}

/**
 * Sign up a new user.
 * Returns null on success or error string.
 */
export function signup({ username, email, password }) {
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

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  const users = getUsers();

  const userExists = users.some(
    (u) => u.username.toLowerCase() === cleanUser.toLowerCase()
  );
  if (userExists) {
    return 'Username is already taken. Please choose another.';
  }

  const emailExists = users.some(
    (u) => u.email.toLowerCase() === cleanEmail
  );
  if (emailExists) {
    return 'An account with this email already exists.';
  }

  const newUser = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    username: cleanUser,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);
  setItem(STORAGE_KEYS.CURRENT_USER, newUser);

  return null;
}

/**
 * Log in an existing user with username OR email.
 * Returns null on success or error string.
 */
export function login(id, password) {
  if (!id || !password) {
    return 'Please provide both identifier and password.';
  }

  const cleanId = id.trim().toLowerCase();
  const users = getUsers();

  const found = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.username.toLowerCase() === cleanId
  );

  if (!found) {
    return 'No account found with this email or username.';
  }

  if (found.password !== password) {
    return 'Incorrect password. Please try again.';
  }

  setItem(STORAGE_KEYS.CURRENT_USER, found);
  return null;
}

/**
 * Log out current user.
 */
export function logout() {
  if (!isClient()) return;
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('yf_store_change', { detail: { key: 'logout' } }));
  } catch (e) {
    console.error('Error logging out', e);
  }
}

/**
 * Returns array of saved creator IDs for current user.
 */
export function savedIds() {
  const user = me();
  if (!user) return [];
  const allSaved = getItem(STORAGE_KEYS.SAVED, {});
  return allSaved[user.id] || [];
}

/**
 * Toggle save state of a creator.
 * Returns new array of saved creator IDs.
 */
export function toggleSave(id) {
  const user = me();
  if (!user) return [];
  const allSaved = getItem(STORAGE_KEYS.SAVED, {});
  const currentList = allSaved[user.id] || [];

  let nextList;
  if (currentList.includes(id)) {
    nextList = currentList.filter((item) => item !== id);
  } else {
    nextList = [...currentList, id];
  }

  allSaved[user.id] = nextList;
  setItem(STORAGE_KEYS.SAVED, allSaved);
  return nextList;
}

/**
 * Returns current plan object or null.
 * Shape: { planId, name, price, active, expiresAt }
 */
export function plan() {
  const user = me();
  if (!user) return null;
  const allPlans = getItem(STORAGE_KEYS.PLANS, {});
  const userPlan = allPlans[user.id];

  if (!userPlan) return null;

  if (userPlan.expiresAt) {
    const isExpired = new Date(userPlan.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return { ...userPlan, active: false, expired: true };
    }
  }

  return userPlan;
}

/**
 * Returns true if current user has an active, unexpired paid plan.
 */
export function isPaid() {
  const currentPlan = plan();
  if (!currentPlan) return false;
  return Boolean(currentPlan.active);
}

/**
 * Returns recent payment record for current user.
 */
export function payment() {
  const user = me();
  if (!user) return null;
  const allPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  return allPayments[user.id] || null;
}

/**
 * Submit manual UPI payment - activates user plan instantly upon screenshot upload.
 */
export function submitPayment({ plan: planId, amount, screenshot }) {
  const user = me();
  if (!user) throw new Error('User must be logged in to submit payment.');

  const isAnnual = planId === 'plan_1y';
  const durationDays = isAnnual ? 365 : 30;

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + durationDays);

  // 1. Instantly activate plan
  const allPlans = getItem(STORAGE_KEYS.PLANS, {});
  const newPlan = {
    planId: planId || 'plan_30d',
    name: isAnnual ? '1 Year Pro' : '30 Days Pass',
    price: amount || 30,
    active: true,
    days: durationDays,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
  };
  allPlans[user.id] = newPlan;
  setItem(STORAGE_KEYS.PLANS, allPlans);

  // 2. Record payment with screenshot
  const allPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  const newPayment = {
    userId: user.id,
    planId: planId || 'plan_30d',
    amount: amount || 30,
    screenshot: screenshot || null,
    status: 'approved',
    submittedAt: new Date().toISOString(),
  };
  allPayments[user.id] = newPayment;
  setItem(STORAGE_KEYS.PAYMENTS, allPayments);

  return { plan: newPlan, payment: newPayment };
}

/**
 * Quick demo activation method for previewing paid view.
 * Activates plan for specified days (defaults to 30).
 */
export function demoActivate(days = 30) {
  const user = me();
  if (!user) return null;

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + Number(days));

  const allPlans = getItem(STORAGE_KEYS.PLANS, {});
  const activatedPlan = {
    planId: days > 60 ? 'plan_1y' : 'plan_30d',
    name: days > 60 ? '1 Year Pro (Demo)' : '30 Days Pass (Demo)',
    active: true,
    days,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresDate.toISOString(),
  };

  allPlans[user.id] = activatedPlan;
  setItem(STORAGE_KEYS.PLANS, allPlans);

  // Mark any pending payment as approved for demo
  const allPayments = getItem(STORAGE_KEYS.PAYMENTS, {});
  if (allPayments[user.id]) {
    allPayments[user.id] = {
      ...allPayments[user.id],
      status: 'approved',
      verifiedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.PAYMENTS, allPayments);
  }

  return activatedPlan;
}

/**
 * Helper hook or subscriber for reactive UI components
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
