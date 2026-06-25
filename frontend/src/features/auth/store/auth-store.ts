import { create } from "zustand"
import { getCurrentUser } from "@/features/auth/api/auth-api"
import type { AuthUser } from "@/features/auth/types/auth"

type AuthState = {
  authUser: AuthUser | null
  isHydrating: boolean
  setAuthUser: (user: AuthUser) => void
  clearAuthUser: () => void
  hydrateCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  isHydrating: true,
  setAuthUser: (user) => set({ authUser: user }),
  clearAuthUser: () => set({ authUser: null }),
  hydrateCurrentUser: async () => {
    set({ isHydrating: true })

    try {
      const user = await getCurrentUser()
      set({ authUser: user })
    } catch {
      // Missing or expired sessions are normal during bootstrap.
      set({ authUser: null })
    } finally {
      set({ isHydrating: false })
    }
  },
}))