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

// 2. Direct fallback (Mobile phone par GitHub se directly edit karne ke liye ya GitHub Pages ke liye)
const DIRECT_SUPABASE_URL = 'https://tafzikffnbsqiigbmlpz.supabase.co';
const DIRECT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZnppa2ZmbmJzcWlpZ2JtbHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDE1MjAsImV4cCI6MjEwNzI3NzUyMH0.M4kfdP_ZoIWh9KjY50STZGcnIhtvnD82klLXAPaMABY';

// Clean URL in case user entered https://xyz.supabase.co/rest/v1/
function cleanSupabaseUrl(url) {
  if (!url) return '';
  let cleaned = url.trim();
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
}

const rawUrl = envUrl || DIRECT_SUPABASE_URL || '';
const supabaseUrl = cleanSupabaseUrl(rawUrl);
const supabaseAnonKey = (envAnonKey || DIRECT_SUPABASE_ANON_KEY || '').trim();

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
