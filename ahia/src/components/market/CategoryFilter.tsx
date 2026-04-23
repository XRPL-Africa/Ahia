"use client";

import { CATEGORIES, Category } from "@/types/listing";

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
      role="tablist"
      aria-label="Filter by category"
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(cat)}
            className={`shrink-0 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
