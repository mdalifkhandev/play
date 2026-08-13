import { useMutation } from '@tanstack/react-query';
import {
  forgotPassword,
  googleLogin,
  login,
  logout,
  resendOtp,
  resetPassword,
  signup,
  verifyOtp,
  verifyResetCode,
} from './auth.api';
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

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
  });
};

export const useGoogleLoginMutation = () => {
  return useMutation({
    mutationFn: (data: GoogleLoginRequest) => googleLogin(data),
  });
};

export const useSignupMutation = () => {
  return useMutation({
    mutationFn: (data: SignupRequest) => signup(data),
  });
};

export const useVerifyOtpMutation = () => {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtp(data),
  });
};

export const useResendOtpMutation = () => {
  return useMutation({
    mutationFn: (data: ResendOtpRequest) => resendOtp(data),
  });
};

export const useVerifyResetCodeMutation = () => {
  return useMutation({
    mutationFn: (data: VerifyResetCodeRequest) => verifyResetCode(data),
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => forgotPassword(data),
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => resetPassword(data),
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: () => logout(),
  });
};
