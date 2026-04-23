"use client";
// src/components/ui/LazyImage.tsx
// Progressive image with blur placeholder and IntersectionObserver lazy loading.
// Replaces plain <img> across the feed for FCP/LCP improvement.

import { useState, useRef, useEffect, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  /** Width/height ratio — e.g. "1/1", "4/3", "16/9". Default: "1/1" */
  aspect?: string;
  /** Low-res placeholder (base64 or tiny URL). Auto-generates blur if omitted. */
  placeholder?: string;
  priority?: boolean;
  onLoad?: () => void;
}

// Tiny 4×4 warm-grey SVG placeholder encoded as data URI
const DEFAULT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23f0ece8'/%3E%3C/svg%3E";

export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  aspect = "1/1",
  placeholder = DEFAULT_PLACEHOLDER,
  priority = false,
  onLoad,
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority); // priority skips lazy
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver — start loading when 200px from viewport
  useEffect(() => {
    if (priority || inView) return;
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, inView]);

  const [r, c] = aspect.split("/").map(Number);
  const paddingTop = `${((c / r) * 100).toFixed(4)}%`;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", containerClassName)}
      style={{ paddingTop } as CSSProperties}
    >
      {/* Blur placeholder — always rendered for instant paint */}
      <img
        src={placeholder}
        alt=""
        aria-hidden
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100 scale-110 blur-sm"
        )}
        style={{ filter: loaded ? "none" : "blur(12px)", transform: loaded ? "scale(1)" : "scale(1.05)" }}
      />

      {/* Real image — only fetched once in viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => {
            setLoaded(true);
            onLoad?.();
          }}
          onError={() => setLoaded(true)} // on error, fade out placeholder anyway
        />
      )}
    </div>
  );
}

export default LazyImage;
