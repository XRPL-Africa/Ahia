// src/services/offline.service.ts
// Ahia Campus Marketplace — Offline Support Service
// Handles: listing cache, action queue, sync-on-reconnect, conflict resolution

"use client";

import api from "./api";
import { Listing } from "@/types/listing";

// ─── Types ──────────────────────────────────────────────────────────────────────

export type QueuedActionType =
  | "CREATE_LISTING"
  | "UPDATE_LISTING"
  | "DELETE_LISTING"
  | "SEND_MESSAGE"
  | "CONFIRM_RECEIPT"
  | "MARK_ITEM_SENT"
  | "RAISE_DISPUTE"
  | "PLACE_BID";

export type QueuedActionStatus =
  | "pending"    // Waiting to be synced
  | "syncing"    // Currently being sent
  | "synced"     // Successfully sent
  | "failed"     // Exhausted retries
  | "conflict";  // Server returned a conflict

export interface QueuedAction {
  id: string;
  type: QueuedActionType;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  payload: Record<string, unknown>;
  status: QueuedActionStatus;
  retries: number;
  maxRetries: number;
  createdAt: string;
  lastAttemptAt?: string;
  errorMessage?: string;
  /** Server version of the resource, used for conflict detection */
  serverVersion?: number;
  /** Human-readable label shown in pending actions list */
  label: string;
}

export interface ConflictResolution {
  actionId: string;
  strategy: "keep_local" | "keep_server" | "merge";
  mergedPayload?: Record<string, unknown>;
}

export interface OfflineState {
  isOnline: boolean;
  lastOnlineAt: string | null;
  cachedListingsAt: string | null;
  queueLength: number;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────────

const KEYS = {
  LISTINGS_CACHE: "ahia_offline_listings",
  ACTION_QUEUE: "ahia_offline_queue",
  LAST_ONLINE: "ahia_last_online",
  CACHE_TIMESTAMP: "ahia_cache_ts",
} as const;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;
const SYNC_DEBOUNCE_MS = 1500;

// ─── Internal helpers ────────────────────────────────────────────────────────────

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // localStorage quota exceeded — prune old cache
    console.warn("[Offline] localStorage write failed, pruning cache:", e);
    OfflineService.pruneCache();
  }
}

// ─── Action label map ────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<QueuedActionType, string> = {
  CREATE_LISTING: "New listing",
  UPDATE_LISTING: "Listing update",
  DELETE_LISTING: "Delete listing",
  SEND_MESSAGE: "Message",
  CONFIRM_RECEIPT: "Confirm receipt",
  MARK_ITEM_SENT: "Mark as dispatched",
  RAISE_DISPUTE: "Dispute",
  PLACE_BID: "Bid",
};

// ─── Main Service ────────────────────────────────────────────────────────────────

export const OfflineService = {
  _syncTimer: null as ReturnType<typeof setTimeout> | null,
  _listeners: new Set<(state: OfflineState) => void>(),
  _isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  /**
   * Call once on app mount. Wires online/offline events and attempts
   * an initial sync if we're already online with pending actions.
   */
  init: (): (() => void) => {
    if (typeof window === "undefined") return () => {};

    const handleOnline = () => {
      OfflineService._isOnline = true;
      writeJSON(KEYS.LAST_ONLINE, new Date().toISOString());
      OfflineService._notifyListeners();
      // Debounced sync — avoid hammering on flaky connections
      if (OfflineService._syncTimer) clearTimeout(OfflineService._syncTimer);
      OfflineService._syncTimer = setTimeout(
        () => OfflineService.syncQueue(),
        SYNC_DEBOUNCE_MS
      );
    };

    const handleOffline = () => {
      OfflineService._isOnline = false;
      OfflineService._notifyListeners();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sync on init if online + has pending
    if (OfflineService._isOnline) {
      const queue = OfflineService.getQueue();
      const hasPending = queue.some((a) => a.status === "pending");
      if (hasPending) OfflineService.syncQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (OfflineService._syncTimer) clearTimeout(OfflineService._syncTimer);
    };
  },

  // ── Listing Cache ────────────────────────────────────────────────────────────

  /**
   * Save listings to localStorage for offline viewing.
   */
  cacheListings: (listings: Listing[]): void => {
    writeJSON(KEYS.LISTINGS_CACHE, listings);
    writeJSON(KEYS.CACHE_TIMESTAMP, new Date().toISOString());
    OfflineService._notifyListeners();
  },

  /**
   * Read cached listings. Returns null if cache is stale (>30 min) or empty.
   */
  getCachedListings: (): Listing[] | null => {
    const ts = readJSON<string | null>(KEYS.CACHE_TIMESTAMP, null);
    if (!ts) return null;
    const age = Date.now() - new Date(ts).getTime();
    if (age > CACHE_TTL_MS) return null;
    return readJSON<Listing[]>(KEYS.LISTINGS_CACHE, []);
  },

  /**
   * Returns cached listings regardless of TTL — used as fallback when offline.
   */
  getCachedListingsFallback: (): Listing[] => {
    return readJSON<Listing[]>(KEYS.LISTINGS_CACHE, []);
  },

  /**
   * Update a single cached listing in place (after local mutation).
   */
  patchCachedListing: (id: string, updates: Partial<Listing>): void => {
    const cached = OfflineService.getCachedListingsFallback();
    const updated = cached.map((l) => (l.id === id ? { ...l, ...updates } : l));
    writeJSON(KEYS.LISTINGS_CACHE, updated);
  },

  /**
   * Remove a listing from cache (after delete action queued).
   */
  removeCachedListing: (id: string): void => {
    const cached = OfflineService.getCachedListingsFallback();
    writeJSON(KEYS.LISTINGS_CACHE, cached.filter((l) => l.id !== id));
  },

  /**
   * Prune cache to free space (keeps most recent 50 listings).
   */
  pruneCache: (): void => {
    const cached = OfflineService.getCachedListingsFallback();
    writeJSON(KEYS.LISTINGS_CACHE, cached.slice(-50));
  },

  isCacheStale: (): boolean => {
    const ts = readJSON<string | null>(KEYS.CACHE_TIMESTAMP, null);
    if (!ts) return true;
    return Date.now() - new Date(ts).getTime() > CACHE_TTL_MS;
  },

  // ── Action Queue ─────────────────────────────────────────────────────────────

  getQueue: (): QueuedAction[] => {
    return readJSON<QueuedAction[]>(KEYS.ACTION_QUEUE, []);
  },

  _saveQueue: (queue: QueuedAction[]): void => {
    writeJSON(KEYS.ACTION_QUEUE, queue);
    OfflineService._notifyListeners();
  },

  /**
   * Add an action to the offline queue.
   * If online, immediately attempt to sync it.
   */
  enqueue: (
    type: QueuedActionType,
    method: QueuedAction["method"],
    endpoint: string,
    payload: Record<string, unknown>,
    options?: { maxRetries?: number; serverVersion?: number }
  ): QueuedAction => {
    const action: QueuedAction = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      endpoint,
      method,
      payload,
      status: "pending",
      retries: 0,
      maxRetries: options?.maxRetries ?? MAX_RETRIES,
      createdAt: new Date().toISOString(),
      serverVersion: options?.serverVersion,
      label: ACTION_LABELS[type] ?? type,
    };

    const queue = OfflineService.getQueue();
    queue.push(action);
    OfflineService._saveQueue(queue);

    // If online, kick off sync immediately
    if (OfflineService._isOnline) {
      setTimeout(() => OfflineService.syncQueue(), 0);
    }

    return action;
  },

  /**
   * Remove a specific action from the queue (e.g. user manually dismisses it).
   */
  dequeue: (actionId: string): void => {
    const queue = OfflineService.getQueue().filter((a) => a.id !== actionId);
    OfflineService._saveQueue(queue);
  },

  /**
   * Clear all synced actions from the queue (housekeeping).
   */
  clearSynced: (): void => {
    const queue = OfflineService.getQueue().filter((a) => a.status !== "synced");
    OfflineService._saveQueue(queue);
  },

  // ── Sync Engine ──────────────────────────────────────────────────────────────

  /**
   * Process all pending actions in FIFO order.
   * Skips failed/conflict/syncing actions.
   * Called automatically on reconnect and on enqueue when online.
   */
  syncQueue: async (): Promise<void> => {
    if (!OfflineService._isOnline) return;

    const queue = OfflineService.getQueue();
    const pending = queue.filter((a) => a.status === "pending");
    if (pending.length === 0) return;

    for (const action of pending) {
      await OfflineService._processAction(action);
    }
  },

  _processAction: async (action: QueuedAction): Promise<void> => {
    // Mark as syncing
    OfflineService._updateActionStatus(action.id, "syncing");

    try {
      const response = await api.request({
        method: action.method,
        url: action.endpoint,
        data: action.payload,
        headers: action.serverVersion
          ? { "If-Match": String(action.serverVersion) }
          : undefined,
      });

      // 409 Conflict — server has a newer version
      if (response.status === 409) {
        OfflineService._updateActionStatus(action.id, "conflict", {
          errorMessage: "Server has a newer version of this resource.",
        });
        return;
      }

      OfflineService._updateActionStatus(action.id, "synced");

      // Patch local cache with server response if applicable
      if (
        ["CREATE_LISTING", "UPDATE_LISTING"].includes(action.type) &&
        response.data?.id
      ) {
        OfflineService.patchCachedListing(response.data.id, response.data);
      }
      if (action.type === "DELETE_LISTING" && action.payload.id) {
        OfflineService.removeCachedListing(action.payload.id as string);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      // 409 conflict from axios error path
      if (status === 409) {
        OfflineService._updateActionStatus(action.id, "conflict", {
          errorMessage: "Server conflict: resource was modified externally.",
        });
        return;
      }

      const newRetries = action.retries + 1;
      if (newRetries >= action.maxRetries) {
        OfflineService._updateActionStatus(action.id, "failed", {
          retries: newRetries,
          errorMessage: `Failed after ${newRetries} attempts`,
        });
      } else {
        // Back to pending — will retry on next sync
        OfflineService._updateActionStatus(action.id, "pending", {
          retries: newRetries,
          lastAttemptAt: new Date().toISOString(),
        });
      }
    }
  },

  _updateActionStatus: (
    id: string,
    status: QueuedActionStatus,
    extras?: Partial<QueuedAction>
  ): void => {
    const queue = OfflineService.getQueue().map((a) =>
      a.id === id ? { ...a, status, ...extras } : a
    );
    OfflineService._saveQueue(queue);
  },

  // ── Conflict Resolution ──────────────────────────────────────────────────────

  /**
   * Resolve a conflict action.
   * - keep_local: re-submit the queued payload, ignoring server version
   * - keep_server: discard the queued action
   * - merge: submit a merged payload provided by the caller
   */
  resolveConflict: async (resolution: ConflictResolution): Promise<void> => {
    const queue = OfflineService.getQueue();
    const action = queue.find((a) => a.id === resolution.actionId);
    if (!action) return;

    if (resolution.strategy === "keep_server") {
      OfflineService.dequeue(resolution.actionId);
      return;
    }

    const payload =
      resolution.strategy === "merge" && resolution.mergedPayload
        ? resolution.mergedPayload
        : action.payload;

    // Reset to pending with updated payload, strip version header so server accepts
    OfflineService._updateActionStatus(resolution.actionId, "pending", {
      payload,
      serverVersion: undefined,
      retries: 0,
      errorMessage: undefined,
    });

    if (OfflineService._isOnline) {
      await OfflineService.syncQueue();
    }
  },

  /**
   * Re-queue a failed action for retry.
   */
  retryFailed: async (actionId: string): Promise<void> => {
    OfflineService._updateActionStatus(actionId, "pending", {
      retries: 0,
      errorMessage: undefined,
    });
    if (OfflineService._isOnline) {
      await OfflineService.syncQueue();
    }
  },

  // ── State & Observers ────────────────────────────────────────────────────────

  getState: (): OfflineState => {
    const queue = OfflineService.getQueue();
    return {
      isOnline: OfflineService._isOnline,
      lastOnlineAt: readJSON<string | null>(KEYS.LAST_ONLINE, null),
      cachedListingsAt: readJSON<string | null>(KEYS.CACHE_TIMESTAMP, null),
      queueLength: queue.length,
      pendingCount: queue.filter((a) => a.status === "pending" || a.status === "syncing").length,
      failedCount: queue.filter((a) => a.status === "failed").length,
      conflictCount: queue.filter((a) => a.status === "conflict").length,
    };
  },

  subscribe: (listener: (state: OfflineState) => void): (() => void) => {
    OfflineService._listeners.add(listener);
    return () => OfflineService._listeners.delete(listener);
  },

  _notifyListeners: (): void => {
    const state = OfflineService.getState();
    OfflineService._listeners.forEach((l) => l(state));
  },
};

export default OfflineService;
