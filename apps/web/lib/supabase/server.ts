import { createClient as getBrowserClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Universal Supabase client for Vite SPA.
 * Resolves to the singleton browser Supabase client.
 */
export async function createClient(): Promise<SupabaseClient> {
  return getBrowserClient();
}
