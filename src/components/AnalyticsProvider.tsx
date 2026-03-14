"use client";
// src/components/AnalyticsProvider.tsx
// Boots AnalyticsService after Zustand auth rehydrates.
// Also provides a React Error Boundary so render crashes are tracked.

import { useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import AnalyticsService from "@/services/analytics.service";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();

  useEffect(() => {
    // Boot / re-init whenever userId changes (login, logout, session restore)
    const cleanup = AnalyticsService.init(user?.id ?? null);
    return cleanup;
  }, [user?.id]);

  useEffect(() => {
    // Keep userId in sync after login/logout
    AnalyticsService.identify(user?.id ?? null);
  }, [user?.id]);

  return (
    <AnalyticsErrorBoundary>
      {children}
    </AnalyticsErrorBoundary>
  );
}

// ─── Error Boundary ────────────────────────────────────────────────────────────
// Class component — required by React's ErrorBoundary API

interface EBState { hasError: boolean; error: Error | null }

class AnalyticsErrorBoundary extends Component<
  { children: ReactNode },
  EBState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    AnalyticsService.trackError({
      message: error.message,
      stack: error.stack,
      severity: "critical",
      context: {
        componentStack: info.componentStack?.slice(0, 500),
        type: "render_error",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      // Minimal fallback — keeps the app from going fully blank
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="space-y-4 max-w-sm">
            <p className="text-4xl">😵</p>
            <h2 className="text-xl font-fredoka font-bold text-gray-800">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500">
              Our team has been notified. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-ahia-sunset text-white rounded-xl font-fredoka font-semibold text-sm hover:opacity-90"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
