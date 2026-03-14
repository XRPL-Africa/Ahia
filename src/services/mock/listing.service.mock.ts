// src/services/listing.service.mock.ts

import {
  Listing,
  PaginatedListings,
  ListingFilters,
} from '../listing.service';

class MockListingService {
  private mockDelay = 800;

  // Mock data
  private mockListings: Listing[] = [
    {
      id: 'listing_1',
      title: 'iPhone 13 Pro Max - Like New',
      description: 'Barely used iPhone 13 Pro Max, 256GB, Pacific Blue. No scratches, complete with original box and charger.',
      price: 450000,
      images: ['https://via.placeholder.com/400x300?text=iPhone+13'],
      seller_id: 'user_123',
      campus_id: 'Funaab',
      category: 'Electronics',
      condition: 'used',
      is_bidding: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'listing_2',
      title: 'MacBook Air M1 2020',
      description: '8GB RAM, 256GB SSD. Perfect for students. Battery health 95%.',
      price: 520000,
      images: ['https://via.placeholder.com/400x300?text=MacBook+Air'],
      seller_id: 'user_456',
      campus_id: 'Funaab',
      category: 'Electronics',
      condition: 'used',
      is_bidding: true,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'listing_3',
      title: 'Engineering Textbook Bundle',
      description: 'Complete set of 1st year engineering textbooks. All in excellent condition.',
      price: 25000,
      images: ['https://via.placeholder.com/400x300?text=Textbooks'],
      seller_id: 'user_789',
      campus_id: 'Funaab',
      category: 'Books',
      condition: 'used',
      is_bidding: false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  async fetchListings(filters: ListingFilters): Promise<PaginatedListings> {
    await this.delay();

    let filtered = [...this.mockListings];

    // Filter by campus
    filtered = filtered.filter((l) => l.campus_id === filters.campus_id);

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter((l) => l.category === filters.category);
    }

    // Filter by price range
    if (filters.min_price) {
      filtered = filtered.filter((l) => l.price >= filters.min_price!);
    }
    if (filters.max_price) {
      filtered = filtered.filter((l) => l.price <= filters.max_price!);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    const result: PaginatedListings = {
      listings: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    };

    console.log(`MOCK Fetched ${paginated.length} listings`);
    return result;
  }

  async getListingById(id: string): Promise<Listing> {
    await this.delay();

    const listing = this.mockListings.find((l) => l.id === id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    console.log('MOCK Fetched listing:', listing.title);
    return listing;
  }

  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    await this.delay();

    const newListing: Listing = {
      id: 'listing_' + Date.now(),
      title: listingData.title || '',
      description: listingData.description || '',
      price: listingData.price || 0,
      images: listingData.images || [],
      seller_id: 'user_current',
      campus_id: listingData.campus_id || 'UNIBEN',
      category: listingData.category || 'Other',
      condition: listingData.condition || 'used',
      is_bidding: listingData.is_bidding || false,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.mockListings.push(newListing);
    console.log('MOCK Listing created:', newListing.title);
    return newListing;
  }

  async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    await this.delay();

    const index = this.mockListings.findIndex((l) => l.id === id);
    if (index === -1) {
      throw new Error('Listing not found');
    }

    this.mockListings[index] = {
      ...this.mockListings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    console.log('MOCK Listing updated:', this.mockListings[index].title);
    return this.mockListings[index];
  }

  async deleteListing(id: string): Promise<void> {
    await this.delay();

    const index = this.mockListings.findIndex((l) => l.id === id);
    if (index !== -1) {
      this.mockListings.splice(index, 1);
      console.log('MOCK Listing deleted');
    }
  }

  async searchListings(
    campus_id: string,
    keyword: string,
    page: number = 1
  ): Promise<PaginatedListings> {
    await this.delay();

    const filtered = this.mockListings.filter(
      (l) =>
        l.campus_id === campus_id &&
        (l.title.toLowerCase().includes(keyword.toLowerCase()) ||
          l.description.toLowerCase().includes(keyword.toLowerCase()))
    );

    const limit = 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = filtered.slice(start, end);

    console.log(`MOCK Found ${paginated.length} results for "${keyword}"`);

    return {
      listings: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        pages: Math.ceil(filtered.length / limit),
      },
    };
  }

  async getMyListings(page: number = 1): Promise<PaginatedListings> {
    await this.delay();

    const myListings = this.mockListings.filter((l) => l.seller_id === 'user_current');
    
    const limit = 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = myListings.slice(start, end);

    console.log(`MOCK Fetched ${paginated.length} of your listings`);

    return {
      listings: paginated,
      pagination: {
        page,
        limit,
        total: myListings.length,
        pages: Math.ceil(myListings.length / limit),
      },
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockListingService();