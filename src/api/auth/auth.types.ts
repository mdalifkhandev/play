export interface LoginRequest {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  email: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface VerifyResetCodeRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword?: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
}

export interface AuthTokens {
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  isEmailVerified: boolean;
  // ... other fields as needed
}

export interface AuthResponse {
  data: {
    tokens: AuthTokens;
    user: AuthUser;
  };
}

export interface VerifyOtpResponse {
  data: {
    resetToken?: string;
  };
}
