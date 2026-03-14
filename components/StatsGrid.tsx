interface StatCardProps {
  icon: string;
  iconColor: "orange" | "blue" | "green";
  label: string;
  value: string;
  sub: string;
  animationClass?: string;
}

function StatCard({ icon, iconColor, label, value, sub, animationClass = "" }: StatCardProps) {
  return (
    <div className={`stat-card ${animationClass}`}>
      <div className={`stat-icon ${iconColor}`}>{icon}</div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}

export default function StatsGrid() {
  return (
    <div className="stats-grid">
      <StatCard
        icon="🛒"
        iconColor="orange"
        label="Active Bids"
        value="3"
        sub="2 pending · 1 in escrow"
        animationClass="fade-in delay-1"
      />
      <StatCard
        icon="✅"
        iconColor="green"
        label="Completed"
        value="17"
        sub="This semester · 100% rated"
        animationClass="fade-in delay-2"
      />
      <StatCard
        icon="🔒"
        iconColor="blue"
        label="In Escrow"
        value="₦28,500"
        sub="Awaiting 1 delivery confirm"
        animationClass="fade-in delay-3"
      />
    </div>
  );
}
