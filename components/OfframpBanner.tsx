interface OfframpBannerProps {
  liveRate: number;
  onConvert: () => void;
}

export default function OfframpBanner({ liveRate, onConvert }: OfframpBannerProps) {
  return (
    <div className="offramp-card fade-in delay-1">
      <div className="offramp-icon">🏦</div>
      <div className="offramp-content">
        <div className="offramp-title">Instant RLUSD → Naira Off-Ramp</div>
        <div className="offramp-desc">
          Convert your RLUSD earnings directly to your Nigerian bank account.
          Powered by YellowCard API. Settlement in 2–5 minutes.
        </div>
      </div>
      <div className="offramp-rate">
        <div className="rate-label">Live Rate</div>
        <div className="rate-value">₦{Math.round(liveRate).toLocaleString("en-NG")}</div>
        <div className="rate-sub">per 1 RLUSD</div>
      </div>
      <button className="offramp-btn" onClick={onConvert}>
        Convert Now →
      </button>
    </div>
  );
}
