import {
  EyeIcon,
  EyeOffIcon
} from "lucide-react"
import {
  useMemo,
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
import { useDisclosure } from "@/shared/hooks/use-disclosure"

type SignupFormProps = ComponentProps<typeof Card> & {
  isSubmitting: boolean
  errorMessage: string | null
  onSignupSubmit: (
    username: string,
    firstName: string,
    middleName: string,
    lastName: string,
    email: string,
    password: string,
  ) => void
  onSwitchToLogin: () => void
}

export function SignupForm({
                             isSubmitting,
                             errorMessage,
                             onSignupSubmit,
                             onSwitchToLogin,
                             ...props
                           }: SignupFormProps) {
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const passwordVisibility = useDisclosure(false)
  const confirmPasswordVisibility = useDisclosure(false)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    onSignupSubmit(
      username.trim(),
      firstName.trim(),
      middleName.trim(),
      lastName.trim(),
      email.trim(),
      password,
    )
  }

  const confirmationError = useMemo(() => {
    if (!confirmPassword) {
      return null
    }

    return confirmPassword === password ? null : "Passwords do not match."
  }, [confirmPassword, password])

  const passwordLengthError = useMemo(() => {
    if (!password) {
      return null
    }

    return password.length >= 8 ? null : "Password must be at least 8 characters long."
  }, [password])

  const formError = passwordLengthError ?? confirmationError ?? errorMessage

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel>Username</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
                aria-label="Username"
                required
              />
            </Field>
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <Input
                id="first-name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                disabled={isSubmitting}
                aria-label="First name"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Middle Name (Optional)</FieldLabel>
              <Input
                id="middle-name"
                type="text"
                placeholder="A."
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                autoComplete="additional-name"
                disabled={isSubmitting}
                aria-label="Middle name"
              />
            </Field>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <Input
                id="last-name"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                disabled={isSubmitting}
                aria-label="Last name"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
                aria-label="Email address"
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={passwordVisibility.isOpen ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="pr-10"
                  aria-label="Password"
                  minLength={8}
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
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>
                Confirm Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={confirmPasswordVisibility.isOpen ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className="pr-10"
                  aria-label="Confirm Password"
                  minLength={8}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                  onClick={confirmPasswordVisibility.onToggle}
                  disabled={isSubmitting}
                  aria-label={confirmPasswordVisibility.isOpen ? "Hide confirm password" : "Show confirm password"}
                >
                  {confirmPasswordVisibility.isOpen ? (
                    <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isSubmitting || !!passwordLengthError || !!confirmationError}>
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-primary"
                    onClick={onSwitchToLogin}
                  >
                    Sign in
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
