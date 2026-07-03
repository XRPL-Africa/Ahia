import api from './api';
import { Listing } from './listing.service';

export interface SearchFilters {
  query?: string;
  campus_id?: string;
  category?: string;
  condition?: 'new' | 'used' | 'refurbished';
  min_price?: number;
  max_price?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'date_newest' | 'rating';
  is_bidding?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  query: string;
  filters_applied: Omit<SearchFilters, 'query' | 'page' | 'limit'>;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  listing_count: number;
}

export interface Campus {
  id: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
  active_listings: number;
}

class SearchService {
  async search(filters: SearchFilters): Promise<SearchResult> {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 20, ...filters };
      const response = await api.get<SearchResult>('/listings/search', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async filterListings(filters: Omit<SearchFilters, 'query'>): Promise<SearchResult> {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 20, ...filters };
      const response = await api.get<SearchResult>('/listings/filter', { params });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get<{ categories: Category[] }>('/categories');
      return response.data.categories;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCampuses(): Promise<Campus[]> {
    try {
      const response = await api.get<{ campuses: Campus[] }>('/campuses');
      return response.data.campuses;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getSuggestions(query: string, campus_id?: string): Promise<string[]> {
    try {
      const response = await api.get<{ suggestions: string[] }>('/listings/search/suggestions', {
        params: { q: query, campus_id },
      });
      return response.data.suggestions;
    } catch {
      return [];
    }
  }

  private handleError(error: any): Error {
    if (error.response) return new Error(error.response.data?.message || 'An error occurred');
    if (error.request) return new Error('Network error. Please check your connection.');
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new SearchService();
