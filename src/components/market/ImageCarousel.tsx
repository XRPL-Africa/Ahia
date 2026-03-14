"use client";

import { useState, useRef, useCallback } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface ImageCarouselProps {
  images: string[];
  alt: string;
}

export default function ImageCarousel({ images, alt }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, images.length - 1));
      setCurrent(clamped);
    },
    [images.length]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold) {
      goTo(current + 1);
    } else if (touchDeltaX.current > threshold) {
      goTo(current - 1);
    }
  }, [current, goTo]);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No image</span>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Image track */}
      <div
        className="overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {images.map((src, i) => (
            <div key={i} className="w-full shrink-0 aspect-square bg-muted">
              <img
                src={src}
                alt={`${alt} - photo ${i + 1}`}
                className="w-full h-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrow buttons (hidden on mobile, visible on hover on desktop) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center size-9 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            <FiChevronLeft size={18} className="text-card-foreground" />
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === images.length - 1}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center size-9 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm hover:bg-card transition-colors disabled:opacity-30 disabled:cursor-default"
          >
            <FiChevronRight size={18} className="text-card-foreground" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? "w-5 h-2 bg-primary"
                  : "size-2 bg-card/60 backdrop-blur-sm"
              }`}
            />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {images.length > 1 && (
        <span className="absolute top-3 right-3 rounded-md bg-foreground/70 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-background">
          {current + 1}/{images.length}
        </span>
      )}
    </div>
  );
}
