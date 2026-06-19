import api from './api';

export interface Rating {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewee_id: string;
  transaction_id: string;
  listing_title: string;
  score: number;
  comment: string;
  created_at: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export interface RatingList {
  ratings: Rating[];
  summary: RatingSummary;
  total: number;
}

export interface CreateRatingRequest {
  transaction_id: string;
  reviewee_id: string;
  score: number;
  comment: string;
}

class RatingService {
  async getUserRatings(userId: string, page: number = 1): Promise<RatingList> {
    try {
      const response = await api.get<RatingList>(`/users/${userId}/ratings`, {
        params: { page, limit: 20 },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createRating(data: CreateRatingRequest): Promise<Rating> {
    try {
      const response = await api.post<Rating>('/ratings', data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateRating(ratingId: string, score: number, comment: string): Promise<Rating> {
    try {
      const response = await api.put<Rating>(`/ratings/${ratingId}`, { score, comment });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async deleteRating(ratingId: string): Promise<void> {
    try {
      await api.delete(`/ratings/${ratingId}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRatingByTransaction(transactionId: string): Promise<Rating | null> {
    try {
      const response = await api.get<Rating>(`/ratings/transaction/${transactionId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw this.handleError(error);
    }
  }

  async canRateTransaction(transactionId: string): Promise<{ can_rate: boolean; reason?: string }> {
    try {
      const response = await api.get(`/ratings/can-rate/${transactionId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) return new Error(error.response.data?.message || 'An error occurred');
    if (error.request) return new Error('Network error. Please check your connection.');
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export default new RatingService();
