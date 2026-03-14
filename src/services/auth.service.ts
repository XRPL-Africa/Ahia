// src/services/auth.service.ts

import api, { storage } from './api';

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name?: string;
  campus_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  trust_score: number;
  wallet_address?: string;
  created_at?: string;
  verified_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  campus_id: string;
  student_id: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface RegistrationResponse {
  user_id: string;
  verification_token: string;
  status: 'pending';
  estimated_verification_time: string;
}

// ============================================
// AUTH SERVICE
// ============================================

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;

      // Save tokens to localStorage (Next.js compatible)
      storage.set('access_token', access_token);
      storage.set('refresh_token', refresh_token);
      storage.set('user', JSON.stringify(user));

      console.log(' Login successful:', user.email);

      return response.data;
    } catch (error: any) {
      console.error(' Login failed:', error.response?.data || error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegistrationResponse> {
    try {
      const response = await api.post<RegistrationResponse>(
        '/auth/register',
        userData
      );

      console.log('Registration successful:', response.data);

      return response.data;
    } catch (error: any) {
      console.error(
        ' Registration failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Logout user - clear all stored data
   */
  logout(): void {
    storage.remove('access_token', 'refresh_token', 'user');
    console.log('Logout successful');

    // Redirect to signin page (Next.js)
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
  }

  /**
   * Get current logged in user from storage
   */
  getCurrentUser(): User | null {
    try {
      const userJson = storage.get('user');
      if (userJson) {
        return JSON.parse(userJson);
      }
      return null;
    } catch (error) {
      console.error(' Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = storage.get('access_token');
    return !!token;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = storage.get('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await api.post<{ access_token: string }>(
        '/auth/refresh',
        { refresh_token: refreshToken }
      );

      const { access_token } = response.data;
      storage.set('access_token', access_token);

      console.log(' Token refreshed successfully');

      return access_token;
    } catch (error: any) {
      console.error(' Token refresh failed:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Send forgot password email
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post('/auth/forgot-password', { email });
      console.log(' Password reset email sent to:', email);
    } catch (error: any) {
      console.error(
        ' Forgot password failed:',
        error.response?.data || error.message
      );
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with an error
      const message =
        error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // No response received
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();