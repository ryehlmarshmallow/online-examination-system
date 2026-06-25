import {
  useEffect,
  useMemo,
  useState,
  type SubmitEvent
} from "react"
import { RefreshCwIcon } from "lucide-react"

import {
  Alert,
  AlertDescription
} from "@/shared/components/ui/alert"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@shared/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@shared/components/ui/input-otp"

type InputOTPFormProps = {
  email: string
  isSubmitting: boolean
  isResending: boolean
  errorMessage: string | null
  onVerify: (code: string) => void
  onResend: () => void
}

const RESEND_COOLDOWN_SECONDS = 60
const RESEND_COOLDOWN_STORAGE_KEY_PREFIX = "otp-resend-last-request-at"

function getResendCooldownRemainingSeconds(lastRequestAtMs: number): number {
  const cooldownExpiresAtMs = lastRequestAtMs + RESEND_COOLDOWN_SECONDS * 1000
  const remainingMs = cooldownExpiresAtMs - Date.now()
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
}

export function InputOTPForm({
                               email,
                               isSubmitting,
                               isResending,
                               errorMessage,
                               onVerify,
                               onResend,
                             }: InputOTPFormProps) {
  const [code, setCode] = useState("")

  const resendCooldownStorageKey = useMemo(
    () => `${RESEND_COOLDOWN_STORAGE_KEY_PREFIX}:${email.toLowerCase()}`,
    [email]
  )

  const [resendCooldownRemainingSeconds, setResendCooldownRemainingSeconds] =
    useState(() => {
      const existingTimestamp = localStorage.getItem(resendCooldownStorageKey)
      if (existingTimestamp !== null) {
        const lastRequestAtMs = Number(existingTimestamp)
        if (!Number.isNaN(lastRequestAtMs)) {
          return getResendCooldownRemainingSeconds(lastRequestAtMs)
        }
      }
      return 0
    })

  useEffect(() => {
    if (resendCooldownRemainingSeconds <= 0) return

    const timer = window.setInterval(() => {
      const storedTimestamp = localStorage.getItem(resendCooldownStorageKey)
      if (storedTimestamp === null) {
        setResendCooldownRemainingSeconds(0)
        return
      }

      const lastRequestAtMs = Number(storedTimestamp)
      const remaining = getResendCooldownRemainingSeconds(lastRequestAtMs)

      setResendCooldownRemainingSeconds(remaining)

      if (remaining <= 0) {
        window.clearInterval(timer)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldownRemainingSeconds, resendCooldownStorageKey])

  const isResendDisabled = isResending || resendCooldownRemainingSeconds > 0

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onVerify(code)
  }

  function handleResendClick() {
    if (isResendDisabled) return

    const nowMs = Date.now()
    localStorage.setItem(resendCooldownStorageKey, String(nowMs))
    setResendCooldownRemainingSeconds(RESEND_COOLDOWN_SECONDS)
    onResend()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Verify your account</CardTitle>
          <CardDescription>
            Enter the verification code we sent to <span className="font-medium">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between mb-2">
              <FieldLabel>
                Verification code
              </FieldLabel>
              <Button
                variant="outline"
                size="xs"
                type="button"
                onClick={handleResendClick}
                disabled={isResendDisabled}
                className="flex items-center gap-2 px-3"
              >
                <RefreshCwIcon
                  size={14}
                  className={isResending ? "animate-spin" : undefined}
                />

                {resendCooldownRemainingSeconds > 0 && !isResending ? (
                  <span
                    className="text-right tabular-nums inline-block"
                    style={{ width: "110px" }}
                  >
                    Resend code in {resendCooldownRemainingSeconds}s
                  </span>
                ) : (
                  <span>{isResending ? "Resending..." : "Resend code"}</span>
                )}
              </Button>
            </div>

            <div className="flex justify-center py-2">
              <InputOTP
                maxLength={6}
                id="otp-verification"
                aria-label="Verification code"
                value={code}
                onChange={setCode}
                disabled={isSubmitting}
                required
              >
                <InputOTPGroup
                  className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator className="mx-2" />
                <InputOTPGroup
                  className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <FieldDescription className="mt-2">
              The verification code is six digits.
            </FieldDescription>
          </Field>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || code.length !== 6}
          >
            {isSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}