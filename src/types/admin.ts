// Admin-related types for User Management, Disputes, Analytics, Reports

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  campus: string;
  student_id: string;
  student_id_verified: boolean;
  student_id_image_url?: string;
  avatar_url?: string;
  trust_score: number;
  total_transactions: number;
  strikes: number;
  is_banned: boolean;
  ban_reason?: string;
  created_at: string;
  last_active: string;
}

export interface Strike {
  id: string;
  user_id: string;
  reason: string;
  issued_at: string;
  issued_by: string;
  expires_at?: string;
}

export interface Dispute {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  reason: string;
  evidence_urls: string[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface UserFilters {
  search?: string;
  campus?: string;
  verified?: boolean;
  banned?: boolean;
  strikes_gt?: number;
  sort_by?: 'name' | 'created_at' | 'trust_score' | 'strikes';
  sort_order?: 'asc' | 'desc';
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

export interface StrikesResponse {
  strikes: Strike[];
  count: number;
}

export interface DisputeHistory {
  id: string;
  user_id: string;
  dispute_count: number;
  disputes: Array<{
    id: string;
    opponent: string;
    reason: string;
    status: string;
    date: string;
  }>;
}

export interface UserExportData {
  users: Array<{
    id: string;
    name: string;
    email: string;
    campus: string;
    trust_score: number;
    total_transactions: number;
    strikes: number;
    is_banned: boolean;
    verified: boolean;
    created_at: string;
  }>;
  total: number;
  exported_at: string;
}
