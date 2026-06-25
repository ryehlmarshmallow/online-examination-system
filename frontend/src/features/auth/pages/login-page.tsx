import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { login } from "@/features/auth/api/auth-api"
import { LoginForm } from "@/features/auth/components/login-form"
import {
  getErrorCode,
  getErrorMessage
} from "@/shared/lib/get-error-message"
import { useAuthStore } from "@/features/auth/store/auth-store"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

type LoginValues = {
  identifier: string
  password: string
}

const PENDING_EMAIL_KEY = "pendingVerificationEmail"
const ACCOUNT_UNVERIFIED = "ACCOUNT_UNVERIFIED"
const ACCOUNT_LOCKED = "ACCOUNT_LOCKED"
const ACCOUNT_LOCKED_MESSAGE =
  "Your account has been suspended. Contact administration."

export function LoginPage() {
  useDocumentTitle("Log In")
  const navigate = useNavigate()
  const setAuthUser = useAuthStore((state) => state.setAuthUser)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: (payload: LoginValues) => login(payload),
    onSuccess: (user) => {
      setAuthUser(user)
      toast.success(`Welcome back, ${user.firstName}!`)
      navigate("/dashboard", { replace: true })
    },
    onError: (error, variables) => {
      const errorCode = getErrorCode(error)

      if (errorCode === ACCOUNT_UNVERIFIED) {
        const identifier = variables.identifier.trim()
        // If the identifier is an email, we can pre-fill the verify page
        if (identifier.includes("@")) {
          const email = identifier.toLowerCase()
          sessionStorage.setItem(PENDING_EMAIL_KEY, email)
          navigate("/signup/verify", { replace: true, state: { email } })
        } else {
          // If it was a username, they'll have to enter their email on the verify page
          navigate("/signup/verify", { replace: true })
        }
        return
      }

      if (errorCode === ACCOUNT_LOCKED) {
        setErrorMessage(ACCOUNT_LOCKED_MESSAGE)
        return
      }

      setErrorMessage(getErrorMessage(error))
    },
  })

  function handleSubmit(identifier: string, password: string) {
    setErrorMessage(null)
    loginMutation.mutate({ identifier, password })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <LoginForm
        className="w-full"
        isSubmitting={loginMutation.isPending}
        errorMessage={errorMessage}
        onLoginSubmit={handleSubmit}
        onSwitchToSignup={() => navigate("/signup")}
      />
    </div>
  )
}

