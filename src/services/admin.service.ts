import api from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  campus_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  trust_score: number;
  strikes: number;
  is_banned: boolean;
  created_at: string;
  last_active?: string;
  total_transactions: number;
}

export interface AdminUserList {
  users: AdminUser[];
  total: number;
  page: number;
  pages: number;
}

export interface Dispute {
  id: string;
  transaction_id: string;
  listing_title: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved';
  resolution?: 'refunded' | 'released' | 'split';
  admin_notes?: string;
  evidence_urls: string[];
  created_at: string;
  resolved_at?: string;
}

export interface DisputeList {
  disputes: Dispute[];
  total: number;
}

export interface PlatformStats {
  total_users: number;
  verified_users: number;
  pending_verification: number;
  total_listings: number;
  active_listings: number;
  total_transactions: number;
  completed_transactions: number;
  disputed_transactions: number;
  total_volume_ngn: number;
  total_volume_rlusd: number;
  daily_active_users: number;
  new_users_today: number;
}

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  verification_status?: 'pending' | 'verified' | 'rejected';
  campus_id?: string;
  is_banned?: boolean;
}

export interface ResolveDisputeRequest {
  resolution: 'refunded' | 'released' | 'split';
  admin_notes: string;
  split_percentage?: number;
}

class AdminService {
  async getUsers(filters: AdminUserFilters = {}): Promise<AdminUserList> {
    try {
      const response = await api.get<AdminUserList>('/admin/users', {
        params: { page: 1, limit: 20, ...filters },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verifyUser(userId: string): Promise<AdminUser> {
    try {
      const response = await api.put<AdminUser>(`/admin/users/${userId}/verify`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async rejectUser(userId: string, reason: string): Promise<AdminUser> {
    try {
      const response = await api.put<AdminUser>(`/admin/users/${userId}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async banUser(userId: string, reason: string): Promise<void> {
    try {
      await api.delete(`/admin/users/${userId}`, { data: { reason } });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async unbanUser(userId: string): Promise<AdminUser> {
    try {
      const response = await api.put<AdminUser>(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async issueStrike(userId: string, reason: string): Promise<{ strikes: number }> {
    try {
      const response = await api.post<{ strikes: number }>(`/admin/users/${userId}/strike`, { reason });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDisputes(page: number = 1, status?: Dispute['status']): Promise<DisputeList> {
    try {
      const response = await api.get<DisputeList>('/admin/disputes', {
        params: { page, limit: 20, status },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDisputeById(disputeId: string): Promise<Dispute> {
    try {
      const response = await api.get<Dispute>(`/admin/disputes/${disputeId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async resolveDispute(disputeId: string, data: ResolveDisputeRequest): Promise<Dispute> {
    try {
      const response = await api.put<Dispute>(`/admin/disputes/${disputeId}/resolve`, data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getPlatformStats(): Promise<PlatformStats> {
    try {
      const response = await api.get<PlatformStats>('/admin/stats');
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

export default new AdminService();
