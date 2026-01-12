import { createClient } from '@supabase/supabase-js';

// Get env vars - Vite automatically exposes VITE_* variables
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Strip quotes if present (sometimes .env files have quotes)
if (supabaseUrl.startsWith('"') || supabaseUrl.startsWith("'")) {
  supabaseUrl = supabaseUrl.slice(1, -1);
}
if (supabaseAnonKey.startsWith('"') || supabaseAnonKey.startsWith("'")) {
  supabaseAnonKey = supabaseAnonKey.slice(1, -1);
}

// Debug: Show what we got
console.log('🔍 [supabaseClient] Checking environment variables...');
console.log('   VITE_SUPABASE_URL available:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('   VITE_SUPABASE_ANON_KEY available:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('   Final supabaseUrl:', supabaseUrl.substring(0, 30) + (supabaseUrl.length > 30 ? '...' : ''));
console.log('   Final supabaseAnonKey length:', supabaseAnonKey.length);

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ [supabaseClient] Supabase initialized successfully with URL:', supabaseUrl);
  } catch (error) {
    console.error('❌ [supabaseClient] Failed to initialize Supabase:', error);
    supabase = createDummyClient();
  }
} else {
  console.error('❌ [supabaseClient] CRITICAL ERROR: Supabase env vars not found!');
  console.error('   VITE_SUPABASE_URL: ' + (supabaseUrl || 'NOT SET'));
  console.error('   VITE_SUPABASE_ANON_KEY: ' + (supabaseAnonKey || 'NOT SET'));
  console.error('   Please ensure .env.development contains these variables');
  supabase = createDummyClient();
}

// Create dummy client for when Supabase is not configured
function createDummyClient() {
  const errorResponse = (op: string) => ({
    data: null,
    error: new Error(`Supabase not configured - ${op} failed`)
  });

  return {
    from: (table: string) => ({
      select: async () => errorResponse('select'),
      insert: async (data: any) => errorResponse('insert'),
      update: async (data: any) => errorResponse('update'),
      delete: async () => errorResponse('delete'),
      eq: function(col: string, val: any) { return this; },
      limit: function(n: number) { return this; },
      single: async function() { return errorResponse('single'); },
      order: function() { return this; },
    }),
    rpc: async (fn: string, params: any) => errorResponse('rpc'),
    auth: {
      signUp: async () => errorResponse('signUp'),
      signInWithPassword: async () => errorResponse('signInWithPassword'),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: null }),
      getUser: async () => ({ data: null, error: null }),
    }
  };
}

export { supabase };
