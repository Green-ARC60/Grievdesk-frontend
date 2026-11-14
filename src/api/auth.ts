import apiClient, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './client';
import {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  User,
} from '../types/auth';

/**
 * Submit login credentials to POST /api/auth/login
 */
export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

/**
 * Register a new user to POST /api/auth/register
 */
export async function registerApi(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/auth/register', payload);
  return response.data;
}

/**
 * Fetch the currently logged-in user's profile from GET /api/users/me
 */
export async function getCurrentUserApi(): Promise<User> {
  const response = await apiClient.get<{ user: User }>('/users/me');
  return response.data.user;
}

/**
 * Helper utilities for localStorage persistence
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Request a 6-digit OTP to be sent to user's registered Gmail
 */
export async function sendForgotPasswordOtpApi(gmail: string): Promise<{ message: string; gmail: string }> {
  const response = await apiClient.post<{ message: string; gmail: string }>('/auth/forgot-password/send-otp', { gmail });
  return response.data;
}

/**
 * Verify 6-digit OTP and retrieve reset_token
 */
export async function verifyForgotPasswordOtpApi(gmail: string, otp: string): Promise<{ message: string; reset_token: string }> {
  const response = await apiClient.post<{ message: string; reset_token: string }>('/auth/forgot-password/verify-otp', { gmail, otp });
  return response.data;
}

/**
 * Reset password using the reset_token
 */
export async function resetForgotPasswordApi(reset_token: string, new_password: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/auth/forgot-password/reset-password', { reset_token, new_password });
  return response.data;
}


