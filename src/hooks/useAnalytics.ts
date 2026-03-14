"use client";
// src/hooks/useAnalytics.ts
// Per-component hook: auto-tracks screen view on mount, exposes track helpers.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AnalyticsService, {
  type AhiaEventName,
} from "@/services/analytics.service";

export interface UseAnalyticsReturn {
  track: (name: AhiaEventName, properties?: Record<string, unknown>) => void;
  trackError: (message: string, context?: Record<string, unknown>) => void;
  custom: (name: string, properties?: Record<string, unknown>) => void;
}

/**
 * Drop into any page component to:
 * 1. Auto-track a screen_view on mount
 * 2. Get typed track/trackError/custom helpers
 *
 * @param screenName  Human-readable screen name — e.g. "OrderDetail", "Chat"
 * @param properties  Optional extra props sent with the screen_view event
 */
export const useAnalytics = (
  screenName?: string,
  properties?: Record<string, unknown>
): UseAnalyticsReturn => {
  const pathname = usePathname();

  useEffect(() => {
    const name = screenName ?? pathname ?? "Unknown";
    AnalyticsService.trackScreen(name, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return {
    track: AnalyticsService.track.bind(AnalyticsService),
    trackError: (message, context) =>
      AnalyticsService.trackError({
        message,
        screen: screenName ?? pathname ?? undefined,
        severity: "medium",
        context,
      }),
    custom: AnalyticsService.custom.bind(AnalyticsService),
  };
};
