import type { ReactNode } from "react"
import {
  Navigate,
  Outlet
} from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/auth-store"

type RequireAuthProps = {
  children?: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const authUser = useAuthStore((state) => state.authUser)

  if (!authUser) {
    return <Navigate to="/" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

