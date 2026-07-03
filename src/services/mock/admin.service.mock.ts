'use client';

import {
  AdminUser, AdminUserList, Dispute, DisputeList,
  PlatformStats, AdminUserFilters, ResolveDisputeRequest,
} from '../admin.service';

class MockAdminService {
  private mockDelay = 800;

  private mockUsers: AdminUser[] = [
    {
      id: 'user_1', name: 'Safari Test User', email: 'safari@funaab.edu.ng',
      campus_id: 'FUNAAB', verification_status: 'verified', trust_score: 95,
      strikes: 0, is_banned: false,
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      last_active: new Date().toISOString(), total_transactions: 15,
    },
    {
      id: 'user_2', name: 'Joseph M', email: 'joseph@uniben.edu.ng',
      campus_id: 'UNIBEN', verification_status: 'pending', trust_score: 0,
      strikes: 0, is_banned: false,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      total_transactions: 0,
    },
    {
      id: 'user_3', name: 'Bad Actor', email: 'bad@unilag.edu.ng',
      campus_id: 'UNILAG', verification_status: 'verified', trust_score: 20,
      strikes: 3, is_banned: true,
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      total_transactions: 4,
    },
  ];

  private mockDisputes: Dispute[] = [
    {
      id: 'dispute_1', transaction_id: 'txn_1', listing_title: 'iPhone 13 Pro Max',
      buyer_id: 'user_2', buyer_name: 'Joseph M', seller_id: 'user_1', seller_name: 'Safari Test User',
      reason: 'Item not as described - screen has a crack', status: 'open', evidence_urls: [],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'dispute_2', transaction_id: 'txn_3', listing_title: 'Laptop Charger',
      buyer_id: 'user_3', buyer_name: 'Bad Actor', seller_id: 'user_2', seller_name: 'Joseph M',
      reason: 'Never received the item', status: 'resolved', resolution: 'refunded',
      admin_notes: 'Seller confirmed no tracking. Refund issued.', evidence_urls: [],
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  async getUsers(filters: AdminUserFilters = {}): Promise<AdminUserList> {
    await this.delay();
    let users = [...this.mockUsers];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (filters.verification_status) users = users.filter((u) => u.verification_status === filters.verification_status);
    if (filters.campus_id) users = users.filter((u) => u.campus_id === filters.campus_id);
    if (filters.is_banned !== undefined) users = users.filter((u) => u.is_banned === filters.is_banned);
    return { users, total: users.length, page: 1, pages: 1 };
  }

  async verifyUser(userId: string): Promise<AdminUser> {
    await this.delay();
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.verification_status = 'verified';
    return { ...user };
  }

  async rejectUser(userId: string, reason: string): Promise<AdminUser> {
    await this.delay();
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.verification_status = 'rejected';
    return { ...user };
  }

  async banUser(userId: string, reason: string): Promise<void> {
    await this.delay();
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.is_banned = true;
  }

  async unbanUser(userId: string): Promise<AdminUser> {
    await this.delay();
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.is_banned = false;
    return { ...user };
  }

  async issueStrike(userId: string, reason: string): Promise<{ strikes: number }> {
    await this.delay();
    const user = this.mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.strikes += 1;
    if (user.strikes >= 4) user.is_banned = true;
    return { strikes: user.strikes };
  }

  async getDisputes(page: number = 1, status?: Dispute['status']): Promise<DisputeList> {
    await this.delay();
    const disputes = status ? this.mockDisputes.filter((d) => d.status === status) : this.mockDisputes;
    return { disputes, total: disputes.length };
  }

  async getDisputeById(disputeId: string): Promise<Dispute> {
    await this.delay();
    const dispute = this.mockDisputes.find((d) => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found');
    return { ...dispute };
  }

  async resolveDispute(disputeId: string, data: ResolveDisputeRequest): Promise<Dispute> {
    await this.delay();
    const dispute = this.mockDisputes.find((d) => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found');
    dispute.status = 'resolved';
    dispute.resolution = data.resolution;
    dispute.admin_notes = data.admin_notes;
    dispute.resolved_at = new Date().toISOString();
    return { ...dispute };
  }

  async getPlatformStats(): Promise<PlatformStats> {
    await this.delay();
    return {
      total_users: 1240, verified_users: 980, pending_verification: 45,
      total_listings: 3820, active_listings: 2100, total_transactions: 890,
      completed_transactions: 810, disputed_transactions: 18,
      total_volume_ngn: 48500000, total_volume_rlusd: 1200,
      daily_active_users: 320, new_users_today: 14,
    };
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockAdminService();
