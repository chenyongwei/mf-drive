import api from './api';
import type {
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordCredentials,
  AuthResponse,
  User,
} from '../types/auth';

/**
 * Send verification code to email
 */
export const sendVerificationCode = async (email: string): Promise<void> => {
  const response = await api.post('/auth/send-verification-code', { email });
  return response.data;
};

/**
 * Register new user with verification code
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', {
    email: credentials.email,
    code: credentials.verificationCode, // Backend expects 'code' not 'verificationCode'
    password: credentials.password,
  });
  return response.data;
};

/**
 * Login with email and password
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', {
    email: credentials.email,
    password: credentials.password,
  });
  return response.data;
};

/**
 * Get current user info
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

/**
 * Send password reset code to email
 */
export const sendResetCode = async (email: string): Promise<void> => {
  const response = await api.post('/auth/send-reset-code', { email });
  return response.data;
};

/**
 * Reset password with reset code
 */
export const resetPassword = async (credentials: ResetPasswordCredentials): Promise<void> => {
  const response = await api.post('/auth/reset-password', {
    email: credentials.email,
    code: credentials.resetCode, // Backend expects 'code' not 'resetCode'
    newPassword: credentials.newPassword,
  });
  return response.data;
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  // Call backend to clear the HttpOnly cookie
  await api.post('/auth/logout');
  // Clear any client-side state
  localStorage.removeItem('user');
  localStorage.removeItem('workspace');
};
