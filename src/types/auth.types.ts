/**
 * Tipos de Autenticación - Valnor Juego
 */

import { User } from './user.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  user: User;
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface CheckAvailabilityParams {
  email?: string;
  username?: string;
}

export interface CheckAvailabilityResponse {
  existsEmail?: boolean;
  existsUsername?: boolean;
}

export interface ValidateResetTokenResponse {
  ok: boolean;
  email?: string;
  expiresIn?: number;
}
