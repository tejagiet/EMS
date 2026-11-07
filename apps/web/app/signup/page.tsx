import { SignupForm } from "./SignupForm";

export default function SignupPage(): React.JSX.Element {
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
          <h1>Institutional Access Portal</h1>
          <p>Personnel and faculty credential provisioning is managed by institutional administrators</p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
