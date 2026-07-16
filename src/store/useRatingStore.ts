// src/store/useRatingStore.ts
// Zustand store for ratings and reviews — fetch, submit, and report.

import { create } from "zustand";
import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number; // 1–5
  comment: string;
  transactionId: string;
  createdAt: string;
  isReported?: boolean;
}

export interface SubmitRatingInput {
  targetUserId: string;
  transactionId: string;
  rating: number;
  comment: string;
}

interface RatingStore {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  loading: boolean;
  submitting: boolean;
  submitSuccess: boolean;
  error: string | null;
  fetchReviews: (userId: string) => Promise<void>;
  submitRating: (input: SubmitRatingInput) => Promise<void>;
  reportReview: (reviewId: string, reason: string) => Promise<void>;
  reset: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useRatingStore = create<RatingStore>((set, get) => ({
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  loading: false,
  submitting: false,
  submitSuccess: false,
  error: null,

  fetchReviews: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/users/${userId}/ratings`);
      set({
        reviews: data.reviews ?? [],
        averageRating: data.averageRating ?? 0,
        totalReviews: data.totalReviews ?? 0,
        loading: false,
      });
    } catch {
      set({ loading: false, error: "Failed to load reviews" });
    }
  },

  submitRating: async (input: SubmitRatingInput) => {
    set({ submitting: true, error: null, submitSuccess: false });
    try {
      await api.post("/ratings", input);
      set({ submitting: false, submitSuccess: true });
      // Refresh the reviews list after a successful submit
      get().fetchReviews(input.targetUserId);
    } catch {
      set({ submitting: false, error: "Failed to submit rating. Please try again." });
    }
  },

  reportReview: async (reviewId: string, reason: string) => {
    // Optimistically mark as reported in UI
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === reviewId ? { ...r, isReported: true } : r
      ),
    }));
    try {
      await api.post(`/ratings/${reviewId}/report`, { reason });
    } catch {
      // Revert optimistic update on failure
      set((state) => ({
        reviews: state.reviews.map((r) =>
          r.id === reviewId ? { ...r, isReported: false } : r
        ),
      }));
    }
  },

  reset: () => set({ submitSuccess: false, error: null }),
}));
