import { apiClient } from '../client';
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
  VerifyResetCodeRequest,
} from './auth.types';

export const login = async (data: LoginRequest) => {
  return apiClient.post('/auth/login', data);
};

export const googleLogin = async (data: GoogleLoginRequest) => {
  return apiClient.post('/auth/google', data);
};

export const signup = async (data: SignupRequest) => {
  return apiClient.post('/auth/sign-up', data);
};

export const verifyOtp = async (data: VerifyOtpRequest) => {
  return apiClient.post('/auth/verify-email', data);
};

export const resendOtp = async (data: ResendOtpRequest) => {
  return apiClient.post('/auth/resend-verification', data);
};

export const verifyResetCode = async (data: VerifyResetCodeRequest) => {
  return apiClient.post('/auth/verify-reset-code', data);
};

export const forgotPassword = async (data: ForgotPasswordRequest) => {
  return apiClient.post('/auth/forgot-password', data);
};

export const resetPassword = async (data: ResetPasswordRequest) => {
  return apiClient.post('/auth/reset-password', data);
};

export const logout = async () => {
  return apiClient.post('/auth/logout');
};
