import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug logging
console.log('🔍 Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Not set');
console.log('🔍 Supabase Key:', supabaseAnonKey ? '✓ Set' : '✗ Not set');

// Graceful fallback: create a dummy client if env vars not set
// This allows the app to load and show dashboard/UI
// Supabase features will fail gracefully when actually accessed
let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Supabase initialized successfully');
} else {
  console.error('❌ CRITICAL: Supabase env vars not found!');
  console.error('Please check .env.development has:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  VITE_SUPABASE_ANON_KEY=...');
  
  // Create a dummy client that returns proper error responses
  const createErrorResponse = (operation: string) => {
    return {
      data: null,
      error: new Error(`Supabase not configured - ${operation} failed`)
    };
  };

  supabase = {
    from: (table: string) => ({
      select: async () => createErrorResponse('select'),
      insert: async (data: any) => createErrorResponse('insert'),
      update: async (data: any) => createErrorResponse('update'),
      delete: async () => createErrorResponse('delete'),
      eq: function(col: string, val: any) { 
        this.column = col;
        this.value = val;
        return this; 
      },
      limit: function(n: number) { return this; },
      single: async function() { return createErrorResponse('single'); },
      order: function() { return this; },
      // Chain-able operations
      select: async function() { return createErrorResponse('select'); },
    }),
    rpc: async (fn: string, params: any) => createErrorResponse('rpc'),
    auth: {
      signUp: async () => createErrorResponse('signUp'),
      signInWithPassword: async () => createErrorResponse('signInWithPassword'),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: null }),
    }
  };
}

export { supabase };
