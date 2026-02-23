type StepStatus = "done" | "active" | "pending";

interface EscrowStep {
  status: StepStatus;
  label: string;
  sub: string;
  content: string;
}

const ESCROW_STEPS: EscrowStep[] = [
  { status: "done",    label: "Bid Accepted",  sub: "Today 10:14",    content: "✓" },
  { status: "done",    label: "Funds Locked",  sub: "RLUSD secured",  content: "✓" },
  { status: "active",  label: "Item Delivered",sub: "Pending confirm", content: "3" },
  { status: "pending", label: "Release Funds", sub: "Auto in 24h",    content: "4" },
  { status: "pending", label: "RLUSD Sent",    sub: "To your wallet", content: "5" },
];

export default function EscrowPanel() {
  return (
    <div className="escrow-panel fade-in delay-3">
      <div className="escrow-header">
        <div className="escrow-icon-wrap">🔐</div>
        <div>
          <div className="escrow-title">TI-84 Plus CE — Escrow #ESC-0082</div>
          <div className="escrow-sub">
            Buyer: @adeoye_k · 18.50 RLUSD locked · Started 2h ago
          </div>
        </div>
      </div>

      <div className="escrow-steps">
        {ESCROW_STEPS.map((step, i) => (
          <div key={i} className={`escrow-step ${step.status}`}>
            <div className={`step-circle ${step.status}`}>{step.content}</div>
            <div className="step-label">{step.label}</div>
            <div className="step-sub">{step.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
