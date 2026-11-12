import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BackendErrorResponse } from '../types/api';

export const TOKEN_STORAGE_KEY = 'grievdesk_token';
export const USER_STORAGE_KEY = 'grievdesk_user';

type UnauthorizedCallback = () => void;
let unauthorizedListener: UnauthorizedCallback | null = null;

export function registerUnauthorizedHandler(callback: UnauthorizedCallback) {
  unauthorizedListener = callback;
}

export function unregisterUnauthorizedHandler() {
  unauthorizedListener = null;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 auto-logout
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // If 401 occurs on an authenticated endpoint (not the login endpoint itself)
    const isLoginEndpoint = url.includes('/auth/login');
    if (status === 401 && !isLoginEndpoint) {
      // Clear credentials
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      // Trigger AuthContext logout handler if registered
      if (unauthorizedListener) {
        unauthorizedListener();
      }

      // Dispatch global window event for components that need notification
      window.dispatchEvent(new CustomEvent('grievdesk:unauthorized'));

      // If not already on login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

