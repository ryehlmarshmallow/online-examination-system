import type { ReactNode } from "react"
import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom"

const PENDING_EMAIL_KEY = "pendingVerificationEmail"

type RequirePendingVerificationEmailProps = {
  children?: ReactNode
}

export function RequirePendingVerificationEmail({ children }: RequirePendingVerificationEmailProps) {
  const location = useLocation()
  const pendingEmail = sessionStorage.getItem(PENDING_EMAIL_KEY)?.trim() ?? ""
  const locationState = location.state as { email?: string } | null
  const stateEmail = locationState?.email?.trim() ?? ""
  const hasPendingEmail = pendingEmail.length > 0 || stateEmail.length > 0

  if (!hasPendingEmail) {
    return <Navigate to="/signup" replace />
  }

  return children ? <>{children}</> : <Outlet />
}

