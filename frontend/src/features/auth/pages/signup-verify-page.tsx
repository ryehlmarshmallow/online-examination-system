import {
  useEffect,
  useMemo,
  useState
} from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  useLocation,
  useNavigate
} from "react-router-dom"
import {
  resendVerificationCode,
  verifyCode
} from "@/features/auth/api/auth-api"
import { InputOTPForm } from "@/features/auth/components/input-otp-form"
import { getErrorMessage } from "@/shared/lib/get-error-message"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

const PENDING_EMAIL_KEY = "pendingVerificationEmail"

export function SignupVerifyPage() {
  useDocumentTitle("Verify Account")
  const navigate = useNavigate()
  const location = useLocation()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stateEmail = ((location.state as { email?: string } | null)?.email ?? "").trim().toLowerCase()

  const pendingEmail = useMemo(
    () => {
      if (stateEmail.length > 0) {
        return stateEmail
      }

      return (sessionStorage.getItem(PENDING_EMAIL_KEY) ?? "").trim().toLowerCase()
    },
    [stateEmail]
  )

  useEffect(() => {
    if (pendingEmail.length > 0) {
      sessionStorage.setItem(PENDING_EMAIL_KEY, pendingEmail)
    }
  }, [pendingEmail])

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyCode({ code, email: pendingEmail }),
    onSuccess: () => {
      toast.success("Email verified. You can now log in.")
      navigate("/login", { replace: true })
      sessionStorage.removeItem(PENDING_EMAIL_KEY)
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error))
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode({ email: pendingEmail }),
    onSuccess: () => {
      toast.success("Verification code resent.")
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error))
    },
  })

  function handleVerify(code: string) {
    setErrorMessage(null)
    verifyMutation.mutate(code)
  }

  function handleResend() {
    setErrorMessage(null)
    resendMutation.mutate()
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <InputOTPForm
        email={pendingEmail}
        isSubmitting={verifyMutation.isPending}
        isResending={resendMutation.isPending}
        errorMessage={errorMessage}
        onVerify={handleVerify}
        onResend={handleResend}
      />
    </div>
  )
}
