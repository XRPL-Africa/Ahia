'use client';

import { SearchFilters, SearchResult, Category, Campus } from '../search.service';
import { Listing } from '../listing.service';

const mockListings: Listing[] = [
  {
    id: 'listing_1', title: 'iPhone 13 Pro Max', description: 'Barely used, excellent condition',
    price: 450000, images: ['https://via.placeholder.com/300'], seller_id: 'user_1',
    campus_id: 'UNIBEN', category: 'Electronics', condition: 'used',
    is_bidding: false, status: 'active',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing_2', title: 'Engineering Mathematics Textbook', description: 'Stroud 7th edition',
    price: 12000, images: ['https://via.placeholder.com/300'], seller_id: 'user_2',
    campus_id: 'UNIBEN', category: 'Books', condition: 'used',
    is_bidding: false, status: 'active',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing_3', title: 'MacBook Air M1', description: 'Brand new, still sealed',
    price: 850000, images: ['https://via.placeholder.com/300'], seller_id: 'user_3',
    campus_id: 'UNILAG', category: 'Electronics', condition: 'new',
    is_bidding: true, status: 'active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class MockSearchService {
  private mockDelay = 600;

  async search(filters: SearchFilters): Promise<SearchResult> {
    await this.delay();
    let results = [...mockListings];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }
    if (filters.campus_id) results = results.filter((l) => l.campus_id === filters.campus_id);
    if (filters.category) results = results.filter((l) => l.category === filters.category);
    if (filters.condition) results = results.filter((l) => l.condition === filters.condition);
    if (filters.min_price) results = results.filter((l) => l.price >= filters.min_price!);
    if (filters.max_price) results = results.filter((l) => l.price <= filters.max_price!);
    if (filters.is_bidding !== undefined) results = results.filter((l) => l.is_bidding === filters.is_bidding);

    if (filters.sort_by === 'price_asc') results.sort((a, b) => a.price - b.price);
    if (filters.sort_by === 'price_desc') results.sort((a, b) => b.price - a.price);
    if (filters.sort_by === 'date_newest') results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    return {
      listings: results.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: results.length, pages: Math.ceil(results.length / limit) },
      query: filters.query ?? '',
      filters_applied: { campus_id: filters.campus_id, category: filters.category },
    };
  }

  async filterListings(filters: Omit<SearchFilters, 'query'>): Promise<SearchResult> {
    await this.delay();
    return this.search(filters);
  }

  async getCategories(): Promise<Category[]> {
    await this.delay();
    return [
      { id: 'electronics', name: 'Electronics', icon: '📱', listing_count: 142 },
      { id: 'books', name: 'Books', icon: '📚', listing_count: 380 },
      { id: 'clothing', name: 'Clothing', icon: '👕', listing_count: 95 },
      { id: 'furniture', name: 'Furniture', icon: '🛋️', listing_count: 48 },
      { id: 'accessories', name: 'Accessories', icon: '🎒', listing_count: 210 },
      { id: 'food', name: 'Food', icon: '🍱', listing_count: 67 },
      { id: 'services', name: 'Services', icon: '🛠️', listing_count: 33 },
    ];
  }

  async getCampuses(): Promise<Campus[]> {
    await this.delay();
    return [
      { id: 'UNIBEN', name: 'University of Benin', short_name: 'UNIBEN', city: 'Benin City', state: 'Edo', active_listings: 820 },
      { id: 'UNILAG', name: 'University of Lagos', short_name: 'UNILAG', city: 'Lagos', state: 'Lagos', active_listings: 1140 },
      { id: 'UI', name: 'University of Ibadan', short_name: 'UI', city: 'Ibadan', state: 'Oyo', active_listings: 410 },
      { id: 'UNN', name: 'University of Nigeria Nsukka', short_name: 'UNN', city: 'Nsukka', state: 'Enugu', active_listings: 290 },
      { id: 'FUNAAB', name: 'Federal University of Agriculture Abeokuta', short_name: 'FUNAAB', city: 'Abeokuta', state: 'Ogun', active_listings: 175 },
      { id: 'OAU', name: 'Obafemi Awolowo University', short_name: 'OAU', city: 'Ile-Ife', state: 'Osun', active_listings: 320 },
    ];
  }

  async getSuggestions(query: string, campus_id?: string): Promise<string[]> {
    await this.delay();
    const all = ['iPhone', 'MacBook', 'Textbook', 'Laptop', 'Charger', 'Calculator', 'Bed frame', 'Fan'];
    return all.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockSearchService();
