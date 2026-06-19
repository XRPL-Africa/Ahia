'use client';

import { Rating, RatingList, CreateRatingRequest } from '../rating.service';

class MockRatingService {
  private mockDelay = 700;

  private mockRatings: Rating[] = [
    {
      id: 'rating_1',
      reviewer_id: 'user_456',
      reviewer_name: 'Joseph M',
      reviewer_avatar: 'https://via.placeholder.com/50',
      reviewee_id: 'user_123',
      transaction_id: 'txn_1',
      listing_title: 'iPhone 13 Pro Max',
      score: 5,
      comment: 'Great seller, item exactly as described. Fast response.',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rating_2',
      reviewer_id: 'user_789',
      reviewer_name: 'Jane Smith',
      reviewer_avatar: 'https://via.placeholder.com/50',
      reviewee_id: 'user_123',
      transaction_id: 'txn_2',
      listing_title: 'Engineering Textbooks',
      score: 4,
      comment: 'Good condition, would buy again.',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  async getUserRatings(userId: string, page: number = 1): Promise<RatingList> {
    await this.delay();
    return {
      ratings: this.mockRatings,
      summary: {
        average: 4.5,
        count: this.mockRatings.length,
        breakdown: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
      },
      total: this.mockRatings.length,
    };
  }

  async createRating(data: CreateRatingRequest): Promise<Rating> {
    await this.delay();
    const newRating: Rating = {
      id: 'rating_' + Date.now(),
      reviewer_id: 'user_123',
      reviewer_name: 'Safari Test User',
      reviewee_id: data.reviewee_id,
      transaction_id: data.transaction_id,
      listing_title: 'Mock Listing',
      score: data.score,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };
    this.mockRatings.push(newRating);
    return newRating;
  }

  async updateRating(ratingId: string, score: number, comment: string): Promise<Rating> {
    await this.delay();
    const rating = this.mockRatings.find((r) => r.id === ratingId);
    if (!rating) throw new Error('Rating not found');
    rating.score = score;
    rating.comment = comment;
    return { ...rating };
  }

  async deleteRating(ratingId: string): Promise<void> {
    await this.delay();
    const index = this.mockRatings.findIndex((r) => r.id === ratingId);
    if (index !== -1) this.mockRatings.splice(index, 1);
  }

  async getRatingByTransaction(transactionId: string): Promise<Rating | null> {
    await this.delay();
    return this.mockRatings.find((r) => r.transaction_id === transactionId) || null;
  }

  async canRateTransaction(transactionId: string): Promise<{ can_rate: boolean; reason?: string }> {
    await this.delay();
    return { can_rate: true };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockRatingService();
