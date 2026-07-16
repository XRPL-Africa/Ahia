"use client";
// src/components/escrow/EscrowTimeline.tsx
// Ahia — Animated Escrow Transaction Timeline

import React from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { EscrowTimelineEvent, EscrowState } from "@/types/escrow";
import { STATE_CONFIG } from "@/types/escrow";

interface EscrowTimelineProps {
  events: EscrowTimelineEvent[];
  currentState: EscrowState;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

export function EscrowTimeline({ events, currentState }: EscrowTimelineProps) {
  // Show events newest-first in data, but render oldest-first visually
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-gray-200" />

      {sortedEvents.map((event, i) => {
        const cfg = STATE_CONFIG[event.state];
        const isLatest = i === sortedEvents.length - 1;
        const isPast = i < sortedEvents.length - 1;

        return (
          <motion.div
            key={`${event.state}-${i}`}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={itemVariants}
            className="relative pb-6 last:pb-0"
          >
            {/* Dot */}
            <div
              className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 z-10 ${
                isLatest ? "timeline-dot-active" : ""
              }`}
              style={{
                backgroundColor: isPast ? cfg.color : "#fff",
                borderColor: cfg.color,
              }}
            />

            {/* Colored connector for past events */}
            {isPast && (
              <div
                className="absolute -left-[19px] top-4 w-0.5 h-[calc(100%-4px)]"
                style={{ backgroundColor: cfg.color, opacity: 0.3 }}
              />
            )}

            {/* Content */}
            <div className="ml-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-base">{cfg.icon}</span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>

              <div className="text-xs text-gray-400">
                {formatDateTime(event.timestamp)}
              </div>

              {event.note && (
                <p className="text-sm text-gray-500 italic mt-1">
                  {event.note}
                </p>
              )}

              {event.xrplTxHash && (
                <a
                  href={`https://livenet.xrpl.org/transactions/${event.xrplTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1"
                >
                  View on XRPL
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
