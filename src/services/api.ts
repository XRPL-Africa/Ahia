// src/services/api.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';


const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null; // SSR safety
    return localStorage.getItem(key);
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  remove: (...keys: string[]): void => {
    if (typeof window === 'undefined') return;
    keys.forEach((key) => localStorage.removeItem(key));
  },
};

// Base URL - Update when Isede provides the backend URL
const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api' // Development (Isede's local backend)
    : 'https://api.ahiamarket.app/api'; // Production

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// Adds JWT token to every outgoing request
// ============================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      // Get token from localStorage (Next.js compatible)
      const token = storage.get('access_token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(' API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return config;
    }
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// Handles token refresh and errors
// ============================================
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refresh token from localStorage
        const refreshToken = storage.get('refresh_token');

        if (refreshToken) {
          // Call refresh token endpoint
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;

          //  Save new token to localStorage
          storage.set('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear storage and redirect to login
        storage.remove('access_token', 'refresh_token', 'user');
        console.error('Token refresh failed. Redirecting to login...');

        //  Next.js redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }

        return Promise.reject(refreshError);
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// ============================================
// RETRY LOGIC
// Retries failed network requests up to 3 times
// ============================================
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

api.interceptors.response.use(
  undefined,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      retryCount?: number;
    };

    if (!config) return Promise.reject(error);

    if (!config.retryCount) {
      config.retryCount = 0;
    }

    // Retry on network errors only
    if (error.message === 'Network Error' && config.retryCount < MAX_RETRIES) {
      config.retryCount += 1;

      console.log(
        ` Retrying request... Attempt ${config.retryCount}/${MAX_RETRIES}`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
export { storage, BASE_URL };