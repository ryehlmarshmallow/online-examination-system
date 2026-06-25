import type { ReactNode } from "react"
import {
  Navigate,
  Outlet
} from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/auth-store"

type RequireGuestProps = {
  children?: ReactNode
}

export function RequireGuest({ children }: RequireGuestProps) {
  const authUser = useAuthStore((state) => state.authUser)

  if (authUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

