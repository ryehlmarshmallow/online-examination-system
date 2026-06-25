import {
  EyeIcon,
  EyeOffIcon
} from "lucide-react"
import {
  useState,
  type SubmitEvent,
  type ComponentProps
} from "react"
import {
  Alert,
  AlertDescription
} from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { cn } from "@/shared/lib/utils"
import { useDisclosure } from "@/shared/hooks/use-disclosure"

type LoginFormProps = ComponentProps<"div"> & {
  isSubmitting: boolean
  errorMessage: string | null
  onLoginSubmit: (identifier: string, password: string) => void
  onSwitchToSignup: () => void
}

export function LoginForm({
                            className,
                            isSubmitting,
                            errorMessage,
                            onLoginSubmit,
                            onSwitchToSignup,
                            ...props
                          }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const passwordVisibility = useDisclosure(false)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onLoginSubmit(identifier.trim(), password)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email or username below to login
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <Field>
                <FieldLabel>Email or Username</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="m@example.com or username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  disabled={isSubmitting}
                  aria-label="Email or Username"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel>Password</FieldLabel>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={passwordVisibility.isOpen ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    aria-label="Password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                    onClick={passwordVisibility.onToggle}
                    disabled={isSubmitting}
                    aria-label={passwordVisibility.isOpen ? "Hide password" : "Show password"}
                  >
                    {passwordVisibility.isOpen ? (
                      <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </Field>
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-primary"
                    onClick={onSwitchToSignup}
                  >
                    Sign up
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
