"use client";
// src/components/market/MarketplaceFeed.tsx
// Performance-optimised: VirtualizedGrid + lazy imports for heavy components

import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { FiRefreshCw, FiPlus } from "react-icons/fi";
import { Category, Listing } from "@/types/listing";
import listingService from "@/services/listing.service";
import SearchBar from "./SearchBar";
import CategoryFilter from "./CategoryFilter";
import ListingCard from "./ListingCard";
import ListingSkeleton from "./ListingSkeleton";
import EmptyState from "./EmptyState";
import VirtualizedGrid from "@/components/ui/VirtualizedGrid";

// Code-split heavy components — only fetched when actually rendered
const ListingDetail = lazy(() => import("./ListingDetail"));
const CreateListing = lazy(() => import("./CreateListing"));

const CAMPUS_ID = "UNIBEN";

interface MarketplaceFeedProps {
  onViewListing?: (listing: Listing) => void;
  onCreateListing?: () => void;
}

export default function MarketplaceFeed({ onViewListing, onCreateListing }: MarketplaceFeedProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await listingService.fetchListings({
          campus_id: CAMPUS_ID,
          category: category !== "All" ? category : undefined,
        });
        setListings(res.listings);
        setFromCache(res.fromCache ?? false);
      } catch {
        setError("Failed to load listings. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category]
  );

  useEffect(() => { load(); }, [load]);

  // Client-side search filter (no extra network call)
  const filtered = search
    ? listings.filter(
        (l) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.category.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-ahia-sunset hover:border-ahia-sunset/30 transition-colors"
          aria-label="Refresh listings"
        >
          <FiRefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
        <button
          onClick={onCreateListing}
          className="flex items-center gap-2 px-4 py-2.5 bg-ahia-sunset text-white rounded-xl font-fredoka font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <FiPlus size={18} /> Sell
        </button>
      </div>

      <CategoryFilter selected={category} onChange={setCategory} />

      {/* Cached data indicator */}
      {fromCache && !loading && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span>📦</span>
          Showing cached listings — pull to refresh when online
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500 text-sm">{error}</div>
      )}

      {loading ? (
        /* Skeleton grid */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        /* Virtualized grid — renders 24 at a time, loads more on scroll */
        <VirtualizedGrid
          items={filtered}
          keyExtractor={(l) => l.id}
          gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          gap="gap-4"
          renderItem={(listing, index) => (
            <ListingCard
              listing={listing}
              onClick={() => onViewListing?.(listing)}
              priority={index < 4} // first 4 cards load eagerly (above fold)
            />
          )}
          loadingIndicator={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ListingSkeleton key={i} />
              ))}
            </div>
          }
          footer={
            <p className="text-center text-xs text-gray-400 py-4">
              All {filtered.length} listings shown
            </p>
          }
        />
      )}
    </div>
  );
}
