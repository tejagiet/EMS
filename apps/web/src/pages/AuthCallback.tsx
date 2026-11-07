import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createClient } from "@/lib/supabase/client";

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") ?? "/portal";
      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          setTimeout(() => navigate("/login?error=auth_callback_failed"), 1500);
          return;
        }
      }

      // Check current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        navigate(next, { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background, #f8fafc)",
      }}
    >
      <div style={{ textAlign: "center", padding: 24 }}>
        {error ? (
          <div className="alert alert-error">
            Authentication error: {error}. Redirecting to sign in...
          </div>
        ) : (
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                border: "4px solid rgba(30, 58, 138, 0.2)",
                borderTopColor: "var(--primary, #1e3a8a)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px auto",
              }}
            />
            <p style={{ color: "var(--text-muted, #64748b)" }}>Finalizing authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
}
