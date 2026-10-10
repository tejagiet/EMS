import { createClient } from "@supabase/supabase-js";

/**
 * Creates an administrative Supabase client using the SERVICE_ROLE key.
 * This client bypasses PostgreSQL Row Level Security (RLS) and is strictly
 * intended for authorized server-side actions, background operations, and
 * server component queries where permissions have already been verified.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_LOCAL_URL ??
    "http://127.0.0.1:54321";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
