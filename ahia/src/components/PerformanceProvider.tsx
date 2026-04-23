"use client";
// src/components/PerformanceProvider.tsx
// Boots PerformanceService once on the client after hydration.
// Kept minimal — no state, no re-renders.

import { useEffect } from "react";
import PerformanceService from "@/services/performance.service";

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    PerformanceService.init();

    // Flush remaining metrics on page unload (best-effort)
    const handleUnload = () => PerformanceService.flush();
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") PerformanceService.flush();
    });
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return <>{children}</>;
}
