import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ebrjeajrkchfsifwbakg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVicmplYWpya2NoZnNpZndiYWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4NTk1NjcsImV4cCI6MjEwODQzNTU2N30.HWSzuM8D1WkKtCsYR_tHHQV6dewcs9R6MCwW1Jec7tg';

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

// Client-safe alias for transactional procedures
export const supabaseAdmin = supabase;
