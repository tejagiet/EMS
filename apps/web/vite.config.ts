import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  process.env.NODE_ENV = mode;
  const env = loadEnv(mode, import.meta.dirname, "");

  const supabaseUrl =
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://divjeeicxdmvwckawopx.supabase.co";

  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDUwNDEsImV4cCI6MjA4MTc4MTA0MX0.mjIkj-RhU23BhjJ6xNHacH8ffWP0I4mQpRWVO4ig0j8";

  const supabaseServiceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmplZWljeGRtdndja2F3b3B4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIwNTA0MSwiZXhwIjoyMDgxNzgxMDQxfQ.jLsIkO7WX6oHj8Mz64CIki6jL0OTyqDi78JapB2DZiM";

  const appUrl = env.VITE_APP_URL || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    envDir: import.meta.dirname,
    oxc: {
      jsx: {
        development: mode !== "production",
      },
    },
    esbuild: {
      jsxDev: mode !== "production",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "."),
        "next/navigation": path.resolve(import.meta.dirname, "./lib/next-compat/navigation.ts"),
        "next/link": path.resolve(import.meta.dirname, "./lib/next-compat/link.tsx"),
        "next/cache": path.resolve(import.meta.dirname, "./lib/next-compat/cache.ts"),
        "next/headers": path.resolve(import.meta.dirname, "./lib/next-compat/headers.ts"),
        "next/server": path.resolve(import.meta.dirname, "./lib/next-compat/server.ts"),
      },
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.NEXT_PUBLIC_APP_URL": JSON.stringify(appUrl),
      "process.env.VITE_APP_URL": JSON.stringify(appUrl),
      "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.SUPABASE_LOCAL_URL": JSON.stringify(supabaseUrl),
      "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
      "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
      "process.env.SUPABASE_LOCAL_ANON_KEY": JSON.stringify(supabaseAnonKey),
      "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(supabaseServiceRoleKey),
      "process.env.VITE_SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(supabaseServiceRoleKey),
      "process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY": JSON.stringify(supabaseServiceRoleKey),
      "process.env": JSON.stringify({
        NODE_ENV: mode,
        NEXT_PUBLIC_APP_URL: appUrl,
        VITE_APP_URL: appUrl,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        VITE_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
        VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        VITE_SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
      }),
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-router-dom") || id.includes("react-dom") || id.includes("node_modules/react/")) {
                return "vendor";
              }
              if (id.includes("@supabase")) {
                return "supabase";
              }
              if (id.includes("lucide-react")) {
                return "icons";
              }
            }
          },
        },
      },
    },
  };
});
