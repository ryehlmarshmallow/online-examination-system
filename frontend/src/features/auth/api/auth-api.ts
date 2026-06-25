import { apiClient } from "@/shared/lib/apiClient"
import type {
  AuthUser,
  LoginPayload,
  ResendVerificationPayload,
  RegisterPayload,
  VerifyCodePayload,
} from "@/features/auth/types/auth"

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post("/api/identity/auth/register", payload)
}

export async function verifyCode(payload: VerifyCodePayload): Promise<void> {
  await apiClient.post("/api/identity/auth/verify", payload)
}

export async function resendVerificationCode(payload?: ResendVerificationPayload): Promise<void> {
  await apiClient.post("/api/identity/auth/resend-verification", payload ?? {})
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const response = await apiClient.post<AuthUser>("/api/identity/auth/login", payload)
  return response.data
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("/api/identity/auth/me")
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.post("/api/identity/auth/logout")
}

export async function updateProfile(payload: {
  firstName: string;
  middleName?: string | null;
  lastName: string
}): Promise<AuthUser> {
  const response = await apiClient.put<AuthUser>("/api/identity/auth/profile", payload)
  return response.data
}

export async function updatePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  await apiClient.put("/api/identity/auth/password", payload)
}

