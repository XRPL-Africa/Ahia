// src/services/listing.service.ts

import api from './api';

// ============================================
// TYPES
// ============================================

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
}

export interface ListingFilters {
  campus_id: string;
  page?: number;
  limit?: number;
  category?: string;
  min_price?: number;
  max_price?: number;
}

// ============================================
// LISTING SERVICE
// ============================================

class ListingService {
  /**
   * Fetch listings with filters and pagination
   * GET /api/listings
   */
  async fetchListings(filters: ListingFilters): Promise<PaginatedListings> {
    try {
      const {
        campus_id,
        page = 1,
        limit = 20,
        category,
        min_price,
        max_price,
      } = filters;

      const params: Record<string, any> = { campus_id, page, limit };
      if (category) params.category = category;
      if (min_price) params.min_price = min_price;
      if (max_price) params.max_price = max_price;

      const response = await api.get<PaginatedListings>('/listings', {
        params,
      });

      console.log(` Fetched ${response.data.listings.length} listings`);

      return response.data;
    } catch (error: any) {
      console.error(
        ' Fetch listings failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Get single listing by ID
   */
  async getListingById(id: string): Promise<Listing> {
    try {
      const response = await api.get<Listing>(`/listings/${id}`);
      console.log('Fetched listing:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error(
        ' Get listing failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Create new listing
   */
  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    try {
      const response = await api.post<Listing>('/listings', listingData);
      console.log(' Listing created:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error(
        'Create listing failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Update existing listing
   */
  async updateListing(
    id: string,
    updates: Partial<Listing>
  ): Promise<Listing> {
    try {
      const response = await api.put<Listing>(`/listings/${id}`, updates);
      console.log('Listing updated:', response.data.title);
      return response.data;
    } catch (error: any) {
      console.error(
        'Update listing failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(id: string): Promise<void> {
    try {
      await api.delete(`/listings/${id}`);
      console.log(' Listing deleted');
    } catch (error: any) {
      console.error(
        'Delete listing failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new ListingService();