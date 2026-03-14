import type { ToastState } from "../types";

interface ToastProps {
  state: ToastState;
}

export default function Toast({ state }: ToastProps) {
  const classes = ["haptic-toast", state.show ? "show" : "", state.vibrate ? "vibrate" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <div className={`haptic-indicator ${state.bar}`} />
      <div className={`haptic-toast-icon ${state.icon}`}>{state.emoji}</div>
      <div className="haptic-toast-body">
        <div className="haptic-toast-title">{state.title}</div>
        <div className="haptic-toast-sub">{state.sub}</div>
      </div>
    </div>
  );
}
