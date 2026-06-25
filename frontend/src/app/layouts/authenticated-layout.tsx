import { Outlet } from "react-router-dom"
import { AppSidebar } from "@/shared/components/app-sidebar"
import { SiteHeader } from "@/shared/components/site-header"
import {
  SidebarInset,
  SidebarProvider
} from "@/shared/components/ui/sidebar"
import type { CSSProperties } from "react"

export function AuthenticatedLayout() {
  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden">
        <SiteHeader />
        <main className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
