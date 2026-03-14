// src/services/performance.service.ts
// Ahia Campus Marketplace — Performance Monitoring Service
// Tracks Core Web Vitals, FCP, LCP, component render times, API latency

"use client";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VitalMetric {
  name: "FCP" | "LCP" | "CLS" | "FID" | "INP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

export interface ApiMetric {
  endpoint: string;
  method: string;
  durationMs: number;
  status: number;
  timestamp: number;
  fromCache: boolean;
}

export interface RenderMetric {
  component: string;
  durationMs: number;
  timestamp: number;
}

// Thresholds per Google's Core Web Vitals (ms)
const THRESHOLDS: Record<VitalMetric["name"], [number, number]> = {
  FCP:  [1800, 3000],
  LCP:  [2500, 4000],
  CLS:  [0.1,  0.25],   // score, not ms
  FID:  [100,  300],
  INP:  [200,  500],
  TTFB: [800,  1800],
};

function rateMetric(name: VitalMetric["name"], value: number): VitalMetric["rating"] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

// ─── In-memory buffer (flushed to backend periodically) ───────────────────────

const buffer: {
  vitals: VitalMetric[];
  api: ApiMetric[];
  renders: RenderMetric[];
} = { vitals: [], api: [], renders: [] };

let flushTimer: ReturnType<typeof setTimeout> | null = null;

const scheduleFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    PerformanceService.flush();
    flushTimer = null;
  }, 10_000); // batch every 10s
};

// ─── Main Service ──────────────────────────────────────────────────────────────

export const PerformanceService = {

  /**
   * Initialise Web Vitals observation.
   * Call once in the root layout client component.
   */
  init: (): void => {
    if (typeof window === "undefined") return;

    // Use PerformanceObserver for paint timings (FCP)
    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            PerformanceService.recordVital("FCP", entry.startTime);
          }
        }
      });
      paintObserver.observe({ type: "paint", buffered: true });
    } catch { /* unsupported */ }

    // LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (last) PerformanceService.recordVital("LCP", last.startTime);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch { /* unsupported */ }

    // CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!e.hadRecentInput) clsValue += e.value;
        }
        PerformanceService.recordVital("CLS", clsValue);
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch { /* unsupported */ }

    // FID / INP
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { processingStart: number; duration: number };
          if (entry.entryType === "first-input") {
            PerformanceService.recordVital("FID", e.processingStart - entry.startTime);
          }
          if (entry.entryType === "event") {
            PerformanceService.recordVital("INP", e.duration);
          }
        }
      });
      fidObserver.observe({ type: "first-input", buffered: true });
      try { fidObserver.observe({ type: "event", buffered: true }); } catch { /* */ }
    } catch { /* unsupported */ }

    // TTFB via Navigation Timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const nav = entry as PerformanceNavigationTiming;
          PerformanceService.recordVital("TTFB", nav.responseStart - nav.requestStart);
        }
      });
      navObserver.observe({ type: "navigation", buffered: true });
    } catch { /* unsupported */ }

    if (process.env.NODE_ENV === "development") {
      console.log("[Perf] Monitoring initialised");
    }
  },

  recordVital: (name: VitalMetric["name"], value: number): void => {
    const metric: VitalMetric = {
      name,
      value: Math.round(value * 100) / 100,
      rating: rateMetric(name, value),
      timestamp: Date.now(),
    };
    buffer.vitals.push(metric);

    if (process.env.NODE_ENV === "development") {
      const emoji = metric.rating === "good" ? "✅" : metric.rating === "needs-improvement" ? "⚠️" : "❌";
      console.log(`[Perf] ${emoji} ${name}: ${metric.value}${name === "CLS" ? "" : "ms"} (${metric.rating})`);
    }

    scheduleFlush();
  },

  /**
   * Wrap an API call to record its latency.
   * Usage: const data = await PerformanceService.trackApi("GET", "/listings", () => api.get("/listings"))
   */
  trackApi: async <T>(
    method: string,
    endpoint: string,
    fn: () => Promise<{ data: T; status: number; fromCache?: boolean }>,
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      buffer.api.push({
        endpoint,
        method,
        durationMs: Math.round(performance.now() - start),
        status: result.status,
        timestamp: Date.now(),
        fromCache: result.fromCache ?? false,
      });
      scheduleFlush();
      return result.data;
    } catch (err) {
      buffer.api.push({
        endpoint,
        method,
        durationMs: Math.round(performance.now() - start),
        status: 0,
        timestamp: Date.now(),
        fromCache: false,
      });
      scheduleFlush();
      throw err;
    }
  },

  /**
   * Record a component render duration (use with usePerformance hook).
   */
  recordRender: (component: string, durationMs: number): void => {
    if (durationMs < 16) return; // ignore fast renders <1 frame
    buffer.renders.push({ component, durationMs, timestamp: Date.now() });
    scheduleFlush();
  },

  /**
   * Get current snapshot of all buffered metrics.
   */
  getSnapshot: () => ({ ...buffer }),

  /**
   * Get latest value for each vital.
   */
  getSummary: (): Record<string, VitalMetric | undefined> => {
    const summary: Record<string, VitalMetric> = {};
    for (const vital of buffer.vitals) {
      // Keep most recent per name
      if (!summary[vital.name] || vital.timestamp > summary[vital.name].timestamp) {
        summary[vital.name] = vital;
      }
    }
    return summary;
  },

  /**
   * Flush buffered metrics to /api/analytics/performance.
   * No-op in development (just logs). Fire-and-forget.
   */
  flush: (): void => {
    const payload = { ...buffer };
    const total = payload.vitals.length + payload.api.length + payload.renders.length;
    if (total === 0) return;

    // Clear buffer before async send
    buffer.vitals = [];
    buffer.api = [];
    buffer.renders = [];

    if (process.env.NODE_ENV === "development") {
      console.log(`[Perf] Flushing ${total} metrics`, payload);
      return;
    }

    fetch("/api/analytics/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Re-buffer on failure (best effort)
      buffer.vitals.push(...payload.vitals);
      buffer.api.push(...payload.api);
      buffer.renders.push(...payload.renders);
    });
  },
};

export default PerformanceService;
