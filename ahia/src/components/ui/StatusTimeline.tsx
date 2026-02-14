import { Check, Lock, Package, Search, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";

type EscrowState =
  | "COMMITTED"
  | "PENDING_HANDOVER"
  | "INSPECTION"
  | "COMPLETED";

interface StatusTimelineProps {
  currentState: EscrowState;
  daysRemaining: number;
}

const STEPS = [
  { id: "COMMITTED", label: "Paid", icon: Lock },
  { id: "PENDING_HANDOVER", label: "Handover", icon: Package },
  { id: "INSPECTION", label: "Testing", icon: Search },
  { id: "COMPLETED", label: "Released", icon: Check },
];

export const StatusTimeline = ({
  currentState,
  daysRemaining,
}: StatusTimelineProps) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentState);

  return (
    <div className="bg-white p-6 rounded-ahia-lg border border-gray-100 shadow-ahia space-y-8">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-heading font-bold text-lg">Escrow Status</h3>
          <p className="text-sm text-gray-500">Transaction ID: #RL-99201</p>
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
            Auto-Release in
          </span>
          <span className="text-xl font-bold text-ahia-trust">
            {daysRemaining} Days
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative flex justify-between items-center px-2">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 -z-10" />

        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  isCompleted
                    ? "bg-ahia-success border-ahia-success/20 text-white"
                    : isActive
                    ? "bg-white border-ahia-trust text-ahia-trust shadow-[0_0_15px_rgba(0,98,255,0.3)]"
                    : "bg-white border-gray-100 text-gray-300"
                }`}
              >
                {isCompleted ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-tight ${
                  isActive ? "text-ahia-trust" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-50">
        <Button variant="primary" className="flex-1 py-2 text-sm">
          Verify Handover
        </Button>
        <Button
          variant="danger"
          className="flex-1 py-2 text-sm border-gray-200"
        >
          <ShieldAlert size={16} /> Freeze Funds
        </Button>
      </div>
    </div>
  );
};
