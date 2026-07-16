"use client";
// src/components/profile/TrustScore.tsx
// Trust Score system:
//   • TrustScore        — compact pill and full summary badge (used in product cards / Task 2)
//   • TrustScoreDisplay — detailed dashboard (Task 3): progress bar, breakdown, badges, tips, history

import { useState } from "react";
import {
  ShieldCheck,
  Star,
  Clock,
  ShoppingBag,
  TrendingUp,
  Lock,
  Crown,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StarDisplay } from "@/components/ratings/UserRating";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES & HELPERS
// ─────────────────────────────────────────────────────────────────────────────

interface TrustLevelMeta {
  label: string;
  minScore: number;
  color: string;       // text colour
  bg: string;          // background colour
  ring: string;        // ring/border colour
  icon: React.ReactNode;
}

const TRUST_LEVELS: TrustLevelMeta[] = [
  { label: "New Seller",     minScore: 0.0, color: "text-gray-600",   bg: "bg-gray-100",   ring: "ring-gray-200",   icon: <ShieldCheck size={16} /> },
  { label: "Rising Star",    minScore: 2.0, color: "text-blue-700",   bg: "bg-blue-50",    ring: "ring-blue-200",   icon: <Star size={16} /> },
  { label: "Good Seller",    minScore: 3.0, color: "text-yellow-700", bg: "bg-yellow-50",  ring: "ring-yellow-300", icon: <ShoppingBag size={16} /> },
  { label: "Trusted Seller", minScore: 4.0, color: "text-green-700",  bg: "bg-green-50",   ring: "ring-green-300",  icon: <ShieldCheck size={16} /> },
  { label: "Elite Seller",   minScore: 4.5, color: "text-amber-700",  bg: "bg-amber-50",   ring: "ring-amber-400",  icon: <Crown size={16} /> },
];

function getCurrentLevel(score: number): TrustLevelMeta {
  return [...TRUST_LEVELS].reverse().find((l) => score >= l.minScore) ?? TRUST_LEVELS[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// EXISTING COMPACT / FULL VARIANTS  (Task 2 — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

interface TrustScoreProps {
  score: number;
  reviewCount?: number;
  variant?: "compact" | "full";
}

export function TrustScore({ score, reviewCount, variant = "compact" }: TrustScoreProps) {
  const level = getCurrentLevel(score);

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5">
        <Star size={13} className="text-ahia-gold fill-ahia-gold shrink-0" />
        <span className="text-xs font-fredoka font-bold text-gray-800">
          {score > 0 ? score.toFixed(1) : "New"}
        </span>
        {reviewCount !== undefined && reviewCount > 0 && (
          <span className="text-xs font-fredoka text-gray-400">({reviewCount})</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-ahia-sunset/10 flex items-center justify-center shrink-0">
        <ShieldCheck size={24} className="text-ahia-sunset" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-fredoka font-bold text-gray-800 leading-none">
            {score > 0 ? score.toFixed(1) : "—"}
          </span>
          <span className="text-sm font-fredoka text-gray-400">/ 5.0</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <StarDisplay value={score} size={14} />
          {reviewCount !== undefined && (
            <span className="text-xs font-fredoka text-gray-400">
              {reviewCount > 0 ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : "No reviews yet"}
            </span>
          )}
        </div>
      </div>
      <span className={`shrink-0 text-xs font-fredoka font-bold px-2.5 py-1 rounded-full ${level.bg} ${level.color}`}>
        {level.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3 — DETAILED TRUST SCORE DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

export interface TrustScoreBreakdown {
  trades: { score: number; count: number };           // 0–5 score, raw trade count
  responseTime: { score: number; avgHours: number };  // 0–5 score, avg hours to reply
  ratings: { score: number; count: number };          // 0–5 score, total ratings
}

export interface TrustScoreHistory {
  month: string;   // e.g. "Oct", "Nov"
  score: number;
}

export interface TrustScoreDisplayProps {
  score: number;
  breakdown?: TrustScoreBreakdown;
  history?: TrustScoreHistory[];
}

// ── Animated progress bar ────────────────────────────────────────────────────

function AnimatedBar({
  value,
  max = 5,
  color = "bg-ahia-sunset",
  height = "h-2.5",
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden`}>
      <motion.div
        className={`${height} ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Score breakdown card ─────────────────────────────────────────────────────

function BreakdownRow({
  icon,
  label,
  sublabel,
  score,
  barColor,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  score: number;
  barColor: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
            {icon}
          </div>
          <div>
            <p className="text-sm font-fredoka font-semibold text-gray-800 leading-none">{label}</p>
            <p className="text-[11px] font-fredoka text-gray-400 mt-0.5">{sublabel}</p>
          </div>
        </div>
        <span className="text-sm font-fredoka font-bold text-gray-700 shrink-0 ml-2">
          {score.toFixed(1)}<span className="text-gray-400 font-normal">/5</span>
        </span>
      </div>
      <AnimatedBar value={score} color={barColor} />
    </div>
  );
}

// ── Badge grid ───────────────────────────────────────────────────────────────

const BADGE_REQUIREMENTS: Record<string, string> = {
  "New Seller":     "Auto-assigned when you join",
  "Rising Star":    "Score 2.0+ with 5 completed trades",
  "Good Seller":    "Score 3.0+ with consistent ratings",
  "Trusted Seller": "Score 4.0+ with 25+ trades",
  "Elite Seller":   "Score 4.5+ with 50+ trades",
};

function BadgeGrid({ currentScore }: { currentScore: number }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {TRUST_LEVELS.map((level) => {
        const unlocked = currentScore >= level.minScore;
        const isCurrent = getCurrentLevel(currentScore).label === level.label;

        return (
          <div
            key={level.label}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              unlocked
                ? `${level.bg} border-transparent ring-1 ${level.ring}`
                : "bg-gray-50 border-gray-100 opacity-60"
            }`}
          >
            {/* Badge icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                unlocked ? `${level.bg} ${level.color}` : "bg-gray-200 text-gray-400"
              }`}
            >
              {unlocked ? level.icon : <Lock size={16} />}
            </div>

            {/* Badge info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-fredoka font-bold ${unlocked ? level.color : "text-gray-400"}`}>
                  {level.label}
                </p>
                {isCurrent && (
                  <span className="text-[10px] font-fredoka font-bold bg-ahia-sunset text-white px-1.5 py-0.5 rounded-full leading-none">
                    Current
                  </span>
                )}
              </div>
              <p className="text-[11px] font-fredoka text-gray-400 mt-0.5 leading-snug">
                {BADGE_REQUIREMENTS[level.label]}
              </p>
            </div>

            {/* Score threshold */}
            <span className={`text-xs font-fredoka font-bold shrink-0 ${unlocked ? level.color : "text-gray-400"}`}>
              {level.minScore.toFixed(1)}+
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Improvement tips ─────────────────────────────────────────────────────────

function getTips(breakdown?: TrustScoreBreakdown): string[] {
  if (!breakdown) {
    return [
      "Complete your first trade to start building your score.",
      "Respond to messages quickly to improve your response rating.",
      "Ask buyers to leave a review after each successful trade.",
    ];
  }
  const tips: string[] = [];
  if (breakdown.trades.count < 10) {
    tips.push(`You have ${breakdown.trades.count} trade${breakdown.trades.count !== 1 ? "s" : ""}. Complete more trades to build credibility.`);
  }
  if (breakdown.responseTime.avgHours > 2) {
    tips.push(`Your average reply time is ${breakdown.responseTime.avgHours}h. Replying faster (under 1h) boosts your score.`);
  }
  if (breakdown.ratings.score < 4.0) {
    tips.push("Ask buyers to leave honest reviews — a higher rating is the fastest way to level up.");
  }
  if (tips.length === 0) {
    tips.push("Great job! Keep completing trades and maintaining fast response times to stay Elite.");
  }
  return tips;
}

function ImprovementTips({ breakdown }: { breakdown?: TrustScoreBreakdown }) {
  const tips = getTips(breakdown);
  return (
    <div className="space-y-2">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Lightbulb size={15} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-fredoka text-gray-700 leading-relaxed">{tip}</p>
        </div>
      ))}
    </div>
  );
}

// ── Score history chart ──────────────────────────────────────────────────────

const DEFAULT_HISTORY: TrustScoreHistory[] = [
  { month: "Oct", score: 3.2 },
  { month: "Nov", score: 3.5 },
  { month: "Dec", score: 3.8 },
  { month: "Jan", score: 4.1 },
  { month: "Feb", score: 4.3 },
  { month: "Mar", score: 4.6 },
];

function ScoreHistoryChart({ history }: { history?: TrustScoreHistory[] }) {
  const data = history && history.length > 0 ? history : DEFAULT_HISTORY;

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ff7a00" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#ff7a00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fontFamily: "Fredoka", fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fontFamily: "Fredoka", fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "#fff",
            border: "1px solid #f3f4f6",
            borderRadius: 12,
            fontSize: 12,
            fontFamily: "Fredoka",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
          formatter={(value) => {
            if (value === null || value === undefined) return ["—", "Trust Score"];
            return [`${(value as number).toFixed(1)} / 5.0`, "Trust Score"];
          }}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="#ff7a00"
          strokeWidth={2.5}
          fill="url(#scoreGradient)"
          dot={{ r: 4, fill: "#ff7a00", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#ff7a00", strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
  collapsible = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 ${collapsible ? "hover:bg-gray-50 transition-colors" : ""}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-ahia-sunset">{icon}</span>
          <h3 className="font-fredoka font-bold text-gray-800 text-base leading-none">{title}</h3>
        </div>
        {collapsible && (
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {(!collapsible || open) && <div className="px-5 py-4">{children}</div>}
    </div>
  );
}

// ── Main TrustScoreDisplay component ─────────────────────────────────────────

export function TrustScoreDisplay({
  score,
  breakdown,
  history,
}: TrustScoreDisplayProps) {
  const level = getCurrentLevel(score);
  const nextLevel = TRUST_LEVELS.find((l) => l.minScore > score);
  const pct = (score / 5) * 100;

  // Breakdown bar colours
  const barColors = {
    trades:       "bg-ahia-sunset",
    responseTime: "bg-ahia-trust",
    ratings:      "bg-ahia-gold",
  };

  return (
    <div className="space-y-4">

      {/* ── Overall score hero ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-6">
          {/* Score + badge */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-fredoka font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Your Trust Score
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-fredoka font-bold text-gray-800 leading-none">
                  {score.toFixed(1)}
                </span>
                <span className="text-lg font-fredoka text-gray-400">/ 5.0</span>
              </div>
              <div className="mt-2">
                <StarDisplay value={score} size={18} />
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-1 ${level.bg} ${level.ring}`}>
              <span className={level.color}>{level.icon}</span>
              <span className={`text-sm font-fredoka font-bold ${level.color}`}>{level.label}</span>
            </div>
          </div>

          {/* Main progress bar */}
          <AnimatedBar value={score} height="h-3" color="bg-ahia-sunset" />

          {/* Progress labels */}
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] font-fredoka text-gray-400">0.0</span>
            {nextLevel && (
              <span className="text-[11px] font-fredoka text-gray-500">
                <span className="text-ahia-sunset font-semibold">
                  {(nextLevel.minScore - score).toFixed(1)} more
                </span>{" "}
                to unlock <span className="font-semibold">{nextLevel.label}</span>
              </span>
            )}
            <span className="text-[11px] font-fredoka text-gray-400">5.0</span>
          </div>
        </div>
      </div>

      {/* ── Score breakdown ─────────────────────────────────────────────────── */}
      <Section title="Score Breakdown" icon={<TrendingUp size={18} />}>
        <div className="space-y-4">
          <BreakdownRow
            icon={<ShoppingBag size={15} />}
            label="Trades Completed"
            sublabel={breakdown ? `${breakdown.trades.count} completed trades` : "No data yet"}
            score={breakdown?.trades.score ?? 0}
            barColor={barColors.trades}
          />
          <BreakdownRow
            icon={<Clock size={15} />}
            label="Response Time"
            sublabel={
              breakdown
                ? breakdown.responseTime.avgHours < 1
                  ? "Avg reply: under 1 hour"
                  : `Avg reply: ${breakdown.responseTime.avgHours}h`
                : "No data yet"
            }
            score={breakdown?.responseTime.score ?? 0}
            barColor={barColors.responseTime}
          />
          <BreakdownRow
            icon={<Star size={15} />}
            label="Buyer Ratings"
            sublabel={breakdown ? `${breakdown.ratings.count} review${breakdown.ratings.count !== 1 ? "s" : ""}` : "No reviews yet"}
            score={breakdown?.ratings.score ?? 0}
            barColor={barColors.ratings}
          />
        </div>
      </Section>

      {/* ── Score history graph ─────────────────────────────────────────────── */}
      <Section title="Score History" icon={<TrendingUp size={18} />}>
        <p className="text-xs font-fredoka text-gray-400 mb-3">Past 6 months</p>
        <ScoreHistoryChart history={history} />
      </Section>

      {/* ── Badge unlocks ───────────────────────────────────────────────────── */}
      <Section title="Badge Levels" icon={<Crown size={18} />} collapsible>
        <BadgeGrid currentScore={score} />
      </Section>

      {/* ── Tips to improve ─────────────────────────────────────────────────── */}
      <Section title="Tips to Improve" icon={<Lightbulb size={18} />} collapsible>
        <ImprovementTips breakdown={breakdown} />
      </Section>

    </div>
  );
}
