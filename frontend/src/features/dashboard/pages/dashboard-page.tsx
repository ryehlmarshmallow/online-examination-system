import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function DashboardPage() {
  useDocumentTitle("Dashboard")

  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Dashboard is coming soon.</p>
      </div>
    </div>
  )
}



