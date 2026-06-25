import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { register } from "@/features/auth/api/auth-api"
import { SignupForm } from "@/features/auth/components/signup-form"
import { getErrorMessage } from "@/shared/lib/get-error-message"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

type SignupFormValues = {
  username: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  password: string
}

const PENDING_EMAIL_KEY = "pendingVerificationEmail"

export function SignupPage() {
  useDocumentTitle("Sign Up")
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const signupMutation = useMutation({
    mutationFn: (payload: SignupFormValues) => register(payload),
    onSuccess: (_, variables) => {
      sessionStorage.setItem(PENDING_EMAIL_KEY, variables.email)
      toast.success("Verification code sent. Check your email.")
      navigate("/signup/verify", { replace: true })
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error))
    },
  })

  function handleSignup(
    username: string,
    firstName: string,
    middleName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    setErrorMessage(null)
    signupMutation.mutate({
      username,
      firstName,
      middleName: middleName || undefined,
      lastName,
      email,
      password,
    })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <SignupForm
        className="w-full"
        isSubmitting={signupMutation.isPending}
        errorMessage={errorMessage}
        onSignupSubmit={handleSignup}
        onSwitchToLogin={() => navigate("/login")}
      />
    </div>
  )
}

