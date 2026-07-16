"use client";
// src/components/escrow/CountdownTimer.tsx
// Ahia — 14-Day Countdown Timer with Progress Ring

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

interface CountdownTimerProps {
  expiresAt: Date;
  startedAt?: Date;
  label?: string;
  onExpired?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const RING_SIZE = 120;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getTimeLeft(expiresAt: Date): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, new Date(expiresAt).getTime() - now);
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function getUrgencyColor(totalMs: number): string {
  const daysLeft = totalMs / (1000 * 60 * 60 * 24);
  if (daysLeft > 7) return "#059669";   // Green
  if (daysLeft > 3) return "#EA580C";   // Orange
  return "#DC2626";                      // Red
}

function getUrgencyBg(totalMs: number): string {
  const daysLeft = totalMs / (1000 * 60 * 60 * 24);
  if (daysLeft > 7) return "bg-emerald-50 border-emerald-200";
  if (daysLeft > 3) return "bg-orange-50 border-orange-200";
  return "bg-red-50 border-red-200";
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({
  expiresAt,
  startedAt,
  label = "Testing Period",
  onExpired,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft(expiresAt));
  const expiredRef = useRef(false);
  const prevSecondsRef = useRef(timeLeft.seconds);

  const tick = useCallback(() => {
    const tl = getTimeLeft(expiresAt);
    setTimeLeft(tl);
    if (tl.total <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpired?.();
    }
  }, [expiresAt, onExpired]);

  useEffect(() => {
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  // Calculate progress
  const totalDuration = startedAt
    ? new Date(expiresAt).getTime() - new Date(startedAt).getTime()
    : FOURTEEN_DAYS_MS;
  const progress = Math.max(0, Math.min(1, timeLeft.total / totalDuration));
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const color = getUrgencyColor(timeLeft.total);
  const urgencyBg = getUrgencyBg(timeLeft.total);
  const isUrgent = timeLeft.total > 0 && timeLeft.total < 3 * 24 * 60 * 60 * 1000;
  const isExpired = timeLeft.total <= 0;

  // Detect digit change for flip animation
  const secondChanged = prevSecondsRef.current !== timeLeft.seconds;
  prevSecondsRef.current = timeLeft.seconds;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center"
      >
        <div className="text-4xl mb-2">⌛</div>
        <div className="font-[family-name:var(--font-fredoka)] font-bold text-lg text-gray-500">
          Testing Period Expired
        </div>
        <p className="text-sm text-gray-400 mt-1">
          The inspection window has closed
        </p>
      </motion.div>
    );
  }

  // Human-readable remaining text
  const parts: string[] = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days} day${timeLeft.days !== 1 ? "s" : ""}`);
  if (timeLeft.hours > 0) parts.push(`${timeLeft.hours} hour${timeLeft.hours !== 1 ? "s" : ""}`);
  if (timeLeft.days === 0 && timeLeft.minutes > 0)
    parts.push(`${timeLeft.minutes} min${timeLeft.minutes !== 1 ? "s" : ""}`);
  const readableText = parts.join(", ") + " remaining";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`${urgencyBg} border rounded-2xl p-6 ${isUrgent ? "countdown-urgent" : ""}`}
    >
      <div className="flex items-center gap-6">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg
            width={RING_SIZE}
            height={RING_SIZE}
            className="transform -rotate-90"
          >
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              className="progress-ring-track"
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              className="progress-ring-fill"
              style={{
                stroke: color,
                strokeDasharray: RING_CIRCUMFERENCE,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-[family-name:var(--font-fredoka)] font-bold text-lg leading-none"
              style={{ color }}
            >
              {timeLeft.days}d
            </span>
            <span className="text-[10px] text-gray-400 mt-0.5">left</span>
          </div>
        </div>

        {/* Countdown Digits */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </div>
          <div className="flex items-baseline gap-1">
            {[
              { value: pad(timeLeft.days), unit: "D" },
              { value: pad(timeLeft.hours), unit: "H" },
              { value: pad(timeLeft.minutes), unit: "M" },
              { value: pad(timeLeft.seconds), unit: "S" },
            ].map((segment, i) => (
              <React.Fragment key={segment.unit}>
                {i > 0 && (
                  <span
                    className="font-[family-name:var(--font-fredoka)] text-lg font-bold mx-0.5"
                    style={{ color }}
                  >
                    :
                  </span>
                )}
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`font-[family-name:var(--font-fredoka)] text-2xl font-bold tabular-nums ${
                      secondChanged && segment.unit === "S" ? "digit-flip-enter" : ""
                    }`}
                    style={{ color }}
                  >
                    {segment.value}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {segment.unit}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{readableText}</p>
        </div>
      </div>
    </motion.div>
  );
}
