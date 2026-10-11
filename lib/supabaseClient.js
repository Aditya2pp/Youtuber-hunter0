/**
 * lib/supabaseClient.js
 * Safe Supabase client initialization.
 * Only uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Never service role key).
 * If keys are absent or placeholder, gracefully falls back to local demo mode.
 */
import { createClient } from '@supabase/supabase-js';

// 1. Environment variables (Vite build / GitHub Actions / Vercel)
const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const envAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

// 2. Direct fallback (Mobile phone par GitHub se directly edit karne ke liye)
const DIRECT_SUPABASE_URL = '';
const DIRECT_SUPABASE_ANON_KEY = '';

const supabaseUrl = envUrl || DIRECT_SUPABASE_URL || '';
const supabaseAnonKey = envAnonKey || DIRECT_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-id') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
