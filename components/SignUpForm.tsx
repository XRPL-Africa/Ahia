import { useState } from "react";
import type { AppPage } from "../types";

const CAMPUSES = ["UNIBEN", "UNILAG", "UI", "UNN", "OAU", "UNIPORT", "ABU", "LASU"];

interface SignUpFormProps {
  onNavigate: (page: AppPage) => void;
  onSignupSuccess: () => void;
}

export default function SignUpForm({ onNavigate, onSignupSuccess }: SignUpFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [campus, setCampus] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!fullName || !email || !campus || !password) return;
    setLoading(true);
    // Simulate account creation — replace with real logic
    setTimeout(() => {
      setLoading(false);
      onSignupSuccess();
    }, 1400);
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

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">
          Join thousands of students trading safely on campus.
        </p>

        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label">Full Name</label>
          <input
            className="auth-input"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

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

        {/* Campus */}
        <div className="auth-field">
          <label className="auth-label">Campus</label>
          <select
            className="auth-select"
            value={campus}
            onChange={(e) => setCampus(e.target.value)}
            aria-label="Select your campus"
          >
            <option value="">Select your campus</option>
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
          />
        </div>

        {/* Terms note */}
        <p style={{
          fontSize: "0.72rem",
          color: "var(--ahia-text-3)",
          marginBottom: 16,
          lineHeight: 1.6,
        }}>
          By signing up you agree to Ahia's{" "}
          <span style={{ color: "var(--ahia-trust)", cursor: "pointer" }}>Terms of Service</span>{" "}
          and{" "}
          <span style={{ color: "var(--ahia-trust)", cursor: "pointer" }}>Privacy Policy</span>.
        </p>

        {/* Submit */}
        <button
          className="auth-btn primary"
          onClick={handleSubmit}
          disabled={loading}
          style={loading ? { opacity: 0.7, cursor: "not-allowed" } : {}}
        >
          {loading ? "Creating account…" : "Create Account →"}
        </button>

        {/* Trust row */}
        <div className="auth-trust-row">
          <div className="auth-trust-item">🔒 Safety-Lock™ Escrow</div>
          <div className="auth-trust-item">⚡ Gasless Wallet</div>
        </div>

        {/* Switch to login */}
        <p className="auth-footer-text">
          Already have an account?{" "}
          <button onClick={() => onNavigate("login")}>Login</button>
        </p>

      </div>
    </div>
  );
}
