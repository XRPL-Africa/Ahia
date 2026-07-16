"use client";
// src/components/ratings/UserRating.tsx
// Full rating & review system: star selector, review form, average display,
// recent reviews list, and report inappropriate review.

import { useEffect, useState } from "react";
import { Star, Flag, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useRatingStore } from "@/store/useRatingStore";
import type { Review } from "@/store/useRatingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAnalytics } from "@/hooks/useAnalytics";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserRatingProps {
  /** The user being rated / whose reviews are shown */
  targetUserId: string;
  targetUserName: string;
  /** If provided, the submit form is shown (post-transaction flow) */
  transactionId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Poor",      color: "text-red-500" },
  2: { label: "Fair",      color: "text-orange-400" },
  3: { label: "Good",      color: "text-yellow-500" },
  4: { label: "Very Good", color: "text-lime-500" },
  5: { label: "Excellent", color: "text-green-500" },
};

const REPORT_REASONS = [
  "Spam or fake review",
  "Inappropriate content",
  "Misleading information",
  "Harassment",
  "Other",
];

// ─── Star selector (interactive) ─────────────────────────────────────────────

function StarSelector({
  value,
  onChange,
  size = 32,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={`transition-colors duration-100 ${
              star <= active
                ? "text-ahia-gold fill-ahia-gold"
                : "text-gray-200 fill-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Star display (readonly) ──────────────────────────────────────────────────

export function StarDisplay({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.round(value)
              ? "text-ahia-gold fill-ahia-gold"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
    </div>
  );
}

// ─── Relative time helper ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Report modal ─────────────────────────────────────────────────────────────

function ReportModal({
  reviewId,
  reviewerName,
  onClose,
}: {
  reviewId: string;
  reviewerName: string;
  onClose: () => void;
}) {
  const { reportReview } = useRatingStore();
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    await reportReview(reviewId, reason);
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
      >
        {submitted ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 size={40} className="text-green-500 mb-3" />
            <p className="font-fredoka font-bold text-gray-800 text-lg">Report Submitted</p>
            <p className="text-sm text-gray-500 mt-1">
              Thanks for letting us know. We&apos;ll review this.
            </p>
            <Button variant="primary" className="mt-5 font-fredoka w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} className="text-red-500" />
              <h3 className="font-fredoka font-bold text-gray-800 text-base">
                Report review by {reviewerName}
              </h3>
            </div>

            <p className="text-xs text-gray-500 mb-3 font-fredoka">
              Why are you reporting this review?
            </p>

            <div className="space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    reason === r
                      ? "border-ahia-sunset bg-ahia-sunset/5"
                      : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-ahia-sunset"
                  />
                  <span className="text-sm font-fredoka text-gray-700">{r}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="ghost" className="flex-1 font-fredoka" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1 font-fredoka"
                onClick={handleSubmit}
                disabled={!reason}
              >
                Report
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Submit form ──────────────────────────────────────────────────────────────

function SubmitRatingForm({
  targetUserId,
  targetUserName,
  transactionId,
}: {
  targetUserId: string;
  targetUserName: string;
  transactionId: string;
}) {
  const { user } = useAuthStore();
  const { submitting, submitSuccess, error, submitRating, reset } = useRatingStore();
  const { track } = useAnalytics("RatingForm");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => () => { reset(); }, []);

  const commentError =
    touched && comment.trim().length > 0 && comment.trim().length < 10
      ? "Review must be at least 10 characters"
      : null;

  const canSubmit = rating > 0 && comment.trim().length >= 10 && !submitting;

  const handleSubmit = async () => {
    setTouched(true);
    if (!canSubmit || !user) return;
    await submitRating({ targetUserId, transactionId, rating, comment: comment.trim() });
    track("rating_submitted", { rating, targetUserId });
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <p className="font-fredoka font-bold text-gray-800 text-xl">Review Submitted!</p>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          Your feedback helps the Ahia community.
        </p>
        <StarDisplay value={rating} size={20} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Who are you rating */}
      <p className="text-sm font-fredoka text-gray-500">
        How was your experience with{" "}
        <span className="font-semibold text-gray-800">{targetUserName}</span>?
      </p>

      {/* Star selector */}
      <div>
        <div className="flex items-center gap-3">
          <StarSelector value={rating} onChange={setRating} />
          {rating > 0 && (
            <motion.span
              key={rating}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-sm font-fredoka font-bold ${RATING_LABELS[rating].color}`}
            >
              {RATING_LABELS[rating].label}
            </motion.span>
          )}
        </div>
        {touched && rating === 0 && (
          <p className="text-xs text-red-500 mt-1.5 font-fredoka">
            Please select a star rating
          </p>
        )}
      </div>

      {/* Review text */}
      <div>
        <label className="text-xs font-fredoka font-semibold text-gray-500 uppercase tracking-wide">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => { setComment(e.target.value); setTouched(true); }}
          placeholder="Describe your experience — was the item as described? Was the seller responsive?"
          rows={4}
          maxLength={500}
          className="w-full mt-1.5 px-4 py-3 text-sm font-fredoka text-gray-800 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-ahia-sunset/30 focus:border-ahia-sunset transition-colors placeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-red-500 font-fredoka h-4">{commentError ?? ""}</p>
          <p className="text-xs text-gray-400 font-fredoka">{comment.length}/500</p>
        </div>
      </div>

      {/* API error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-fredoka text-red-600">{error}</p>
        </div>
      )}

      <Button
        variant="primary"
        className="w-full font-fredoka font-bold text-base py-3 h-auto"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </Button>
    </div>
  );
}

// ─── Review card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  currentUserId,
}: {
  review: Review;
  currentUserId?: string;
}) {
  const [reporting, setReporting] = useState(false);
  const isOwn = review.reviewerId === currentUserId;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 py-4 border-b border-gray-50 last:border-b-0"
      >
        {/* Avatar */}
        <img
          src={
            review.reviewerAvatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewerName}`
          }
          alt={review.reviewerName}
          className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-fredoka font-bold text-gray-800 leading-none">
                {review.reviewerName}
                {isOwn && (
                  <span className="ml-1.5 text-[10px] font-semibold text-ahia-trust bg-blue-50 px-1.5 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <StarDisplay value={review.rating} size={13} />
                <span className="text-[11px] text-gray-400 font-fredoka">
                  {timeAgo(review.createdAt)}
                </span>
              </div>
            </div>

            {/* Report button */}
            {!isOwn && !review.isReported && (
              <button
                onClick={() => setReporting(true)}
                title="Report this review"
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
              >
                <Flag size={13} />
              </button>
            )}
            {review.isReported && (
              <span className="text-[10px] font-fredoka text-gray-400 italic">Reported</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
        </div>
      </motion.div>

      <AnimatePresence>
        {reporting && (
          <ReportModal
            reviewId={review.id}
            reviewerName={review.reviewerName}
            onClose={() => setReporting(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Rating summary ───────────────────────────────────────────────────────────

function RatingSummary({ average, total }: { average: number; total: number }) {
  const label =
    average >= 4.5 ? "Highly trusted seller"
    : average >= 3.5 ? "Good seller"
    : average >= 2.5 ? "Average seller"
    : "Needs improvement";

  return (
    <div className="flex items-center gap-5 py-4 border-b border-gray-100">
      <div className="text-center shrink-0">
        <p className="text-5xl font-fredoka font-bold text-gray-800 leading-none">
          {average.toFixed(1)}
        </p>
        <div className="mt-1.5">
          <StarDisplay value={average} size={16} />
        </div>
        <p className="text-xs text-gray-400 font-fredoka mt-1">
          {total} review{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="w-px h-16 bg-gray-100 shrink-0" />

      <div className="flex-1">
        <p className="text-sm font-fredoka font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 font-fredoka mt-0.5">
          Based on completed transactions
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 py-4 border-b border-gray-50 animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
            <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
            <div className="h-3 bg-gray-100 rounded-full w-full" />
            <div className="h-3 bg-gray-100 rounded-full w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

export function UserRating({ targetUserId, targetUserName, transactionId }: UserRatingProps) {
  const { user } = useAuthStore();
  const { reviews, averageRating, totalReviews, loading, error, fetchReviews } =
    useRatingStore();

  const [showAll, setShowAll] = useState(false);
  const PREVIEW_COUNT = 3;

  useEffect(() => {
    fetchReviews(targetUserId);
  }, [targetUserId]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <div className="space-y-4">

      {/* ── Submit form (only when transactionId is provided and user is logged in) */}
      {transactionId && user && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <Star size={18} className="text-ahia-gold fill-ahia-gold" />
            <h2 className="font-fredoka font-bold text-gray-800 text-lg leading-none">
              Rate your experience
            </h2>
          </div>
          <div className="px-5 py-5">
            <SubmitRatingForm
              targetUserId={targetUserId}
              targetUserName={targetUserName}
              transactionId={transactionId}
            />
          </div>
        </div>
      )}

      {/* ── Reviews display ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <Star size={18} className="text-ahia-gold fill-ahia-gold" />
            <h2 className="font-fredoka font-bold text-gray-800 text-lg leading-none">
              Reviews
            </h2>
            {totalReviews > 0 && (
              <span className="text-[10px] font-bold font-fredoka bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                {totalReviews}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchReviews(targetUserId)}
            className="text-xs font-fredoka text-gray-400 hover:text-ahia-sunset transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="px-5">
          {/* Average rating summary */}
          {!loading && totalReviews > 0 && (
            <RatingSummary average={averageRating} total={totalReviews} />
          )}

          {/* Reviews list */}
          {loading ? (
            <ReviewSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle size={28} className="text-gray-300 mb-2" />
              <p className="text-sm font-fredoka text-gray-500">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 font-fredoka"
                onClick={() => fetchReviews(targetUserId)}
              >
                Try again
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <Star size={22} className="text-gray-200" />
              </div>
              <p className="font-fredoka font-semibold text-gray-500 text-sm">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1 font-fredoka">
                Reviews appear here after completed transactions.
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false}>
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} currentUserId={user?.id} />
                ))}
              </AnimatePresence>

              {/* Show more / less */}
              {reviews.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 py-3.5 text-sm font-fredoka font-semibold text-ahia-trust hover:text-ahia-sunset transition-colors"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showAll ? "rotate-180" : ""}`}
                  />
                  {showAll ? "Show less" : `Show all ${reviews.length} reviews`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
