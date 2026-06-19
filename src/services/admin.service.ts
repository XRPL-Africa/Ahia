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
  }
}

export default new AdminService();
