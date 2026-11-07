import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AuthenticatedUserContext, PortalRole } from "@ems/types";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  context: AuthenticatedUserContext | null;
  loading: boolean;
  refreshContext: () => Promise<AuthenticatedUserContext | null>;
  switchRole: (role: PortalRole) => void;
  switchOrganization: (orgId: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<AuthenticatedUserContext | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshContext = useCallback(async () => {
    try {
      const userCtx = await getCurrentUserContext();
      setContext(userCtx);
      return userCtx;
    } catch (err) {
      console.error("[AuthProvider] Failed to fetch user context:", err);
      setContext(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContext();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      refreshContext();
    });

    const handleRefreshEvent = () => {
      refreshContext();
    };
    window.addEventListener("ems:refresh", handleRefreshEvent);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("ems:refresh", handleRefreshEvent);
    };
  }, [refreshContext]);

  const switchRole = useCallback((role: PortalRole) => {
    localStorage.setItem("ems_active_role", role);
    document.cookie = `ems_active_role=${role}; path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("ems:refresh"));
  }, []);

  const switchOrganization = useCallback((orgId: string) => {
    localStorage.setItem("ems_active_org_id", orgId);
    localStorage.removeItem("ems_active_role");
    document.cookie = `ems_active_org_id=${orgId}; path=/; SameSite=Lax`;
    document.cookie = `ems_active_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    window.dispatchEvent(new CustomEvent("ems:refresh"));
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("ems_active_org_id");
    localStorage.removeItem("ems_active_role");
    setContext(null);
    window.location.href = "/login?message=signed_out";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        context,
        loading,
        refreshContext,
        switchRole,
        switchOrganization,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      context: null,
      loading: true,
      refreshContext: async () => null,
      switchRole: () => {},
      switchOrganization: () => {},
      signOut: async () => {},
    };
  }
  return ctx;
}
