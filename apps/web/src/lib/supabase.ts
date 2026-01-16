import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from '@cooked/shared';

const { url, anonKey } = getSupabaseConfig();

export const supabase = createBrowserClient(url, anonKey);
