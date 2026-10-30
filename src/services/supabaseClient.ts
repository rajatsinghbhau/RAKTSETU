import { createClient } from '@supabase/supabase-js';

// Production Supabase Fallback Credentials (ensures zero-downtime on Vercel or when .env is absent)
const DEFAULT_SUPABASE_URL = 'https://ebrjeajrkchfsifwbakg.supabase.co';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmplYWpya2NoZnNpZndiYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTk1NjcsImV4cCI6MjEwODQzNTU2N30.HWSzuM8D1WkKtCsYR_tHHQV6dewcs9R6MCwW1Jec7tg';
const DEFAULT_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmplYWpya2NoZnNpZndiYWtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5Mjg1OTU2NywiZXhwIjoyMTA4NDM1NTY3fQ.racXiXhskVfnM7zn1We-yuCiTwpex6Lq8eULUy8bC4Q';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon key is missing in environment configuration.');
}

// Client-side Supabase instance for browser session management & Realtime WebSockets
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Privileged Supabase instance for atomic clinical fulfillment & DB consistency
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
