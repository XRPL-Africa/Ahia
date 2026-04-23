"use client";
// src/components/offline/OfflineUI.tsx
// Three components:
//   OfflineBanner       — sticky top bar shown when offline
//   PendingActionsDrawer — slide-up sheet of queued/failed/conflict actions
//   ConflictModal       — per-conflict resolution dialog

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WifiOff,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GitMerge,
  Trash2,
  RotateCcw,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useOffline } from "@/hooks/useOffline";
import { Button } from "@/components/ui/Button";
import { type QueuedAction, type ConflictResolution } from "@/services/offline.service";
import { cn } from "@/lib/utils";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Pending",
  },
  syncing: {
    icon: Loader2,
    color: "text-ahia-trust",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: "Syncing…",
  },
  synced: {
    icon: CheckCircle2,
    color: "text-ahia-success",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Synced",
  },
  failed: {
    icon: XCircle,
    color: "text-ahia-red",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Failed",
  },
  conflict: {
    icon: GitMerge,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
    label: "Conflict",
  },
} as const;

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ─── OfflineBanner ─────────────────────────────────────────────────────────────

export function OfflineBanner() {
  const { isOnline, state, syncQueue, pendingActions } = useOffline();
  const [justReconnected, setJustReconnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Show a brief "back online" flash
  useEffect(() => {
    if (isOnline && state.pendingCount === 0 && !justReconnected) return;
    if (isOnline) {
      setJustReconnected(true);
      const t = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  const handleSync = async () => {
    setSyncing(true);
    await syncQueue();
    setSyncing(false);
  };

  const showBanner = !isOnline || justReconnected || state.pendingCount > 0 || state.failedCount > 0 || state.conflictCount > 0;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={cn(
            "sticky top-20 z-40 w-full px-4 py-2.5 flex items-center gap-3 text-sm font-fredoka font-medium shadow-sm border-b",
            !isOnline
              ? "bg-gray-800 text-white border-gray-700"
              : justReconnected && state.pendingCount === 0
              ? "bg-green-50 text-green-700 border-green-200"
              : state.conflictCount > 0
              ? "bg-purple-50 text-purple-700 border-purple-200"
              : state.failedCount > 0
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          )}
        >
          {/* Icon */}
          {!isOnline ? (
            <WifiOff size={16} className="shrink-0" />
          ) : justReconnected && state.pendingCount === 0 ? (
            <CheckCircle2 size={16} className="shrink-0 text-ahia-success" />
          ) : syncing ? (
            <Loader2 size={16} className="shrink-0 animate-spin" />
          ) : state.conflictCount > 0 ? (
            <GitMerge size={16} className="shrink-0" />
          ) : state.failedCount > 0 ? (
            <AlertTriangle size={16} className="shrink-0" />
          ) : (
            <Clock size={16} className="shrink-0" />
          )}

          {/* Message */}
          <span className="flex-1">
            {!isOnline
              ? "You're offline — changes will sync when you reconnect"
              : justReconnected && state.pendingCount === 0
              ? "Back online — everything synced ✓"
              : state.conflictCount > 0
              ? `${state.conflictCount} conflict${state.conflictCount > 1 ? "s" : ""} need your attention`
              : state.failedCount > 0
              ? `${state.failedCount} action${state.failedCount > 1 ? "s" : ""} failed to sync`
              : `${state.pendingCount} action${state.pendingCount > 1 ? "s" : ""} waiting to sync`}
          </span>

          {/* Action */}
          {isOnline && state.pendingCount > 0 && !syncing && (
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-semibold transition-colors hover:bg-white/60"
            >
              <RefreshCw size={12} /> Sync now
            </button>
          )}
          {syncing && (
            <span className="text-xs opacity-60">Syncing…</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── PendingActionsDrawer ─────────────────────────────────────────────────────

export function PendingActionsDrawer() {
  const { queue, pendingActions, failedActions, conflictActions, retryFailed, dequeue, clearSynced, syncQueue } = useOffline();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [conflictTarget, setConflictTarget] = useState<QueuedAction | null>(null);

  const visibleActions = queue.filter((a) => a.status !== "synced");
  const totalActive = pendingActions.length + failedActions.length + conflictActions.length;

  if (totalActive === 0 && queue.every((a) => a.status === "synced")) return null;

  const handleSync = async () => {
    setSyncing(true);
    await syncQueue();
    setSyncing(false);
  };

  return (
    <>
      {/* Floating trigger */}
      <AnimatePresence>
        {totalActive > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl font-fredoka font-semibold text-sm text-white",
              conflictActions.length > 0
                ? "bg-purple-600"
                : failedActions.length > 0
                ? "bg-ahia-red"
                : "bg-ahia-sunset"
            )}
          >
            <Clock size={16} />
            {totalActive} pending
            <ChevronUp size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                  <h2 className="font-fredoka font-bold text-lg text-gray-800">
                    Pending Actions
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {totalActive} action{totalActive !== 1 ? "s" : ""} waiting to sync
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSync}
                    disabled={syncing}
                    className="text-ahia-trust font-fredoka"
                  >
                    {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {syncing ? "Syncing…" : "Sync all"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { clearSynced(); setOpen(false); }}
                    className="text-gray-400"
                  >
                    Clear synced
                  </Button>
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                {visibleActions.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle2 size={40} className="mx-auto mb-3 text-ahia-success" />
                    <p className="font-fredoka font-semibold">All synced!</p>
                  </div>
                ) : (
                  visibleActions.map((action) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      onRetry={() => retryFailed(action.id)}
                      onDismiss={() => dequeue(action.id)}
                      onResolveConflict={() => setConflictTarget(action)}
                    />
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Conflict modal */}
      {conflictTarget && (
        <ConflictModal
          action={conflictTarget}
          onClose={() => setConflictTarget(null)}
        />
      )}
    </>
  );
}

// ─── ActionRow ────────────────────────────────────────────────────────────────

function ActionRow({
  action,
  onRetry,
  onDismiss,
  onResolveConflict,
}: {
  action: QueuedAction;
  onRetry: () => void;
  onDismiss: () => void;
  onResolveConflict: () => void;
}) {
  const cfg = STATUS_CONFIG[action.status];
  const Icon = cfg.icon;

  return (
    <div className={cn("flex items-start gap-3 p-3.5 rounded-xl border", cfg.bg, cfg.border)}>
      <div className={cn("mt-0.5 shrink-0", cfg.color)}>
        <Icon size={18} className={action.status === "syncing" ? "animate-spin" : ""} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-fredoka font-semibold text-sm text-gray-800">
            {action.label}
          </span>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Queued at {formatTime(action.createdAt)}
          {action.retries > 0 && ` · ${action.retries} retr${action.retries === 1 ? "y" : "ies"}`}
        </p>
        {action.errorMessage && (
          <p className="text-xs text-ahia-red mt-1">{action.errorMessage}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {action.status === "failed" && (
          <button
            onClick={onRetry}
            title="Retry"
            className="p-1.5 rounded-lg text-gray-400 hover:text-ahia-trust hover:bg-white transition-colors"
          >
            <RotateCcw size={15} />
          </button>
        )}
        {action.status === "conflict" && (
          <button
            onClick={onResolveConflict}
            title="Resolve conflict"
            className="px-2.5 py-1 rounded-lg text-purple-600 bg-white border border-purple-200 text-xs font-fredoka font-semibold hover:bg-purple-50 transition-colors"
          >
            Resolve
          </button>
        )}
        {["failed", "conflict"].includes(action.status) && (
          <button
            onClick={onDismiss}
            title="Dismiss"
            className="p-1.5 rounded-lg text-gray-300 hover:text-ahia-red hover:bg-white transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ConflictModal ────────────────────────────────────────────────────────────

function ConflictModal({
  action,
  onClose,
}: {
  action: QueuedAction;
  onClose: () => void;
}) {
  const { resolveConflict } = useOffline();
  const [resolving, setResolving] = useState(false);

  const handleResolve = async (strategy: ConflictResolution["strategy"]) => {
    setResolving(true);
    await resolveConflict({ actionId: action.id, strategy });
    setResolving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <GitMerge className="text-purple-500" size={20} />
            </div>
            <div>
              <h3 className="font-fredoka font-bold text-gray-800 text-lg">Sync Conflict</h3>
              <p className="text-xs text-gray-400">"{action.label}" — server has a newer version</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            This change was made while offline, but someone else updated this resource in the meantime. How would you like to resolve it?
          </p>

          <div className="space-y-2.5">
            {/* Keep local */}
            <button
              onClick={() => handleResolve("keep_local")}
              disabled={resolving}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-ahia-sunset hover:bg-ahia-sunset/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-ahia-sunset/10 flex items-center justify-center">
                  <RotateCcw size={16} className="text-ahia-sunset" />
                </div>
                <div>
                  <p className="font-fredoka font-semibold text-sm text-gray-800">Keep my changes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Overwrite the server version with your offline edit</p>
                </div>
              </div>
            </button>

            {/* Keep server */}
            <button
              onClick={() => handleResolve("keep_server")}
              disabled={resolving}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-ahia-trust hover:bg-ahia-trust/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-ahia-trust" />
                </div>
                <div>
                  <p className="font-fredoka font-semibold text-sm text-gray-800">Use server version</p>
                  <p className="text-xs text-gray-400 mt-0.5">Discard your offline edit and use the latest server data</p>
                </div>
              </div>
            </button>

            {/* Dismiss */}
            <button
              onClick={onClose}
              disabled={resolving}
              className="w-full py-2.5 text-sm font-fredoka font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Decide later
            </button>
          </div>

          {resolving && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Resolving…
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
