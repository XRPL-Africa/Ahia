const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  :root {
    --ahia-primary-grad: linear-gradient(135deg, #FF7A00 0%, #FF4B4B 100%);
    --ahia-primary-grad-hover: linear-gradient(135deg, #FF8C1A 0%, #FF6060 100%);
    --ahia-sunset: #FF7A00;
    --ahia-trust: #0062FF;
    --ahia-success: #00C853;
    --ahia-warning: #FFB300;
    --ahia-danger: #FF3B30;
    --ahia-bg: #F8F9FA;
    --ahia-bg-2: #FFFFFF;
    --ahia-text: #1A1A1B;
    --ahia-text-2: #5C5C6E;
    --ahia-text-3: #9898A6;
    --ahia-border: rgba(0,0,0,0.07);
    --ahia-border-2: rgba(0,0,0,0.12);
    --radius-main: 12px;
    --radius-sm: 8px;
    --radius-lg: 20px;
    --radius-pill: 999px;
    --shadow-card: 0 4px 12px rgba(0,0,0,0.08);
    --shadow-elevated: 0 8px 32px rgba(0,0,0,0.12);
    --shadow-wallet: 0 20px 60px rgba(255,122,0,0.18);
    --transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    --font-display: 'Sora', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font-body);
    background: var(--ahia-bg);
    color: var(--ahia-text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app-shell {
    display: grid;
    grid-template-columns: 260px 1fr;
    grid-template-rows: auto 1fr;
    min-height: 100vh;
    max-width: 1320px;
    margin: 0 auto;
  }

  /* TOP BAR */
  .topbar {
    grid-column: 1 / -1;
    background: #fff;
    border-bottom: 1px solid var(--ahia-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  .logo {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.5rem;
    background: var(--ahia-primary-grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }
  .logo-sub {
    opacity: 0.6;
    font-weight: 400;
    font-size: 0.8rem;
    color: var(--ahia-text-3);
    -webkit-text-fill-color: var(--ahia-text-3);
    margin-left: 6px;
  }
  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .campus-badge {
    background: linear-gradient(135deg, #E8F0FF, #D0E2FF);
    color: var(--ahia-trust);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: var(--radius-pill);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--ahia-primary-grad);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 0.85rem;
    font-family: var(--font-display);
    cursor: pointer;
    border: 2px solid transparent;
    transition: var(--transition);
  }
  .avatar:hover { border-color: var(--ahia-sunset); transform: scale(1.05); }
  .notif-btn {
    width: 38px; height: 38px;
    border-radius: var(--radius-sm);
    background: var(--ahia-bg);
    border: 1px solid var(--ahia-border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; position: relative; transition: var(--transition);
  }
  .notif-btn:hover { background: #fff; box-shadow: var(--shadow-card); }
  .notif-dot {
    position: absolute; top: 7px; right: 7px;
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--ahia-danger);
    border: 2px solid white;
  }

  /* SIDEBAR */
  .sidebar {
    background: #fff;
    border-right: 1px solid var(--ahia-border);
    padding: 28px 0;
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }
  .nav-section { padding: 0 16px; margin-bottom: 8px; }
  .nav-label {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ahia-text-3);
    padding: 8px 12px 4px;
    display: block;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 14px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--ahia-text-2);
    text-decoration: none;
    margin-bottom: 2px;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    font-family: var(--font-body);
  }
  .nav-item:hover { background: var(--ahia-bg); color: var(--ahia-text); }
  .nav-item.active {
    background: linear-gradient(135deg, rgba(255,122,0,0.1) 0%, rgba(255,75,75,0.08) 100%);
    color: var(--ahia-sunset);
    font-weight: 600;
  }
  .nav-icon { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.7; }
  .nav-item.active .nav-icon { opacity: 1; }
  .nav-badge {
    margin-left: auto;
    background: var(--ahia-primary-grad);
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    min-width: 20px;
    text-align: center;
  }

  /* MAIN */
  .main-content { padding: 32px 28px; overflow-y: auto; }

  /* WALLET SECTION */
  .wallet-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 28px;
  }
  .wallet-card {
    background: linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
    border-radius: var(--radius-lg);
    padding: 28px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-wallet);
  }
  .wallet-card::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 200px; height: 200px;
    background: radial-gradient(circle, rgba(255,122,0,0.3) 0%, transparent 70%);
    border-radius: 50%;
  }
  .wallet-card::after {
    content: '';
    position: absolute;
    bottom: -40px; left: -40px;
    width: 160px; height: 160px;
    background: radial-gradient(circle, rgba(0,98,255,0.2) 0%, transparent 70%);
    border-radius: 50%;
  }
  .wallet-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    position: relative; z-index: 2;
  }
  .wallet-chip-badge {
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: var(--radius-pill);
    padding: 5px 12px;
    font-size: 0.7rem;
    color: rgba(255,255,255,0.8);
    font-weight: 600;
    letter-spacing: 0.05em;
    display: flex; align-items: center; gap: 6px;
  }
  .chip-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--ahia-success);
    animation: pulse-green 2s infinite;
  }
  @keyframes pulse-green {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }
  .privy-badge {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: var(--radius-pill);
    padding: 4px 10px;
    font-size: 0.65rem;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }
  .wallet-balance-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
    position: relative; z-index: 2;
  }
  .wallet-balance-main {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 4px;
    position: relative; z-index: 2;
  }
  .wallet-balance-main .currency {
    font-size: 1.2rem;
    font-weight: 500;
    opacity: 0.7;
    margin-right: 4px;
  }
  .wallet-balance-converted {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.45);
    margin-bottom: 24px;
    position: relative; z-index: 2;
  }
  .wallet-balance-converted strong { color: rgba(255,255,255,0.75); font-weight: 600; }
  .wallet-actions {
    display: flex;
    gap: 10px;
    position: relative; z-index: 2;
  }
  .wallet-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    font-family: var(--font-body);
  }
  .wallet-btn.primary { background: var(--ahia-primary-grad); color: white; }
  .wallet-btn.primary:hover { background: var(--ahia-primary-grad-hover); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(255,122,0,0.4); }
  .wallet-btn.ghost { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.12); }
  .wallet-btn.ghost:hover { background: rgba(255,255,255,0.14); color: white; }
  .wallet-address {
    position: relative; z-index: 2;
    margin-top: 18px;
    background: rgba(0,0,0,0.25);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .wallet-address-text {
    font-size: 0.7rem;
    color: rgba(255,255,255,0.35);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.03em;
  }
  .copy-btn {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: var(--transition);
    background: none; border: none;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-body);
  }
  .copy-btn:hover { color: white; background: rgba(255,255,255,0.1); }

  /* STAT CARDS */
  .stats-grid {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 14px;
  }
  .stat-card {
    background: #fff;
    border-radius: var(--radius-main);
    padding: 20px 22px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--ahia-border);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: var(--transition);
  }
  .stat-card:hover { box-shadow: var(--shadow-elevated); transform: translateY(-2px); }
  .stat-icon {
    width: 44px; height: 44px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  .stat-icon.orange { background: linear-gradient(135deg, rgba(255,122,0,0.12), rgba(255,75,75,0.08)); }
  .stat-icon.blue { background: linear-gradient(135deg, rgba(0,98,255,0.1), rgba(0,150,255,0.06)); }
  .stat-icon.green { background: linear-gradient(135deg, rgba(0,200,83,0.1), rgba(0,230,100,0.06)); }
  .stat-label { font-size: 0.72rem; color: var(--ahia-text-3); text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; margin-bottom: 3px; }
  .stat-value { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--ahia-text); }
  .stat-sub { font-size: 0.72rem; color: var(--ahia-text-3); margin-top: 1px; }

  /* SECTION HEADER */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--ahia-text);
  }
  .see-all {
    font-size: 0.8rem;
    color: var(--ahia-sunset);
    font-weight: 600;
    cursor: pointer;
    background: none; border: none;
    padding: 4px 0;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .see-all:hover { opacity: 0.7; }

  /* BID CARDS */
  .bids-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }
  .bid-card {
    background: #fff;
    border-radius: var(--radius-main);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--ahia-border);
    overflow: hidden;
    transition: var(--transition);
    cursor: pointer;
  }
  .bid-card:hover { box-shadow: var(--shadow-elevated); transform: translateY(-3px); }
  .bid-img {
    width: 100%; aspect-ratio: 16/10;
    position: relative;
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem;
  }
  .bid-status-tag {
    position: absolute; top: 10px; right: 10px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
  }
  .bid-status-tag.active { background: rgba(0,200,83,0.12); color: var(--ahia-success); border: 1px solid rgba(0,200,83,0.25); }
  .bid-status-tag.pending { background: rgba(255,179,0,0.12); color: var(--ahia-warning); border: 1px solid rgba(255,179,0,0.25); }
  .bid-status-tag.escrow { background: rgba(0,98,255,0.1); color: var(--ahia-trust); border: 1px solid rgba(0,98,255,0.2); }
  .bid-status-tag.complete { background: rgba(0,200,83,0.12); color: var(--ahia-success); border: 1px solid rgba(0,200,83,0.25); }
  .bid-body { padding: 14px 16px; }
  .bid-category { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ahia-text-3); font-weight: 600; margin-bottom: 4px; }
  .bid-name { font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: var(--ahia-text); margin-bottom: 10px; line-height: 1.3; }
  .bid-price-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .bid-price-label { font-size: 0.65rem; color: var(--ahia-text-3); font-weight: 600; margin-bottom: 2px; }
  .bid-price { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--ahia-text); }
  .bid-price .unit { font-size: 0.65rem; color: var(--ahia-text-3); margin-left: 3px; font-weight: 500; font-family: var(--font-body); }
  .bid-naira { font-size: 0.72rem; color: var(--ahia-text-3); margin-top: 1px; }
  .bid-timer {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--ahia-danger);
    display: flex; align-items: center; gap: 4px;
  }
  .timer-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ahia-danger); animation: blink 1s infinite; }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
  .bid-action-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .bid-action-row.full { grid-template-columns: 1fr; }
  .bid-btn {
    padding: 8px 0;
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    font-family: var(--font-body);
    text-align: center;
  }
  .bid-btn.accept { background: var(--ahia-primary-grad); color: white; }
  .bid-btn.accept:hover { transform: scale(1.02); box-shadow: 0 4px 14px rgba(255,122,0,0.35); }
  .bid-btn.accept:disabled { opacity: 0.7; cursor: default; transform: none; }
  .bid-btn.decline { background: var(--ahia-bg); color: var(--ahia-text-2); border: 1px solid var(--ahia-border); }
  .bid-btn.decline:hover { border-color: var(--ahia-border-2); background: #fff; }
  .bid-btn.release { background: linear-gradient(135deg, #0062FF, #0044CC); color: white; }
  .bid-btn.release:hover { transform: scale(1.01); box-shadow: 0 4px 14px rgba(0,98,255,0.35); }
  .bid-btn.release:disabled { opacity: 0.7; cursor: default; transform: none; }

  /* ESCROW PANEL */
  .escrow-panel {
    background: #fff;
    border-radius: var(--radius-main);
    box-shadow: var(--shadow-card);
    border: 1px solid var(--ahia-border);
    padding: 20px 22px;
    margin-bottom: 28px;
  }
  .escrow-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .escrow-icon-wrap {
    width: 40px; height: 40px;
    border-radius: var(--radius-sm);
    background: linear-gradient(135deg, rgba(0,98,255,0.1), rgba(0,150,255,0.06));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .escrow-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; }
  .escrow-sub { font-size: 0.75rem; color: var(--ahia-text-3); }
  .escrow-steps { display: flex; align-items: center; }
  .escrow-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
  }
  .escrow-step:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 18px;
    left: 50%;
    width: 100%;
    height: 2px;
    background: var(--ahia-border);
    z-index: 0;
  }
  .escrow-step.done:not(:last-child)::after { background: var(--ahia-success); }
  .escrow-step.active:not(:last-child)::after { background: linear-gradient(90deg, var(--ahia-success), var(--ahia-border)); }
  .step-circle {
    width: 36px; height: 36px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    position: relative; z-index: 1;
    transition: var(--transition);
  }
  .step-circle.done { background: var(--ahia-success); color: white; }
  .step-circle.active { background: var(--ahia-trust); color: white; animation: ring-pulse 2s infinite; }
  .step-circle.pending { background: var(--ahia-bg); color: var(--ahia-text-3); border: 2px solid var(--ahia-border); }
  @keyframes ring-pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(0,98,255,0.15); }
    50% { box-shadow: 0 0 0 8px rgba(0,98,255,0.08); }
  }
  .step-label { font-size: 0.68rem; font-weight: 600; color: var(--ahia-text-2); margin-top: 8px; }
  .step-sub { font-size: 0.62rem; color: var(--ahia-text-3); margin-top: 2px; }

  /* TRANSACTIONS */
  .tx-list { display: flex; flex-direction: column; gap: 1px; }
  .tx-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 16px;
    background: #fff;
    transition: var(--transition);
    cursor: pointer;
    border-radius: 0;
  }
  .tx-row:first-child { border-radius: var(--radius-main) var(--radius-main) 0 0; }
  .tx-row:last-child { border-radius: 0 0 var(--radius-main) var(--radius-main); }
  .tx-row:hover { background: var(--ahia-bg); }
  .tx-row + .tx-row { border-top: 1px solid var(--ahia-border); }
  .tx-icon {
    width: 38px; height: 38px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
  }
  .tx-body { flex: 1; min-width: 0; }
  .tx-name { font-size: 0.855rem; font-weight: 600; color: var(--ahia-text); }
  .tx-meta { font-size: 0.72rem; color: var(--ahia-text-3); margin-top: 2px; }
  .tx-amount { text-align: right; flex-shrink: 0; }
  .tx-amount .value { font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; }
  .tx-amount .value.credit { color: var(--ahia-success); }
  .tx-amount .value.debit { color: var(--ahia-text); }
  .tx-amount .fiat { font-size: 0.68rem; color: var(--ahia-text-3); margin-top: 1px; }

  /* OFF-RAMP */
  .offramp-card {
    background: linear-gradient(135deg, #F0F7FF 0%, #E8F3FF 100%);
    border: 1px solid rgba(0,98,255,0.12);
    border-radius: var(--radius-main);
    padding: 22px 24px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .offramp-icon {
    width: 52px; height: 52px;
    background: var(--ahia-trust);
    border-radius: var(--radius-main);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  .offramp-content { flex: 1; }
  .offramp-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--ahia-text); margin-bottom: 4px; }
  .offramp-desc { font-size: 0.8rem; color: var(--ahia-text-2); line-height: 1.5; }
  .offramp-rate { text-align: right; flex-shrink: 0; }
  .rate-label { font-size: 0.68rem; color: var(--ahia-text-3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; margin-bottom: 2px; }
  .rate-value { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--ahia-trust); }
  .rate-sub { font-size: 0.68rem; color: var(--ahia-text-3); margin-top: 1px; }
  .offramp-btn {
    background: var(--ahia-trust);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .offramp-btn:hover { background: #0054E0; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,98,255,0.3); }

  /* TOAST */
  .haptic-toast {
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%) translateY(120px);
    background: white;
    border-radius: var(--radius-main);
    padding: 14px 20px;
    box-shadow: var(--shadow-elevated);
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 1000;
    min-width: 300px;
    border: 1px solid var(--ahia-border);
  }
  .haptic-toast.show { transform: translateX(-50%) translateY(0); }
  .haptic-toast-icon {
    width: 38px; height: 38px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  }
  .haptic-toast-icon.success { background: rgba(0,200,83,0.1); }
  .haptic-toast-icon.escrow { background: rgba(0,98,255,0.1); }
  .haptic-toast-body { flex: 1; }
  .haptic-toast-title { font-weight: 700; font-size: 0.875rem; color: var(--ahia-text); }
  .haptic-toast-sub { font-size: 0.75rem; color: var(--ahia-text-3); margin-top: 2px; }
  .haptic-indicator { width: 4px; height: 32px; border-radius: var(--radius-pill); }
  .haptic-indicator.success { background: var(--ahia-success); }
  .haptic-indicator.escrow { background: var(--ahia-trust); }
  @keyframes hapticShake {
    0%, 100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
    10% { transform: translateX(-50%) translateY(0) rotate(-1deg); }
    20% { transform: translateX(-50%) translateY(0) rotate(1deg); }
    30% { transform: translateX(-50%) translateY(0) rotate(-0.5deg); }
    40% { transform: translateX(-50%) translateY(0) rotate(0.5deg); }
    50% { transform: translateX(-50%) translateY(0) rotate(0deg); }
  }
  .haptic-toast.vibrate { animation: hapticShake 0.4s ease-out; }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease;
  }
  .modal-overlay.open { opacity: 1; pointer-events: all; }
  .modal {
    background: white;
    border-radius: var(--radius-lg);
    padding: 32px;
    width: 440px;
    max-width: 90vw;
    transform: scale(0.92) translateY(20px);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 30px 80px rgba(0,0,0,0.2);
  }
  .modal-overlay.open .modal { transform: scale(1) translateY(0); }
  .modal-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  .modal-title { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; }
  .modal-close {
    width: 32px; height: 32px;
    border-radius: var(--radius-sm);
    background: var(--ahia-bg);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem;
    transition: var(--transition);
  }
  .modal-close:hover { background: #eee; }
  .modal-input-wrap { position: relative; margin-bottom: 16px; }
  .modal-label { font-size: 0.78rem; font-weight: 600; color: var(--ahia-text-2); margin-bottom: 6px; display: block; }
  .modal-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--ahia-border-2);
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--ahia-text);
    background: var(--ahia-bg);
    outline: none;
    transition: var(--transition);
  }
  .modal-input:focus { border-color: var(--ahia-sunset); background: white; }
  .modal-input.error { border-color: var(--ahia-danger); }
  .modal-input-suffix {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--ahia-text-3);
    pointer-events: none;
  }
  .rate-preview {
    background: linear-gradient(135deg, rgba(0,98,255,0.06), rgba(0,150,255,0.04));
    border: 1px solid rgba(0,98,255,0.12);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .rate-preview-label { font-size: 0.78rem; color: var(--ahia-text-3); }
  .rate-preview-detail { font-size: 0.72rem; color: var(--ahia-text-3); margin-top: 2px; }
  .rate-preview-value { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--ahia-trust); }
  .modal-submit {
    width: 100%;
    padding: 14px;
    background: var(--ahia-primary-grad);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition);
  }
  .modal-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,122,0,0.35); }

  /* PARTITION BAR */
  .partition-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    border: 1px solid var(--ahia-border);
    margin: 20px 16px 0;
    font-size: 0.75rem;
  }
  .partition-label { color: var(--ahia-text-3); font-weight: 600; }
  .partition-value {
    background: linear-gradient(135deg, rgba(255,122,0,0.1), rgba(255,75,75,0.08));
    color: var(--ahia-sunset);
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    font-weight: 700;
    font-size: 0.7rem;
  }
  .partition-sep { color: var(--ahia-border-2); }
  .partition-stat { color: var(--ahia-text-2); }
  .partition-stat strong { color: var(--ahia-text); font-weight: 700; }

  /* ANIMATIONS */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in { animation: fadeSlideUp 0.5s ease both; }
  .delay-1 { animation-delay: 0.08s; }
  .delay-2 { animation-delay: 0.16s; }
  .delay-3 { animation-delay: 0.24s; }
  .delay-4 { animation-delay: 0.32s; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--ahia-border-2); border-radius: 3px; }

  /* RESPONSIVE */
  @media (max-width: 1100px) { .bids-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px) {
    .app-shell { grid-template-columns: 1fr; }
    .sidebar { display: none; }
    .wallet-section { grid-template-columns: 1fr; }
    .bids-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 620px) {
    .bids-grid { grid-template-columns: 1fr; }
    .main-content { padding: 20px 16px; }
    .offramp-card { flex-direction: column; }
  }
`;

export default globalStyl
  /* ============================================================
     AUTH PAGES — WelcomeScreen, LoginForm, SignUpForm
     ============================================================ */

  /* Shared auth wrapper */
  .auth-page {
    min-height: 100vh;
    background: var(--ahia-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: var(--font-body);
  }

  /* Welcome screen */
  .welcome-card {
    width: 100%;
    max-width: 420px;
    text-align: center;
    animation: fadeSlideUp 0.5s ease both;
  }

  .welcome-logo-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: var(--ahia-primary-grad);
    margin: 0 auto 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 40px rgba(255,122,0,0.35);
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 2rem;
    color: white;
    letter-spacing: -1px;
  }

  .welcome-title {
    font-family: var(--font-display);
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--ahia-text);
    letter-spacing: -1px;
    margin-bottom: 10px;
  }

  .welcome-title span {
    background: var(--ahia-primary-grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .welcome-subtitle {
    font-size: 1rem;
    color: var(--ahia-text-3);
    line-height: 1.6;
    margin-bottom: 40px;
  }

  .welcome-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #E8F0FF, #D0E2FF);
    color: var(--ahia-trust);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 5px 14px;
    border-radius: var(--radius-pill);
    margin-bottom: 20px;
  }

  .welcome-btn-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Auth buttons */
  .auth-btn {
    width: 100%;
    padding: 14px;
    border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .auth-btn.primary {
    background: var(--ahia-primary-grad);
    color: white;
  }
  .auth-btn.primary:hover {
    background: var(--ahia-primary-grad-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255,122,0,0.35);
  }

  .auth-btn.secondary {
    background: white;
    color: var(--ahia-text);
    border: 1.5px solid var(--ahia-border-2);
  }
  .auth-btn.secondary:hover {
    border-color: var(--ahia-sunset);
    color: var(--ahia-sunset);
    box-shadow: var(--shadow-card);
    transform: translateY(-1px);
  }

  /* Auth form card */
  .auth-card {
    width: 100%;
    max-width: 420px;
    background: white;
    border-radius: var(--radius-lg);
    padding: 36px 32px;
    box-shadow: var(--shadow-elevated);
    border: 1px solid var(--ahia-border);
    animation: fadeSlideUp 0.4s ease both;
  }

  .auth-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--ahia-text-3);
    padding: 0;
    margin-bottom: 24px;
    transition: var(--transition);
  }
  .auth-back-btn:hover { color: var(--ahia-text); }

  .auth-logo-sm {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .auth-logo-dot {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--ahia-primary-grad);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
  }
  .auth-logo-name {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.2rem;
    background: var(--ahia-primary-grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .auth-title {
    font-family: var(--font-display);
    font-size: 1.55rem;
    font-weight: 800;
    color: var(--ahia-text);
    margin-bottom: 6px;
    letter-spacing: -0.5px;
  }

  .auth-subtitle {
    font-size: 0.85rem;
    color: var(--ahia-text-3);
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .auth-field {
    margin-bottom: 16px;
  }

  .auth-label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--ahia-text-2);
    margin-bottom: 6px;
  }

  .auth-input {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--ahia-border-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--ahia-text);
    background: var(--ahia-bg);
    outline: none;
    transition: var(--transition);
  }
  .auth-input:focus {
    border-color: var(--ahia-trust);
    background: white;
    box-shadow: 0 0 0 3px rgba(0,98,255,0.08);
  }
  .auth-input::placeholder { color: var(--ahia-text-3); }

  .auth-select {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--ahia-border-2);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: var(--ahia-text);
    background: var(--ahia-bg);
    outline: none;
    transition: var(--transition);
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%239898A6' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
  }
  .auth-select:focus {
    border-color: var(--ahia-trust);
    background-color: white;
    box-shadow: 0 0 0 3px rgba(0,98,255,0.08);
  }

  .auth-divider {
    margin: 20px 0;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--ahia-text-3);
    font-size: 0.75rem;
    font-weight: 600;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--ahia-border);
  }

  .auth-footer-text {
    text-align: center;
    font-size: 0.82rem;
    color: var(--ahia-text-3);
    margin-top: 20px;
  }
  .auth-footer-text button {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--ahia-trust);
    font-weight: 600;
    font-family: var(--font-body);
    font-size: 0.82rem;
    padding: 0;
    transition: var(--transition);
  }
  .auth-footer-text button:hover { opacity: 0.75; }

  .auth-trust-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
  }
  .auth-trust-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.7rem;
    color: var(--ahia-text-3);
    font-weight: 500;
  }
`;

export default globalStyles;
