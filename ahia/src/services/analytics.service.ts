// src/services/analytics.service.ts
// Ahia Campus Marketplace — Analytics Service
// Covers: user actions, screen views, conversion funnels, error tracking,
//         behavior analytics, custom events. All dispatched to /api/analytics.

"use client";

import api from "./api";

// ─── Core Event Types ──────────────────────────────────────────────────────────

/** Auth lifecycle */
export type AuthEvent =
  | "login"
  | "login_failed"
  | "signup_started"
  | "signup_completed"
  | "signup_failed"
  | "logout"
  | "session_restored"
  | "verification_submitted"
  | "verification_approved"
  | "verification_rejected";

/** Marketplace & listings */
export type ListingEvent =
  | "listing_viewed"
  | "listing_created"
  | "listing_edited"
  | "listing_deleted"
  | "listing_searched"
  | "listing_filtered"
  | "listing_shared"
  | "image_expanded"
  | "seller_profile_viewed";

/** Purchase & escrow funnel */
export type EscrowEvent =
  | "bid_placed"
  | "bid_accepted"
  | "bid_declined"
  | "escrow_initiated"
  | "escrow_confirmed"
  | "item_dispatched"
  | "receipt_confirmed"
  | "dispute_raised"
  | "dispute_resolved"
  | "escrow_cancelled"
  | "escrow_expired"
  | "escrow_refunded";

/** Chat & messaging */
export type ChatEvent =
  | "chat_opened"
  | "message_sent"
  | "image_sent"
  | "listing_shared_in_chat"
  | "escrow_link_sent";

/** Wallet & payments */
export type WalletEvent =
  | "wallet_connected"
  | "wallet_disconnected"
  | "offramp_initiated"
  | "offramp_completed"
  | "offramp_failed";

/** Navigation & UX */
export type UXEvent =
  | "screen_view"
  | "tab_changed"
  | "search_performed"
  | "filter_applied"
  | "pull_to_refresh"
  | "notification_settings_opened"
  | "onboarding_step_completed"
  | "onboarding_skipped";

/** Errors */
export type ErrorEvent =
  | "api_error"
  | "network_error"
  | "js_error"
  | "promise_rejection"
  | "render_error";

export type AhiaEventName =
  | AuthEvent
  | ListingEvent
  | EscrowEvent
  | ChatEvent
  | WalletEvent
  | UXEvent
  | ErrorEvent
  | (string & {}); // allow custom events

// ─── Event payload ─────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  name: AhiaEventName;
  /** Resolved automatically — override only if needed */
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  screen?: string;
  /** Arbitrary structured properties */
  properties?: Record<string, unknown>;
}

// ─── Funnel definitions ────────────────────────────────────────────────────────

export type FunnelId =
  | "signup"
  | "listing_creation"
  | "purchase"
  | "verification"
  | "wallet_setup";

export const FUNNELS: Record<FunnelId, AhiaEventName[]> = {
  signup: [
    "signup_started",
    "verification_submitted",
    "verification_approved",
  ],
  listing_creation: [
    "listing_viewed",
    "listing_created",
  ],
  purchase: [
    "listing_viewed",
    "bid_placed",
    "bid_accepted",
    "escrow_initiated",
    "escrow_confirmed",
    "item_dispatched",
    "receipt_confirmed",
  ],
  verification: [
    "signup_completed",
    "verification_submitted",
    "verification_approved",
  ],
  wallet_setup: [
    "signup_completed",
    "wallet_connected",
  ],
};

// ─── User behavior session ─────────────────────────────────────────────────────

interface BehaviorSession {
  sessionId: string;
  startedAt: number;
  userId: string | null;
  screenPath: string[];           // ordered list of screens visited
  eventCounts: Record<string, number>;
  funnelProgress: Record<FunnelId, number>; // step index reached
}

// ─── Error context ─────────────────────────────────────────────────────────────

export interface ErrorContext {
  message: string;
  stack?: string;
  screen?: string;
  userId?: string;
  /** Additional structured context (component name, action, etc.) */
  context?: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
}

// ─── Storage & batching ────────────────────────────────────────────────────────

const QUEUE_KEY = "ahia_analytics_queue";
const SESSION_KEY = "ahia_analytics_session";
const FLUSH_INTERVAL_MS = 8_000;
const MAX_QUEUE_SIZE = 200;

let flushTimer: ReturnType<typeof setInterval> | null = null;

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota — noop, in-memory queue still works
  }
}

// ─── Session helpers ───────────────────────────────────────────────────────────

function makeSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSession(userId: string | null): BehaviorSession {
  const stored = readLocal<BehaviorSession | null>(SESSION_KEY, null);

  // Reuse if < 30 min old and same user
  if (stored && Date.now() - stored.startedAt < 30 * 60_000 && stored.userId === userId) {
    return stored;
  }

  const fresh: BehaviorSession = {
    sessionId: makeSessionId(),
    startedAt: Date.now(),
    userId,
    screenPath: [],
    eventCounts: {},
    funnelProgress: {
      signup: 0,
      listing_creation: 0,
      purchase: 0,
      verification: 0,
      wallet_setup: 0,
    },
  };

  writeLocal(SESSION_KEY, fresh);
  return fresh;
}

function saveSession(session: BehaviorSession): void {
  writeLocal(SESSION_KEY, session);
}

// ─── Main Service ──────────────────────────────────────────────────────────────

export const AnalyticsService = {

  // Internal state
  _userId: null as string | null,
  _currentScreen: "/" as string,
  _session: null as BehaviorSession | null,

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  /**
   * Initialise once after auth rehydrates.
   * Sets userId, creates/restores session, starts flush interval.
   * Returns cleanup fn for useEffect.
   */
  init: (userId: string | null): (() => void) => {
    AnalyticsService._userId = userId;
    AnalyticsService._session = getOrCreateSession(userId);

    // Global JS error capture
    const handleError = (event: ErrorEvent) => {
      AnalyticsService.trackError({
        message: event.message ?? "Unknown error",
        stack: event.error?.stack,
        screen: AnalyticsService._currentScreen,
        userId: AnalyticsService._userId ?? undefined,
        severity: "high",
        context: { filename: event.filename, lineno: event.lineno },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      AnalyticsService.trackError({
        message: String(event.reason?.message ?? event.reason ?? "Unhandled rejection"),
        stack: event.reason?.stack,
        screen: AnalyticsService._currentScreen,
        userId: AnalyticsService._userId ?? undefined,
        severity: "high",
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("error", handleError);
      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      // Flush on tab hide
      const handleVisibility = () => {
        if (document.visibilityState === "hidden") AnalyticsService.flush();
      };
      document.addEventListener("visibilitychange", handleVisibility);

      // Periodic flush
      flushTimer = setInterval(AnalyticsService.flush, FLUSH_INTERVAL_MS);

      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        document.removeEventListener("visibilitychange", handleVisibility);
        if (flushTimer) clearInterval(flushTimer);
        AnalyticsService.flush();
      };
    }

    return () => {};
  },

  /**
   * Update userId mid-session (e.g. after login).
   */
  identify: (userId: string | null): void => {
    AnalyticsService._userId = userId;
    if (AnalyticsService._session) {
      AnalyticsService._session.userId = userId;
      saveSession(AnalyticsService._session);
    }
  },

  // ── Screen View Tracking ─────────────────────────────────────────────────────

  /**
   * Record a screen/page view. Call from page components on mount.
   */
  trackScreen: (screen: string, properties?: Record<string, unknown>): void => {
    AnalyticsService._currentScreen = screen;

    const session = AnalyticsService._getSession();
    session.screenPath.push(screen);
    saveSession(session);

    AnalyticsService._enqueue({
      name: "screen_view",
      screen,
      properties: {
        title: typeof document !== "undefined" ? document.title : "",
        referrer: session.screenPath[session.screenPath.length - 2] ?? null,
        ...properties,
      },
    });
  },

  // ── User Action Tracking ─────────────────────────────────────────────────────

  /**
   * Track any named event with optional properties.
   * This is the primary tracking method — all helpers below call this.
   */
  track: (
    name: AhiaEventName,
    properties?: Record<string, unknown>
  ): void => {
    const session = AnalyticsService._getSession();

    // Update event count in session
    session.eventCounts[name] = (session.eventCounts[name] ?? 0) + 1;

    // Advance any matching funnel steps
    AnalyticsService._advanceFunnels(name, session);
    saveSession(session);

    AnalyticsService._enqueue({ name, properties });

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] 📊 ${name}`, properties ?? "");
    }
  },

  // ── Auth events (convenience wrappers) ────────────────────────────────────

  trackLogin: (method: "email" | "google" | "apple", campus: string) => {
    AnalyticsService.track("login", { method, campus });
  },

  trackLoginFailed: (reason: string) => {
    AnalyticsService.track("login_failed", { reason });
  },

  trackSignupStarted: (campus: string) => {
    AnalyticsService.track("signup_started", { campus });
  },

  trackSignupCompleted: (campus: string, method: string) => {
    AnalyticsService.track("signup_completed", { campus, method });
  },

  trackLogout: () => {
    AnalyticsService.track("logout");
    // End session on logout
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    AnalyticsService._session = null;
  },

  trackVerificationSubmitted: (campus: string) => {
    AnalyticsService.track("verification_submitted", { campus });
  },

  trackVerificationResult: (result: "approved" | "rejected", campus: string) => {
    AnalyticsService.track(
      result === "approved" ? "verification_approved" : "verification_rejected",
      { campus }
    );
  },

  // ── Listing events ────────────────────────────────────────────────────────

  trackListingViewed: (listingId: string, category: string, priceXRP: number, campus: string) => {
    AnalyticsService.track("listing_viewed", { listingId, category, priceXRP, campus });
  },

  trackListingCreated: (listingId: string, category: string, priceXRP: number) => {
    AnalyticsService.track("listing_created", { listingId, category, priceXRP });
  },

  trackSearch: (query: string, resultCount: number, campus: string) => {
    AnalyticsService.track("listing_searched", { query, resultCount, campus });
  },

  trackFilter: (filterType: string, value: string) => {
    AnalyticsService.track("listing_filtered", { filterType, value });
  },

  // ── Escrow / purchase funnel ──────────────────────────────────────────────

  trackBidPlaced: (listingId: string, amountXRP: number) => {
    AnalyticsService.track("bid_placed", { listingId, amountXRP });
  },

  trackEscrowInitiated: (transactionId: string, amountXRP: number, campus: string) => {
    AnalyticsService.track("escrow_initiated", { transactionId, amountXRP, campus });
  },

  trackEscrowCompleted: (transactionId: string, amountXRP: number, durationMs: number) => {
    AnalyticsService.track("receipt_confirmed", { transactionId, amountXRP, durationMs });
  },

  trackDisputeRaised: (transactionId: string, reason: string) => {
    AnalyticsService.track("dispute_raised", { transactionId, reason: reason.slice(0, 120) });
  },

  // ── Chat events ───────────────────────────────────────────────────────────

  trackChatOpened: (chatId: string, context: "listing" | "order" | "direct") => {
    AnalyticsService.track("chat_opened", { chatId, context });
  },

  trackMessageSent: (chatId: string, type: "text" | "image" | "listing_preview" | "escrow_link") => {
    AnalyticsService.track("message_sent", { chatId, type });
  },

  // ── Wallet events ─────────────────────────────────────────────────────────

  trackWalletConnected: (addressPrefix: string) => {
    // Never log full address — prefix only
    AnalyticsService.track("wallet_connected", { addressPrefix });
  },

  trackOfframp: (stage: "initiated" | "completed" | "failed", amountXRP: number) => {
    const eventMap = {
      initiated: "offramp_initiated",
      completed: "offramp_completed",
      failed: "offramp_failed",
    } as const;
    AnalyticsService.track(eventMap[stage], { amountXRP });
  },

  // ── Custom events ─────────────────────────────────────────────────────────

  /**
   * Track any arbitrary named event.
   * Use for one-offs that don't fit existing categories.
   */
  custom: (name: string, properties?: Record<string, unknown>): void => {
    AnalyticsService.track(`custom:${name}`, properties);
  },

  // ── Error tracking ────────────────────────────────────────────────────────

  /**
   * Track a caught or uncaught error with full context.
   */
  trackError: (ctx: ErrorContext): void => {
    // Sanitise stack — strip absolute paths in prod
    const sanitisedStack =
      process.env.NODE_ENV === "production"
        ? ctx.stack?.split("\n").slice(0, 5).join("\n")
        : ctx.stack;

    AnalyticsService._enqueue({
      name: ctx.severity === "critical" ? "js_error" : "api_error",
      screen: ctx.screen ?? AnalyticsService._currentScreen,
      properties: {
        message: ctx.message,
        stack: sanitisedStack,
        severity: ctx.severity,
        ...ctx.context,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.error(`[Analytics] 🔴 Error (${ctx.severity}):`, ctx.message);
    }

    // Critical errors flush immediately — don't wait for batch
    if (ctx.severity === "critical") AnalyticsService.flush();
  },

  // ── Funnel analysis ───────────────────────────────────────────────────────

  /**
   * Get current progress through a named funnel for the active session.
   * Returns: { step, stepName, total, pct }
   */
  getFunnelProgress: (
    funnel: FunnelId
  ): { step: number; stepName: string; total: number; pct: number } => {
    const session = AnalyticsService._getSession();
    const steps = FUNNELS[funnel];
    const step = session.funnelProgress[funnel] ?? 0;
    return {
      step,
      stepName: steps[step] ?? "complete",
      total: steps.length,
      pct: Math.round((step / steps.length) * 100),
    };
  },

  /**
   * Get a summary of all funnel progress for the session.
   */
  getAllFunnelProgress: (): Record<FunnelId, ReturnType<typeof AnalyticsService.getFunnelProgress>> => {
    const ids: FunnelId[] = ["signup", "listing_creation", "purchase", "verification", "wallet_setup"];
    return Object.fromEntries(
      ids.map((id) => [id, AnalyticsService.getFunnelProgress(id)])
    ) as Record<FunnelId, ReturnType<typeof AnalyticsService.getFunnelProgress>>;
  },

  // ── Behavior ──────────────────────────────────────────────────────────────

  /**
   * Snapshot of current session behavior data.
   * Useful for in-app debugging or support chat context.
   */
  getBehaviorSnapshot: () => {
    const session = AnalyticsService._getSession();
    return {
      sessionId: session.sessionId,
      duration: Math.round((Date.now() - session.startedAt) / 1000),
      screenPath: session.screenPath.slice(-10), // last 10 screens
      eventCounts: session.eventCounts,
      funnels: AnalyticsService.getAllFunnelProgress(),
      userId: session.userId,
    };
  },

  // ── Internal ──────────────────────────────────────────────────────────────

  _getSession: (): BehaviorSession => {
    if (!AnalyticsService._session) {
      AnalyticsService._session = getOrCreateSession(AnalyticsService._userId);
    }
    return AnalyticsService._session;
  },

  _advanceFunnels: (eventName: AhiaEventName, session: BehaviorSession): void => {
    for (const [funnelId, steps] of Object.entries(FUNNELS) as [FunnelId, AhiaEventName[]][]) {
      const currentStep = session.funnelProgress[funnelId] ?? 0;
      if (currentStep < steps.length && steps[currentStep] === eventName) {
        session.funnelProgress[funnelId] = currentStep + 1;
      }
    }
  },

  _enqueue: (event: Omit<AnalyticsEvent, "userId" | "sessionId" | "timestamp">): void => {
    const queue = readLocal<AnalyticsEvent[]>(QUEUE_KEY, []);

    const full: AnalyticsEvent = {
      ...event,
      userId: AnalyticsService._userId ?? "anonymous",
      sessionId: AnalyticsService._session?.sessionId ?? "unknown",
      timestamp: Date.now(),
      screen: event.screen ?? AnalyticsService._currentScreen,
    };

    queue.push(full);

    // Prevent unbounded growth if offline for a long time
    if (queue.length > MAX_QUEUE_SIZE) queue.splice(0, queue.length - MAX_QUEUE_SIZE);

    writeLocal(QUEUE_KEY, queue);
  },

  flush: (): void => {
    const queue = readLocal<AnalyticsEvent[]>(QUEUE_KEY, []);
    if (queue.length === 0) return;

    // Clear before async send to avoid double-send
    writeLocal(QUEUE_KEY, []);

    if (process.env.NODE_ENV === "development") {
      console.log(`[Analytics] 🚀 Flushing ${queue.length} events`);
      return; // don't hit the API in dev
    }

    api.post("/analytics/events", { events: queue }).catch(() => {
      // Re-queue on failure — merge back
      const existing = readLocal<AnalyticsEvent[]>(QUEUE_KEY, []);
      writeLocal(QUEUE_KEY, [...queue, ...existing].slice(-MAX_QUEUE_SIZE));
    });
  },
};

export default AnalyticsService;
