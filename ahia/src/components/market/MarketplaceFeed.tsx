"use client";

import { useState, useCallback, useEffect } from "react";
import { FiRefreshCw, FiPlus } from "react-icons/fi";
import { Category, Listing } from "@/src/types/listing";
import { fetchListings } from "@/src/services/listing.service";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import ListingCard from "./ListingCard";
import ListingSkeleton from "./ListingSkeleton";
import EmptyState from "./EmptyState";

const CAMPUS_ID = "UNIBEN";

interface MarketplaceFeedProps {
  onViewListing: (listing: Listing) => void;
  onCreateListing: () => void;
}

export default function MarketplaceFeed({ onViewListing, onCreateListing }: MarketplaceFeedProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      try {
        const res = await fetchListings({
          campus_id: CAMPUS_ID,
          search: search || undefined,
          category: category !== "All" ? category : undefined,
        });
        setListings(res.listings);
      } catch {
        setError("Failed to load listings. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, category]
  );

  useEffect(() => {
    load();
  }, [load]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setCategory("All");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img
                src="/images/ahia-logo.png"
                alt="Ahia logo"
                width={36}
                height={36}
                className="size-8 sm:size-9 rounded-lg object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-card-foreground leading-none font-serif">
                  Ahia
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  UNIBEN Marketplace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => load(true)}
                disabled={refreshing}
                aria-label="Refresh listings"
                className="flex items-center justify-center size-9 sm:size-10 rounded-full bg-secondary hover:bg-accent transition-colors disabled:opacity-50"
              >
                <FiRefreshCw
                  size={16}
                  className={`text-secondary-foreground ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          <SearchBar onSearch={setSearch} />

          <div className="mt-3">
            <CategoryFilter selected={category} onSelect={setCategory} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-4 sm:py-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 mb-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <button
              type="button"
              onClick={() => load()}
              className="text-sm text-destructive underline mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && listings.length > 0 && (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              {listings.length} listing{listings.length !== 1 && "s"} found
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {listings.map((item) => (
                <ListingCard key={item.id} listing={item} onClick={onViewListing} />
              ))}
            </div>
          </>
        )}

        {!loading && listings.length === 0 && !error && (
          <EmptyState
            searchQuery={search}
            category={category}
            onClearFilters={clearFilters}
          />
        )}
      </main>

      {/* Floating sell button */}
      <button
        type="button"
        onClick={onCreateListing}
        aria-label="Create new listing"
        className="fixed bottom-6 right-6 flex items-center gap-2 h-12 pl-4 pr-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity z-20"
      >
        <FiPlus size={20} />
        Sell
      </button>
    </div>
  );
}
