import { BellIcon } from "../icons";

interface TopbarProps {
  onNotifClick: () => void;
}

export default function Topbar({ onNotifClick }: TopbarProps) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div className="logo">
          ahia<span className="logo-sub">marketplace</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="campus-badge">🎓 University of Benin</div>
        <button type="button" title="Notifications" className="notif-btn" onClick={onNotifClick}>
          <BellIcon />
          <span className="notif-dot" />
        </button>
        <div className="avatar">AU</div>
      </div>
    </header>
  );
}
