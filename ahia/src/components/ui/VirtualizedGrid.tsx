"use client";
// src/components/ui/VirtualizedGrid.tsx
// Lightweight windowed grid for the marketplace feed.
// Uses IntersectionObserver sentinel rows — no heavy virtualisation library needed
// (react-window adds ~25kB; this approach is <2kB and sufficient for 200–2000 items).

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

const PAGE_SIZE = 24;      // items rendered per chunk
const SENTINEL_OFFSET = 4; // load next chunk when N items from the bottom are visible

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  /** Tailwind grid class — e.g. "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" */
  gridClassName?: string;
  gap?: string;
  /** Rendered at the very bottom once all items are shown */
  footer?: ReactNode;
  /** Rendered after each chunk load */
  loadingIndicator?: ReactNode;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  keyExtractor,
  gridClassName = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  gap = "gap-4",
  footer,
  loadingIndicator,
}: VirtualizedGridProps<T>) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
  }, [items.length]);

  // Reset when item list changes (new search/filter)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items]);

  // Sentinel observer — triggers when the sentinel div enters viewport
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Sentinel sits N items before the end so loading feels instant
  const sentinelIndex = Math.max(0, visibleItems.length - SENTINEL_OFFSET);

  return (
    <>
      <div className={`grid ${gridClassName} ${gap}`}>
        {visibleItems.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderItem(item, index)}
            {/* Place sentinel near the bottom of visible items */}
            {index === sentinelIndex && (
              <div ref={sentinelRef} aria-hidden className="h-0 w-0 overflow-hidden" />
            )}
          </div>
        ))}
      </div>

      {hasMore && loadingIndicator && (
        <div className="mt-4">{loadingIndicator}</div>
      )}

      {!hasMore && items.length > PAGE_SIZE && footer && (
        <div className="mt-4">{footer}</div>
      )}
    </>
  );
}

export default VirtualizedGrid;
