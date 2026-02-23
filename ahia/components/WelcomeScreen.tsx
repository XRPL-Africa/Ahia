import type { AppPage } from "../types";

interface WelcomeScreenProps {
  onNavigate: (page: AppPage) => void;
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className="auth-page">
      <div className="welcome-card">

        {/* Logo */}
        <div className="welcome-logo-wrap">A</div>

        {/* Campus badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div className="welcome-badge">
            🎓 For Nigerian Campus Students
          </div>
        </div>

        <h1 className="welcome-title">
          Welcome to <span>Ahia</span>
        </h1>
        <p className="welcome-subtitle">
          The safe, stablecoin-powered marketplace built<br />
          for university students across Nigeria.
        </p>

        {/* CTA buttons */}
        <div className="welcome-btn-group">
          <button className="auth-btn primary" onClick={() => onNavigate("login")}>
            Login to Your Account
          </button>
          <button className="auth-btn secondary" onClick={() => onNavigate("signup")}>
            Create a New Account
          </button>
        </div>

        {/* Trust indicators */}
        <div className="auth-trust-row" style={{ marginTop: 32 }}>
          <div className="auth-trust-item">🔒 Safety-Lock™ Escrow</div>
          <div className="auth-trust-item">⚡ Gasless Transactions</div>
          <div className="auth-trust-item">🏦 Instant Off-Ramp</div>
        </div>

      </div>
    </div>
  );
}
