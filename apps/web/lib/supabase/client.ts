import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-compatible Supabase client using public environment variables.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_LOCAL_URL ??
    "http://127.0.0.1:54321";

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_LOCAL_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
