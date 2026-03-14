"use client";

export default function ListingSkeleton() {
  return (
    <div className="flex flex-col bg-card rounded-xl border border-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-5 w-1/2 rounded bg-muted" />
        <div className="flex items-center gap-1.5 mt-1">
          <div className="size-5 rounded-full bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
