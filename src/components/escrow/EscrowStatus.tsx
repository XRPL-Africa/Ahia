"use client";
// src/components/escrow/EscrowStatus.tsx
// Ahia — Campus Marketplace | XRPL Escrow Management
// Task 3: Transaction/Escrow Screens — Full Tailwind Rewrite

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Package,
  Search,
} from "lucide-react";
import type {
  EscrowTransaction,
  EscrowState,
  EscrowFilter,
} from "@/types/escrow";
import {
  STATE_CONFIG,
  ESCROW_STEPS,
  STATE_STEP_INDEX,
} from "@/types/escrow";
import { EscrowService } from "@/services/escrow.service";
import { CountdownTimer } from "./CountdownTimer";
import { EscrowTimeline } from "./EscrowTimeline";
import { TransactionCard } from "./TransactionCard";

// ─── EscrowStatus Detail Component ───────────────────────────────────────────

export interface EscrowStatusProps {
  transactionId: string;
  onBack: () => void;
  onChat: (chatId: string, recipientId: string) => void;
  onViewListing: (listingId: string) => void;
}

export const EscrowStatus: React.FC<EscrowStatusProps> = ({
  transactionId,
  onBack,
  onChat,
  onViewListing,
}) => {
  const [tx, setTx] = useState<EscrowTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [showExtendDrawer, setShowExtendDrawer] = useState(false);
  const [selectedExtendDays, setSelectedExtendDays] = useState(3);

  const loadTransaction = useCallback(async () => {
    try {
      const data = await EscrowService.getTransaction(transactionId);
      setTx(data);
    } catch {
      setError("Failed to load transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    loadTransaction();
    const interval = setInterval(loadTransaction, 15000);
    return () => clearInterval(interval);
  }, [loadTransaction]);

  // ─── Action Handlers ──────────────────────────────────────────────────────

  const handleConfirmReceipt = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      await EscrowService.confirmReceipt(tx.id, tx.escrowFulfillment || "");
      await loadTransaction();
    } catch {
      alert("Failed to confirm receipt. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSent = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      await EscrowService.markItemSent(tx.id);
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!tx || !disputeReason.trim()) return;
    setActionLoading(true);
    try {
      await EscrowService.raiseDispute(tx.id, disputeReason);
      setShowDispute(false);
      setDisputeReason("");
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAuthenticity = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      await EscrowService.verifyAuthenticity(tx.id, verifyNotes);
      setShowVerifyDialog(false);
      setVerifyNotes("");
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTesting = async () => {
    if (!tx) return;
    setActionLoading(true);
    try {
      await EscrowService.extendTesting(tx.id, selectedExtendDays);
      setShowExtendDrawer(false);
      await loadTransaction();
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading / Error States ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="escrow-skeleton h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="font-[family-name:var(--font-fredoka)] font-bold text-xl text-gray-800 mb-2">
            {error || "Transaction not found"}
          </h2>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Derived State ────────────────────────────────────────────────────────

  const isBuyer = tx.currentUserId === tx.buyer.id;
  const isSeller = tx.currentUserId === tx.seller.id;
  const statusCfg = STATE_CONFIG[tx.state];
  const currentStep = STATE_STEP_INDEX[tx.state] ?? -1;
  const counterparty = isBuyer ? tx.seller : tx.buyer;
  const isTerminal = ["completed", "refunded", "cancelled", "expired"].includes(tx.state);

  // Action availability
  const canConfirmReceipt = isBuyer && tx.state === "item_sent";
  const canMarkSent = isSeller && tx.state === "active";
  const canDispute = !isTerminal && tx.state !== "disputed" && tx.state !== "created";
  const canCancel = (isBuyer && tx.state === "created") || (tx.state === "expired" && isBuyer);

  // Testing period / Verify / Extend availability
  const isInTesting = tx.state === "testing" && tx.testingPeriod;
  const canVerifyAuthenticity =
    isBuyer &&
    (tx.state === "testing" || tx.state === "item_sent") &&
    !tx.authenticity?.verified;
  const testingDaysLeft = isInTesting
    ? Math.max(0, (new Date(tx.testingPeriod!.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const canExtendTesting =
    isBuyer && isInTesting && testingDaysLeft < 3 && tx.testingPeriod!.extensionDays === 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-[family-name:var(--font-fredoka)] font-bold text-base text-gray-900 truncate">
              Order #{tx.id.slice(-6).toUpperCase()}
            </h1>
          </div>
          <button
            onClick={() => onChat("", counterparty.id)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={`Chat with ${counterparty.displayName}`}
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4 rounded-2xl border p-5 flex items-center gap-4"
          style={{ background: statusCfg.bg, borderColor: `${statusCfg.color}30` }}
        >
          <span className="text-3xl">{statusCfg.icon}</span>
          <div>
            <div
              className="font-[family-name:var(--font-fredoka)] font-bold text-lg"
              style={{ color: statusCfg.color }}
            >
              {statusCfg.label}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{statusCfg.description}</div>
          </div>
        </motion.div>

        {/* Progress Stepper */}
        {!["disputed", "refunded", "cancelled", "expired"].includes(tx.state) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center py-5 px-1"
          >
            {ESCROW_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <React.Fragment key={step.state}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                        active ? "ring-2 ring-blue-700 ring-offset-2 scale-110" : ""
                      }`}
                      style={{
                        background: done ? "#1D4ED8" : "#E5E7EB",
                      }}
                    >
                      {done && i < currentStep && (
                        <span className="text-white text-[10px] font-bold">✓</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] whitespace-nowrap ${
                        done
                          ? "text-blue-700 font-semibold"
                          : "text-gray-400"
                      } ${active ? "font-bold" : ""}`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < ESCROW_STEPS.length - 1 && (
                    <div
                      className="flex-1 h-0.5 mx-1.5 -mt-5 transition-colors duration-300"
                      style={{
                        background: i < currentStep ? "#1D4ED8" : "#E5E7EB",
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </motion.div>
        )}

        {/* ═══ 14-Day Countdown Timer ═══ */}
        {isInTesting && tx.testingPeriod && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4"
          >
            <CountdownTimer
              expiresAt={tx.testingPeriod.expiresAt}
              startedAt={tx.testingPeriod.startedAt}
              label="Testing Period"
            />
          </motion.div>
        )}

        {/* Escrow Expiry (non-testing) */}
        {tx.escrowExpiry && !isTerminal && !isInTesting && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <Clock size={16} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-700">
              Escrow expires{" "}
              {new Date(tx.escrowExpiry).toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Listing Info */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onViewListing(tx.listingId)}
          className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3.5 mb-3 text-left hover:shadow-md transition-shadow group"
        >
          {tx.listingImageUrl && (
            <img
              src={tx.listingImageUrl}
              alt=""
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {tx.listingTitle}
            </div>
            <div className="text-xs text-blue-600 mt-1 group-hover:underline">
              View listing ›
            </div>
          </div>
        </motion.button>

        {/* Payment Details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-100 rounded-xl p-4 mb-3"
        >
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">
            Payment Details
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Item price</span>
              <span className="text-gray-900 font-medium">{tx.amountXRP} XRP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform fee (2%)</span>
              <span className="text-gray-900 font-medium">
                {tx.platformFeeXRP.toFixed(4)} XRP
              </span>
            </div>
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
              <span className="font-bold text-sm text-gray-900">Total locked</span>
              <span className="font-bold text-sm text-blue-700">{tx.totalXRP} XRP</span>
            </div>
            {tx.amountNaira && (
              <div className="text-right text-xs text-gray-400">{tx.amountNaira}</div>
            )}
          </div>

          {/* XRPL Links */}
          {tx.xrplCreateTxHash && (
            <a
              href={EscrowService.getXRPLTransactionUrl(tx.xrplCreateTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-3"
            >
              🔗 View escrow on XRPL Explorer
              <ExternalLink size={10} />
            </a>
          )}
          {tx.xrplFinishTxHash && (
            <a
              href={EscrowService.getXRPLTransactionUrl(tx.xrplFinishTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 block"
            >
              🔗 View release tx on XRPL Explorer
              <ExternalLink size={10} />
            </a>
          )}
        </motion.div>

        {/* Parties */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-gray-100 rounded-xl p-4 mb-3"
        >
          <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">
            Parties
          </h3>
          <PartyRow party={tx.buyer} role="Buyer" isSelf={isBuyer} />
          <PartyRow party={tx.seller} role="Seller" isSelf={isSeller} />
        </motion.div>

        {/* Delivery Info */}
        {(tx.meetupLocation || tx.notes) && (
          <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
            <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">
              {tx.deliveryMethod === "meetup" ? "📍 Meetup Details" : "📦 Delivery Details"}
            </h3>
            {tx.meetupLocation && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-400">Location</span>
                <span className="text-xs text-gray-900 font-medium text-right max-w-[60%]">
                  {tx.meetupLocation}
                </span>
              </div>
            )}
            {tx.notes && (
              <div className="flex justify-between py-1.5">
                <span className="text-xs text-gray-400">Notes</span>
                <span className="text-xs text-gray-900 font-medium text-right max-w-[60%]">
                  {tx.notes}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Authenticity Verified Badge */}
        {tx.authenticity?.verified && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-3"
          >
            <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-700">
                Authenticity Verified ✓
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">
                Verified on{" "}
                {tx.authenticity.verifiedAt
                  ? new Date(tx.authenticity.verifiedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </div>
              {tx.authenticity.notes && (
                <div className="text-xs text-emerald-500 mt-1 italic">
                  &ldquo;{tx.authenticity.notes}&rdquo;
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Dispute Info */}
        {tx.state === "disputed" && (
          <div className="bg-white border-l-4 border-l-red-500 border border-gray-100 rounded-xl p-4 mb-3">
            <h3 className="font-bold text-sm text-red-600 mb-2">⚠️ Dispute Under Review</h3>
            <p className="text-sm text-gray-700 mb-2">{tx.disputeReason}</p>
            <p className="text-xs text-gray-500">
              Our team is reviewing this dispute and will respond within 24 hours.
            </p>
          </div>
        )}

        {/* Refund Resolution */}
        {tx.state === "refunded" && tx.disputeResolution && (
          <div className="bg-white border-l-4 border-l-gray-400 border border-gray-100 rounded-xl p-4 mb-3">
            <h3 className="font-bold text-sm text-gray-700 mb-2">↩️ Dispute Resolved</h3>
            <p className="text-sm text-gray-600">{tx.disputeResolution}</p>
          </div>
        )}

        {/* ═══ ACTION BUTTONS ═══ */}
        {!isTerminal && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 mb-4"
          >
            {/* Buyer: Confirm Receipt */}
            {canConfirmReceipt && (
              <>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={actionLoading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "✓ Confirm I Received It"}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  This releases funds to the seller. Only confirm when you have the item.
                </p>
              </>
            )}

            {/* Seller: Mark Item Sent */}
            {canMarkSent && (
              <button
                onClick={handleMarkSent}
                disabled={actionLoading}
                className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-base rounded-xl transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "🚚 Mark Item as Dispatched"}
              </button>
            )}

            {/* ═══ VERIFY AUTHENTICITY BUTTON ═══ */}
            {canVerifyAuthenticity && (
              <button
                onClick={() => setShowVerifyDialog(true)}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck size={18} />
                Verify Authenticity
              </button>
            )}

            {/* ═══ EXTEND TESTING BUTTON ═══ */}
            {canExtendTesting && (
              <button
                onClick={() => setShowExtendDrawer(true)}
                className="w-full py-3.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold text-base rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Clock size={18} />
                Extend Testing Period
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                onClick={() => EscrowService.cancelEscrow(tx.id)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 font-semibold text-sm rounded-xl transition-colors"
              >
                Cancel Transaction
              </button>
            )}

            {/* Raise Dispute */}
            {canDispute && !showDispute && (
              <button
                onClick={() => setShowDispute(true)}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-sm rounded-xl transition-colors"
              >
                ⚠️ Raise a Dispute
              </button>
            )}
          </motion.div>
        )}

        {/* Dispute Form */}
        <AnimatePresence>
          {showDispute && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-red-200 rounded-xl p-4 mb-4 overflow-hidden"
            >
              <h4 className="font-bold text-sm text-gray-800 mb-1">Raise a Dispute</h4>
              <p className="text-xs text-gray-500 mb-3">
                Describe the issue. Our team will review and mediate.
              </p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="What's the problem? e.g. Item not as described, seller unresponsive..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowDispute(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispute}
                  disabled={!disputeReason.trim() || actionLoading}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 font-semibold text-sm rounded-lg disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ VERIFY AUTHENTICITY DIALOG ═══ */}
        <AnimatePresence>
          {showVerifyDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setShowVerifyDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="text-center mb-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck size={28} className="text-emerald-600" />
                  </div>
                  <h3 className="font-[family-name:var(--font-fredoka)] font-bold text-lg text-gray-900">
                    Verify Authenticity
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Confirm that this item is genuine and matches the listing description.
                  </p>
                </div>

                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Optional: Add verification notes..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-200 mb-4"
                />

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      This action confirms the item is authentic. You can still raise a dispute
                      for other issues during the testing period.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowVerifyDialog(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyAuthenticity}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-600 text-white font-semibold text-sm rounded-xl disabled:opacity-50"
                  >
                    {actionLoading ? "Verifying..." : "Confirm ✓"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ EXTEND TESTING DRAWER ═══ */}
        <AnimatePresence>
          {showExtendDrawer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowExtendDrawer(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-2xl p-6 w-full max-w-lg shadow-2xl"
              >
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <Clock size={28} className="text-orange-600" />
                  </div>
                  <h3 className="font-[family-name:var(--font-fredoka)] font-bold text-lg text-gray-900">
                    Extend Testing Period
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Need more time? Choose additional days to test the item.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[3, 5, 7].map((days) => (
                    <button
                      key={days}
                      onClick={() => setSelectedExtendDays(days)}
                      className={`py-4 rounded-xl text-center border-2 transition-all ${
                        selectedExtendDays === days
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-[family-name:var(--font-fredoka)] font-bold text-2xl">
                        +{days}
                      </div>
                      <div className="text-xs mt-1">days</div>
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5">
                  <p className="text-xs text-blue-700">
                    The seller will be notified and must approve the extension.
                    Maximum one extension per transaction (up to 21 days total).
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExtendDrawer(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExtendTesting}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-orange-500 text-white font-semibold text-sm rounded-xl disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Requesting..."
                      : `Request +${selectedExtendDays} Days`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline Toggle */}
        <button
          onClick={() => setShowTimeline((v) => !v)}
          className="w-full text-center text-sm text-gray-500 hover:text-blue-600 py-3 transition-colors"
        >
          {showTimeline ? "Hide" : "Show"} transaction history{" "}
          {showTimeline ? "▲" : "▼"}
        </button>

        {/* Escrow Timeline */}
        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-100 rounded-xl p-4 mb-4 overflow-hidden"
            >
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">
                Timeline
              </h3>
              <EscrowTimeline events={tx.timeline} currentState={tx.state} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-10" />
      </div>
    </div>
  );
};

// ─── Party Row ────────────────────────────────────────────────────────────────

interface PartyRowProps {
  party: import("@/types/escrow").EscrowParty;
  role: string;
  isSelf: boolean;
}

const PartyRow: React.FC<PartyRowProps> = ({ party, role, isSelf }) => (
  <div className="flex items-center gap-3 mb-3 last:mb-0">
    <div className="flex-shrink-0">
      {party.avatarUrl ? (
        <img
          src={party.avatarUrl}
          alt=""
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
          {party.displayName[0].toUpperCase()}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-sm text-gray-900">
          {party.displayName}
        </span>
        {isSelf && (
          <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            You
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">
        {role} · {party.campus} · ⭐ {party.rating.toFixed(1)}
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
        {party.xrplAddress.slice(0, 8)}...{party.xrplAddress.slice(-6)}
      </div>
    </div>
  </div>
);

// ─── EscrowListScreen Component ───────────────────────────────────────────────

export interface EscrowListProps {
  currentUserId: string;
  onSelectTransaction: (txId: string) => void;
  onBack: () => void;
}

export const EscrowListScreen: React.FC<EscrowListProps> = ({
  currentUserId,
  onSelectTransaction,
  onBack,
}) => {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<EscrowFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTransactions();
  }, [currentUserId]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await EscrowService.getUserTransactions(currentUserId);
      setTransactions(data);
    } finally {
      setIsLoading(false);
    }
  };

  const FILTERS: { value: EscrowFilter; label: string; icon: string }[] = [
    { value: "all", label: "All", icon: "📋" },
    { value: "active", label: "Active", icon: "⚡" },
    { value: "completed", label: "Done", icon: "✅" },
    { value: "buying", label: "Buying", icon: "🛒" },
    { value: "selling", label: "Selling", icon: "💰" },
    { value: "disputed", label: "Disputes", icon: "⚠️" },
  ];

  const filtered = transactions
    .filter((tx) => {
      switch (filter) {
        case "buying":
          return tx.buyer.id === currentUserId;
        case "selling":
          return tx.seller.id === currentUserId;
        case "active":
          return ["created", "pending", "active", "item_sent", "testing"].includes(tx.state);
        case "completed":
          return ["completed", "refunded", "cancelled"].includes(tx.state);
        case "disputed":
          return tx.state === "disputed";
        default:
          return true;
      }
    })
    .filter((tx) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tx.listingTitle.toLowerCase().includes(q) ||
        tx.buyer.displayName.toLowerCase().includes(q) ||
        tx.seller.displayName.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q)
      );
    });

  // Stats
  const totalTxCount = transactions.length;
  const activeTxCount = transactions.filter((tx) =>
    ["created", "pending", "active", "item_sent", "testing"].includes(tx.state)
  ).length;
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.totalXRP, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-[family-name:var(--font-fredoka)] font-bold text-lg text-gray-900">
            My Orders
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3 mt-4 mb-4"
        >
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className="font-[family-name:var(--font-fredoka)] font-bold text-xl text-gray-900">
              {totalTxCount}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              Total Orders
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className="font-[family-name:var(--font-fredoka)] font-bold text-xl text-blue-700">
              {activeTxCount}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              Active
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <div className="font-[family-name:var(--font-fredoka)] font-bold text-xl text-emerald-600">
              {totalVolume.toFixed(1)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              XRP Volume
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.value
                  ? "bg-blue-700 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-sm">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="escrow-skeleton h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="text-5xl mb-4">
              <Package size={48} className="mx-auto text-gray-300" />
            </div>
            <h3 className="font-[family-name:var(--font-fredoka)] font-bold text-lg text-gray-500 mb-1">
              {searchQuery ? "No matching orders" : "No transactions yet"}
            </h3>
            <p className="text-sm text-gray-400">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Your orders will appear here once you start buying or selling"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5 mt-2"
          >
            {filtered.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <TransactionCard
                  transaction={tx}
                  currentUserId={currentUserId}
                  onClick={onSelectTransaction}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EscrowStatus;
