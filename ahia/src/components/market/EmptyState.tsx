"use client";

import { FiPackage } from "react-icons/fi";

interface EmptyStateProps {
  searchQuery?: string;
  category?: string;
  onClearFilters: () => void;
}

export default function EmptyState({ searchQuery, category, onClearFilters }: EmptyStateProps) {
  const hasFilters = Boolean(searchQuery) || (category !== undefined && category !== "All");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-muted mb-4">
        <FiPackage size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1 font-serif">
        No listings found
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "No listings on this campus yet. Be the first to post something!"}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
