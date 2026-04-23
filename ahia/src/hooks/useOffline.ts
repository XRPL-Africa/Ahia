"use client";
// src/hooks/useOffline.ts
// Reactive hook over OfflineService. Subscribes to state changes.

import { useState, useEffect, useCallback } from "react";
import OfflineService, {
  type OfflineState,
  type QueuedAction,
  type ConflictResolution,
} from "@/services/offline.service";

export interface UseOfflineReturn {
  isOnline: boolean;
  state: OfflineState;
  queue: QueuedAction[];
  pendingActions: QueuedAction[];
  failedActions: QueuedAction[];
  conflictActions: QueuedAction[];
  syncQueue: () => Promise<void>;
  retryFailed: (id: string) => Promise<void>;
  resolveConflict: (resolution: ConflictResolution) => Promise<void>;
  dequeue: (id: string) => void;
  clearSynced: () => void;
}

export const useOffline = (): UseOfflineReturn => {
  const [state, setState] = useState<OfflineState>(() => OfflineService.getState());
  const [queue, setQueue] = useState<QueuedAction[]>(() => OfflineService.getQueue());

  useEffect(() => {
    // Subscribe to OfflineService state changes
    const unsubscribe = OfflineService.subscribe((newState) => {
      setState(newState);
      setQueue(OfflineService.getQueue());
    });

    // Initialise event listeners (online/offline)
    const cleanup = OfflineService.init();

    return () => {
      unsubscribe();
      cleanup();
    };
  }, []);

  const syncQueue = useCallback(() => OfflineService.syncQueue(), []);
  const retryFailed = useCallback((id: string) => OfflineService.retryFailed(id), []);
  const resolveConflict = useCallback(
    (resolution: ConflictResolution) => OfflineService.resolveConflict(resolution),
    []
  );
  const dequeue = useCallback((id: string) => OfflineService.dequeue(id), []);
  const clearSynced = useCallback(() => OfflineService.clearSynced(), []);

  return {
    isOnline: state.isOnline,
    state,
    queue,
    pendingActions: queue.filter((a) => a.status === "pending" || a.status === "syncing"),
    failedActions: queue.filter((a) => a.status === "failed"),
    conflictActions: queue.filter((a) => a.status === "conflict"),
    syncQueue,
    retryFailed,
    resolveConflict,
    dequeue,
    clearSynced,
  };
};
