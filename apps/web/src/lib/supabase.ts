import { createBrowserClient } from '@supabase/ssr';

// Get env vars with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client (will be empty during build, populated at runtime)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
