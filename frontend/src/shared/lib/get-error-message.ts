import { AxiosError } from "axios"
import type { ApiErrorPayload } from "@/features/auth/types/auth"

function getErrorPayload(error: unknown): ApiErrorPayload | undefined {
  if (error instanceof AxiosError) {
    return error.response?.data as ApiErrorPayload | undefined
  }

  return undefined
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const payload = getErrorPayload(error)
    const message = payload?.error ?? payload?.message ?? error.message

    if (error.response?.status === 500 || message.includes("status code 500")) {
      return "Internal server error. Please try again later."
    }

    return message
  }

  return "Something went wrong. Please try again."
}

export function getErrorCode(error: unknown): string | undefined {
  return getErrorPayload(error)?.code
}

