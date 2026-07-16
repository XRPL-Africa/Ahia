// src/services/admin.service.ts
import api from './api';
import {
  User,
  UserListResponse,
  UserFilters,
  StrikesResponse,
  DisputeHistory,
  UserExportData
} from '@/types/admin';

class AdminService {
  // ===== USER MANAGEMENT =====

  async fetchUsers(page = 1, perPage = 10, filters?: UserFilters): Promise<UserListResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());

      if (filters?.search) params.append('search', filters.search);
      if (filters?.campus) params.append('campus', filters.campus);
      if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
      if (filters?.banned !== undefined) params.append('banned', filters.banned.toString());
      if (filters?.strikes_gt !== undefined) params.append('strikes_gt', filters.strikes_gt.toString());
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);

      const response = await api.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  async verifyStudentId(userId: string): Promise<{ verified: boolean; message: string }> {
    try {
      const response = await api.post(`/admin/users/${userId}/verify-id`);
      return response.data;
    } catch (error) {
      console.error('Failed to verify student ID:', error);
      throw error;
    }
  }

  // ===== STRIKES SYSTEM =====

  async issueStrike(
    userId: string,
    reason: string
  ): Promise<{ strike: StrikesResponse; user_strikes: number }> {
    try {
      const response = await api.post(`/admin/users/${userId}/strikes`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to issue strike:', error);
      throw error;
    }
  }

  async getUserStrikes(userId: string): Promise<StrikesResponse> {
    try {
      const response = await api.get(`/admin/users/${userId}/strikes`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user strikes:', error);
      throw error;
    }
  }

  async removeStrike(strikeId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/admin/strikes/${strikeId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to remove strike:', error);
      throw error;
    }
  }

  // ===== BAN MANAGEMENT =====

  async banUser(userId: string, reason: string): Promise<{ banned: boolean; message: string }> {
    try {
      const response = await api.post(`/admin/users/${userId}/ban`, { reason });
      return response.data;
    } catch (error) {
      console.error('Failed to ban user:', error);
      throw error;
    }
  }

  async unbanUser(userId: string): Promise<{ unbanned: boolean; message: string }> {
    try {
      const response = await api.post(`/admin/users/${userId}/unban`);
      return response.data;
    } catch (error) {
      console.error('Failed to unban user:', error);
      throw error;
    }
  }

  // ===== DISPUTE HISTORY =====

  async getUserDisputeHistory(userId: string): Promise<DisputeHistory> {
    try {
      const response = await api.get(`/admin/users/${userId}/dispute-history`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dispute history:', error);
      throw error;
    }
  }

  // ===== DATA EXPORT =====

  async exportUserData(filters?: UserFilters): Promise<UserExportData> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.campus) params.append('campus', filters.campus);
      if (filters?.verified !== undefined) params.append('verified', filters.verified.toString());
      if (filters?.banned !== undefined) params.append('banned', filters.banned.toString());

      const response = await api.get(`/admin/users/export?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  // Helper: Download CSV
  async downloadUsersCsv(filters?: UserFilters): Promise<void> {
    try {
      const data = await this.exportUserData(filters);
      const csv = this.generateCsv(data);
      this.downloadFile(csv, 'users-export.csv', 'text/csv');
    } catch (error) {
      console.error('Failed to download CSV:', error);
      throw error;
    }
  }

  private generateCsv(data: UserExportData): string {
    const headers = ['ID', 'Name', 'Email', 'Campus', 'Trust Score', 'Transactions', 'Strikes', 'Banned', 'Verified', 'Created'];
    const rows = data.users.map(u => [
      u.id,
      u.name,
      u.email,
      u.campus,
      u.trust_score,
      u.total_transactions,
      u.strikes,
      u.is_banned ? 'Yes' : 'No',
      u.verified ? 'Yes' : 'No',
      u.created_at,
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    return csv;
  }

  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
