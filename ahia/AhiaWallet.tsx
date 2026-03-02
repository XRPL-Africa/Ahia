import { useState, useEffect, useRef, useCallback } from "react";

import globalStyles from "./styles";
import { RATE_BASE, TOAST_CONFIGS, INITIAL_BIDS, TRANSACTIONS } from "./constants";
import { triggerHaptic, formatNaira } from "./utils";
import type { Bid, ToastState, ToastType, AppPage } from "./types";

// Auth pages
import WelcomeScreen from "./components/WelcomeScreen";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";

// Dashboard components
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import WalletCard from "./components/WalletCard";
import StatsGrid from "./components/StatsGrid";
import OfframpBanner from "./components/OfframpBanner";
import BidCard from "./components/BidCard";
import EscrowPanel from "./components/EscrowPanel";
import TransactionList from "./components/TransactionList";
import Toast from "./components/Toast";
import OfframpModal from "./components/OfframpModal";

// ============================================================
// DASHBOARD VIEW
// ============================================================
interface DashboardProps {
  onShowToast: (type: ToastType) => void;
  onOpenModal: () => void;
  rlusdBalance: number;
  liveRate: number;
  nairaBalance: string;
  bids: Bid[];
  onAcceptBid: (id: number) => void;
  onReleaseBid: (id: number) => void;
}

function Dashboard({
  onShowToast,
  onOpenModal,
  rlusdBalance,
  liveRate,
  nairaBalance,
  bids,
  onAcceptBid,
  onReleaseBid,
}: DashboardProps) {
  return (
    <div className="app-shell">
      <Topbar onNotifClick={() => onShowToast("escrow")} />
      <Sidebar onOpenOfframp={onOpenModal} />

      <main className="main-content">
        {/* Wallet + Stats */}
        <div className="wallet-section fade-in">
          <WalletCard
            rlusdBalance={rlusdBalance}
            liveRate={liveRate}
            nairaBalance={nairaBalance}
            onAddFunds={() => onShowToast("success")}
            onCashOut={onOpenModal}
          />
          <StatsGrid />
        </div>

        {/* Off-Ramp Banner */}
        <OfframpBanner liveRate={liveRate} onConvert={onOpenModal} />

        {/* Active Bids */}
        <div className="fade-in delay-2">
          <div className="section-header">
            <h2 className="section-title">Active Bids</h2>
            <button className="see-all">See All Listings →</button>
          </div>
          <div className="bids-grid">
            {bids.map((bid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onAccept={onAcceptBid}
                onRelease={onReleaseBid}
              />
            ))}
          </div>
        </div>

        {/* Escrow Status */}
        <div className="section-header fade-in delay-3">
          <h2 className="section-title">Escrow Status</h2>
          <button className="see-all">View Details →</button>
        </div>
        <EscrowPanel />

        {/* Transactions */}
        <TransactionList transactions={TRANSACTIONS} />
      </main>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function AhiaWallet() {
  const [page, setPage] = useState<AppPage>("welcome");
  const [rlusdBalance, setRlusdBalance] = useState(248.5);
  const [liveRate, setLiveRate] = useState(RATE_BASE);
  const [bids, setBids] = useState<Bid[]>(INITIAL_BIDS);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    vibrate: false,
    bar: "success",
    icon: "success",
    emoji: "🎉",
    title: "Bid Accepted!",
    sub: "RLUSD locked in Safety-Lock™ escrow.",
  });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vibrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live rate ticker (only active on dashboard)
  useEffect(() => {
    if (page !== "dashboard") return;
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * 4;
      setLiveRate(+(RATE_BASE + variation).toFixed(2));
    }, 8000);
    return () => clearInterval(interval);
  }, [page]);

  const showToast = useCallback((type: ToastType) => {
    const cfg = TOAST_CONFIGS[type];
    triggerHaptic(cfg.haptic);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (vibrateTimerRef.current) clearTimeout(vibrateTimerRef.current);

    setToast({
      show: true,
      vibrate: true,
      bar: cfg.bar,
      icon: cfg.icon,
      emoji: cfg.emoji,
      title: cfg.title,
      sub: cfg.sub,
    });

    vibrateTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, vibrate: false }));
    }, 450);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  const handleAcceptBid = (id: number) => {
    triggerHaptic([60, 30, 60]);
    setBids((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, statusTag: "In Escrow", statusClass: "escrow", actionState: "accepted" }
          : b
      )
    );
    setTimeout(() => showToast("success"), 600);
  };

  const handleReleaseBid = (id: number) => {
    triggerHaptic([40, 20, 40, 20, 160]);
    setBids((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, statusTag: "Complete", statusClass: "complete", actionState: "released" }
          : b
      )
    );
    showToast("escrow");
    setTimeout(() => {
      setRlusdBalance((prev) => +(prev + 18.5).toFixed(2));
    }, 800);
  };

  const handleOfframpSubmit = () => {
    setModalOpen(false);
    triggerHaptic([30, 20, 30]);
    showToast("escrow");
  };

  const nairaBalance = formatNaira(Math.round(rlusdBalance * liveRate));

  // ---- Page Router ----
  const renderPage = () => {
    switch (page) {
      case "welcome":
        return <WelcomeScreen onNavigate={setPage} />;

      case "login":
        return (
          <LoginForm
            onNavigate={setPage}
            onLoginSuccess={() => {
              setPage("dashboard");
              setTimeout(() => showToast("success"), 400);
            }}
          />
        );

      case "signup":
        return (
          <SignUpForm
            onNavigate={setPage}
            onSignupSuccess={() => {
              setPage("dashboard");
              setTimeout(() => showToast("warning"), 400);
            }}
          />
        );

      case "dashboard":
        return (
          <Dashboard
            onShowToast={showToast}
            onOpenModal={() => setModalOpen(true)}
            rlusdBalance={rlusdBalance}
            liveRate={liveRate}
            nairaBalance={nairaBalance}
            bids={bids}
            onAcceptBid={handleAcceptBid}
            onReleaseBid={handleReleaseBid}
          />
        );
    }
  };

  return (
    <>
      <style>{globalStyles}</style>
      {renderPage()}
      <Toast state={toast} />
      <OfframpModal
        open={modalOpen}
        liveRate={liveRate}
        onClose={() => setModalOpen(false)}
        onSubmit={handleOfframpSubmit}
      />
    </>
  );
}
