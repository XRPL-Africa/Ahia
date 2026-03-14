// src/services/listing.service.ts
// Offline-aware: caches results, queues mutations, falls back to cache when offline

import api from './api';
import OfflineService from './offline.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  seller_id: string;
  campus_id: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  is_bidding: boolean;
  status: 'active' | 'sold' | 'removed';
  created_at: string;
  updated_at: string;
}

export interface PaginatedListings {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fromCache?: boolean; // true when serving offline cached data
}

export interface ListingFilters {
  campus_id: string;
  page?: number;
  limit?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class ListingService {
  /**
   * Fetch listings with filters and pagination.
   * Online: fetches from API and updates cache.
   * Offline: serves from cache with fromCache=true.
   */
  async fetchListings(filters: ListingFilters): Promise<PaginatedListings> {
    const { campus_id, page = 1, limit = 20, category, min_price, max_price } = filters;

    // ── Offline path ─────────────────────────────────────────────────────────
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = OfflineService.getCachedListingsFallback();
      let filtered = cached;
      if (category) filtered = filtered.filter((l) => l.category === category);
      if (campus_id) filtered = filtered.filter((l) => l.campus_id === campus_id);
      return {
        listings: filtered.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: filtered.length, pages: Math.ceil(filtered.length / limit) },
        fromCache: true,
      };
    }

    // ── Online path ──────────────────────────────────────────────────────────
    try {
      const params: Record<string, unknown> = { campus_id, page, limit };
      if (category) params.category = category;
      if (min_price) params.min_price = min_price;
      if (max_price) params.max_price = max_price;

      const response = await api.get<PaginatedListings>('/listings', { params });
      const data = response.data;

      // Persist first-page results as offline cache
      if (page === 1) {
        OfflineService.cacheListings(data.listings);
      }

      return data;
    } catch (error: unknown) {
      // Network failure mid-session — fall back to cache
      const cached = OfflineService.getCachedListingsFallback();
      if (cached.length > 0) {
        console.warn('[ListingService] Network error — serving from cache');
        return {
          listings: cached.slice(0, limit),
          pagination: { page: 1, limit, total: cached.length, pages: Math.ceil(cached.length / limit) },
          fromCache: true,
        };
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get single listing by ID.
   * Falls back to cached listing if offline.
   */
  async getListingById(id: string): Promise<Listing> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = OfflineService.getCachedListingsFallback();
      const found = cached.find((l) => l.id === id);
      if (found) return found;
      throw new Error('You are offline and this listing is not cached.');
    }

    try {
      const response = await api.get<Listing>(`/listings/${id}`);
      return response.data;
    } catch (error: unknown) {
      // Try cache as fallback
      const cached = OfflineService.getCachedListingsFallback();
      const found = cached.find((l) => l.id === id);
      if (found) return found;
      throw this.handleError(error);
    }
  }

  /**
   * Create listing.
   * Offline: queues action, returns optimistic stub.
   */
  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OfflineService.enqueue('CREATE_LISTING', 'POST', '/listings', listingData as Record<string, unknown>);
      // Return optimistic stub so UI doesn't block
      return {
        id: `offline-${Date.now()}`,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...listingData,
      } as Listing;
    }

    try {
      const response = await api.post<Listing>('/listings', listingData);
      // Add to cache
      const cached = OfflineService.getCachedListingsFallback();
      OfflineService.cacheListings([response.data, ...cached]);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Update listing.
   * Offline: queues action, patches cache optimistically.
   */
  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OfflineService.enqueue(
        'UPDATE_LISTING', 'PUT', `/listings/${id}`,
        { id, ...updates } as Record<string, unknown>
      );
      OfflineService.patchCachedListing(id, updates);
      const cached = OfflineService.getCachedListingsFallback();
      return (cached.find((l) => l.id === id) ?? { id, ...updates }) as Listing;
    }

    try {
      const response = await api.put<Listing>(`/listings/${id}`, updates);
      OfflineService.patchCachedListing(id, response.data);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete listing.
   * Offline: queues action, removes from cache optimistically.
   */
  async deleteListing(id: string): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      OfflineService.enqueue('DELETE_LISTING', 'DELETE', `/listings/${id}`, { id });
      OfflineService.removeCachedListing(id);
      return;
    }

    try {
      await api.delete(`/listings/${id}`);
      OfflineService.removeCachedListing(id);
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // ─── Error handler ──────────────────────────────────────────────────────────

  private handleError(error: unknown): Error {
    const e = error as { response?: { data?: { message?: string } }; request?: unknown; message?: string };
    if (e.response) return new Error(e.response.data?.message ?? 'An error occurred');
    if (e.request) return new Error('Network error. Please check your connection.');
    return new Error(e.message ?? 'An unexpected error occurred');
  }
}

export default new ListingService();
