import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const getSupabaseMode = () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return 'service_role';
  if (process.env.VITE_SUPABASE_ANON_KEY) return 'anon';
  return 'missing';
};
