import { APP_NAME } from "@ems/config";
import { LoginForm } from "./LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    message?: string;
    error?: string;
    redirectTo?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  let initialError: string | undefined = undefined;
  if (params.error === "session_expired") {
    initialError = "Your session has expired. Please sign in again.";
  } else if (params.error === "auth_callback_failed") {
    initialError = "Authentication link was invalid or has expired.";
  } else if (params.error) {
    initialError = params.error;
  }

  return (
    <main className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <img
              src="/logo.jpg"
              alt="EMS Logo"
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                objectFit: "cover",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
          <h1>{APP_NAME}</h1>
          <p>Sign in with your institutional or corporate credentials</p>
        </div>

        <LoginForm
          initialMessage={params.message}
          initialError={initialError}
          redirectTo={params.redirectTo}
        />
      </div>
    </main>
  );
}
