import { useState } from "react";
import type { AppPage } from "../types";

interface LoginFormProps {
  onNavigate: (page: AppPage) => void;
  onLoginSuccess: () => void;
}

export default function LoginForm({ onNavigate, onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!email || !password) return;
    setLoading(true);
    // Simulate auth — replace with real logic
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1200);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Back button */}
        <button className="auth-back-btn" onClick={() => onNavigate("welcome")}>
          ← Back
        </button>

        {/* Mini logo */}
        <div className="auth-logo-sm">
          <div className="auth-logo-dot">A</div>
          <span className="auth-logo-name">ahia</span>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your campus marketplace account.</p>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label">University Email</label>
          <input
            className="auth-input"
            type="email"
            placeholder="you@university.edu.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: "right", marginBottom: 20, marginTop: -8 }}>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.78rem",
              color: "var(--ahia-trust)",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          className="auth-btn primary"
          onClick={handleSubmit}
          disabled={loading}
          style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
        >
          {loading ? "Signing in…" : "Login →"}
        </button>

        {/* Trust row */}
        <div className="auth-trust-row">
          <div className="auth-trust-item">🔒 Privy Wallet</div>
          <div className="auth-trust-item">⚡ Gasless</div>
        </div>

        {/* Switch to signup */}
        <p className="auth-footer-text">
          Don't have an account?{" "}
          <button onClick={() => onNavigate("signup")}>Sign up free</button>
        </p>

      </div>
    </div>
  );
}
