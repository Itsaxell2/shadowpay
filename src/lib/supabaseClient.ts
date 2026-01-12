import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Graceful fallback: create a dummy client if env vars not set
// This allows the app to load and show dashboard/UI
// Supabase features will fail gracefully when actually accessed
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase initialized');
} else {
  console.warn('⚠️ Supabase env vars not set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). App will work in demo mode.');
  // Create a dummy client that will fail gracefully when accessed
  supabase = {
    from: () => ({
      select: async () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      update: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
      eq: function() { return this; },
      limit: function() { return this; },
      single: async function() { return { data: null, error: new Error('Supabase not configured') }; },
    }),
    auth: {
      signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: null }),
    }
  };
}

export { supabase };
