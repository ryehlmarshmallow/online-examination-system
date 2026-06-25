import {
  useEffect,
  useRef,
  type ReactNode
} from "react"
import { Spinner } from "@/shared/components/ui/spinner"
import { useAuthStore } from "@/features/auth/store/auth-store"

type AuthBootstrapProps = {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const hasHydratedRef = useRef(false)
  const isHydrating = useAuthStore((state) => state.isHydrating)
  const hydrateCurrentUser = useAuthStore((state) => state.hydrateCurrentUser)

  useEffect(() => {
    if (hasHydratedRef.current) {
      return
    }

    hasHydratedRef.current = true
    void hydrateCurrentUser()
  }, [hydrateCurrentUser])

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Spinner className="size-6 text-muted-foreground" aria-hidden />
      </div>
    )
  }

  return <>{children}</>
}

