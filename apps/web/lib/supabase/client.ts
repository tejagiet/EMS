import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let clientInstance: SupabaseClient | null = null;

const CLOUD_SUPABASE_URL = "https://divjeeicxdmvwckawopx.supabase.co";
const CLOUD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDUwNDEsImV4cCI6MjA4MTc4MTA0MX0.mjIkj-RhU23BhjJ6xNHacH8ffWP0I4mQpRWVO4ig0j8";

/**
 * Creates a browser-compatible Supabase client using public environment variables.
 * In Vite, variables are read from import.meta.env or process.env, with cloud production fallbacks.
 */
export function createClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  let envSupabaseUrl = "";
  let envSupabaseAnonKey = "";

  try {
    const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
    if (metaEnv) {
      envSupabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || "";
      envSupabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    }
  } catch {
    // ignore
  }

  if (!envSupabaseUrl && typeof process !== "undefined" && process.env) {
    envSupabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_LOCAL_URL ||
      "";
    envSupabaseAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_LOCAL_ANON_KEY ||
      "";
  }

  // Ensure valid URL scheme
  let supabaseUrl = envSupabaseUrl.trim();
  if (!supabaseUrl.startsWith("http://") && !supabaseUrl.startsWith("https://")) {
    supabaseUrl = CLOUD_SUPABASE_URL;
  }

  const supabaseAnonKey = envSupabaseAnonKey.trim() || CLOUD_ANON_KEY;

  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });

  return clientInstance;
}
