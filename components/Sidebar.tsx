import {
  DashboardIcon,
  CartIcon,
  StarIcon,
  WalletNavIcon,
  DollarIcon,
  TrendIcon,
  UserIcon,
  SettingsIcon,
  DbIcon,
} from "../icons";

interface SidebarProps {
  onOpenOfframp: () => void;
}

export default function Sidebar({ onOpenOfframp }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="nav-section">
        <span className="nav-label">Main</span>
        <button className="nav-item active">
          <DashboardIcon /> Dashboard
        </button>
        <button className="nav-item">
          <CartIcon /> Browse Market <span className="nav-badge">24</span>
        </button>
        <button className="nav-item">
          <StarIcon /> My Bids
        </button>
      </div>

      <div className="nav-section">
        <span className="nav-label">Wallet</span>
        <button className="nav-item">
          <WalletNavIcon /> Wallet
        </button>
        <button className="nav-item" onClick={onOpenOfframp}>
          <DollarIcon /> Off-Ramp to Naira
        </button>
        <button className="nav-item">
          <TrendIcon /> Transaction History
        </button>
      </div>

      <div className="nav-section">
        <span className="nav-label">Account</span>
        <button className="nav-item">
          <UserIcon /> Profile
        </button>
        <button className="nav-item">
          <SettingsIcon /> Settings
        </button>
      </div>

      <div className="partition-bar">
        <DbIcon />
        <span className="partition-label">Shard</span>
        <span className="partition-value">campus_00412</span>
        <span className="partition-sep">·</span>
        <span className="partition-stat"><strong>3.2ms</strong> avg</span>
      </div>
    </aside>
  );
}
