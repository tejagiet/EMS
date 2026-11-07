import { createClient } from "@supabase/supabase-js";
import { createClient as getClient } from "./client";

let adminClientInstance: ReturnType<typeof createClient> | null = null;

/**
 * Administrative Supabase client.
 * Uses the service role key to bypass Row Level Security (RLS) recursion
 * for authorized operations (e.g. employee creation, directory queries).
 */
export function createAdminClient() {
  const supabaseUrl =
    (typeof process !== "undefined" && (process.env?.NEXT_PUBLIC_SUPABASE_URL || process.env?.VITE_SUPABASE_URL)) ||
    "https://divjeeicxdmvwckawopx.supabase.co";

  const serviceRoleKey =
    (typeof process !== "undefined" && (process.env?.SUPABASE_SERVICE_ROLE_KEY || process.env?.VITE_SUPABASE_SERVICE_ROLE_KEY)) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwNTA0MSwiZXhwIjoyMDgxNzgxMDQxfQ.jLsIkO7WX6oHj8Mz64CIki6jL0OTyqDi78JapB2DZiM";

  if (serviceRoleKey) {
    if (!adminClientInstance) {
      adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return adminClientInstance;
  }

  return getClient();
}
