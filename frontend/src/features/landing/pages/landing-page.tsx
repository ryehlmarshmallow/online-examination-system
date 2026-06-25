import { Link } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function LandingPage() {
  useDocumentTitle("")
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface">
      <div className="max-w-2xl p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Online Examination System</h1>
        <p className="text-muted-foreground mb-6">
          A minimal placeholder landing page. Log in or sign up to access your
          dashboard and start creating or taking exams.
        </p>

        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
