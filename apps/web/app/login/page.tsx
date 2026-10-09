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
