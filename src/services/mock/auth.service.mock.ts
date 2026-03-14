// src/services/auth.service.mock.ts

'use client';

import {
  RegisterRequest,
  AuthResponse,
  RegistrationResponse,
  User,
} from '../auth.service';

/**
 * Mock Auth Service - 
 */
class MockAuthService {
  private mockDelay = 1000; // Simulate network delay

  async login(email: string, password: string): Promise<AuthResponse> {
    await this.delay();

    // Mock validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Mock successful response
    const mockResponse: AuthResponse = {
      access_token: 'mock_access_token_' + Date.now(),
      refresh_token: 'mock_refresh_token_' + Date.now(),
      user: {
        id: 'user_123',
        email: email,
        name: 'Safari Test User',
        campus_id: 'UNIBEN',
        verification_status: 'verified',
        trust_score: 100,
        wallet_address: '0x1234567890abcdef',
        created_at: new Date().toISOString(),
      },
    };

    // Save tokens to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', mockResponse.access_token);
      localStorage.setItem('refresh_token', mockResponse.refresh_token);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
    }

    console.log('MOCK Login successful:', mockResponse.user);

    return mockResponse;
  }

  async register(userData: RegisterRequest): Promise<RegistrationResponse> {
    await this.delay();

    // Mock validation
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('All fields are required');
    }

    // Mock successful response
    const mockResponse: RegistrationResponse = {
      user_id: 'user_' + Date.now(),
      verification_token: 'verify_token_' + Date.now(),
      status: 'pending',
      estimated_verification_time: '3 hours',
    };

    console.log('MOCK Registration successful:', mockResponse);

    return mockResponse;
  }

  logout(): void {
    // Clear all stored tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }

    console.log('MOCK Logout successful');
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('access_token');
    return !!token;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.delay();
    console.log('MOCK Password reset email sent to:', email);
  }

  private delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.mockDelay));
  }
}

export default new MockAuthService();