export type AuthUser = {
  username: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  userRole: string
}

export type LoginPayload = {
  identifier: string
  password: string
}

export type RegisterPayload = {
  username: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  password: string
}

export type VerifyCodePayload = {
  code: string
  email?: string
}

export type ResendVerificationPayload = {
  email?: string
}

export type ApiErrorPayload = {
  error?: string
  message?: string
  code?: string
}

