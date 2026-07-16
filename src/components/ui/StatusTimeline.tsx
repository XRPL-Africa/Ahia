import { CheckCircle, Clock, Truck, Shield } from "lucide-react";

interface StatusTimelineProps {
  currentState: "LISTED" | "COMMITTED" | "INSPECTION" | "DELIVERED" | "COMPLETED";
  daysRemaining: number;
}

const states = [
  { key: "LISTED", label: "Listed", icon: Shield },
  { key: "COMMITTED", label: "Committed", icon: CheckCircle },
  { key: "INSPECTION", label: "Inspection", icon: Clock },
  { key: "DELIVERED", label: "Delivered", icon: Truck },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle },
];

export function StatusTimeline({ currentState, daysRemaining }: StatusTimelineProps) {
  const currentIndex = states.findIndex((state) => state.key === currentState);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Escrow Progress</span>
        <span>{daysRemaining} days remaining</span>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        {states.map((state, index) => {
          const Icon = state.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div key={state.key} className="flex items-center mb-6 relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-ahia-success text-white"
                    : isCurrent
                    ? "bg-ahia-trust text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    isCompleted || isCurrent ? "text-ahia-text" : "text-gray-400"
                  }`}
                >
                  {state.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-gray-500">Current phase</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}