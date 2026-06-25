import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query"
import type { ReactNode } from "react"
import { AuthBootstrap } from "@/app/providers/auth-bootstrap"
import { TooltipProvider } from "@/shared/components/ui/tooltip"
import { ThemeProvider } from "@/shared/components/theme-provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthBootstrap>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

