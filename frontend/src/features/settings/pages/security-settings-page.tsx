import {
  useState,
  useMemo,
  type SubmitEvent
} from "react"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { updatePassword } from "@/features/auth/api/auth-api"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { toast } from "sonner"

export function SecuritySettingsPage() {
  useDocumentTitle("Security Settings")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const passwordLengthError = useMemo(() => {
    if (!newPassword) return null
    return newPassword.length >= 8 ? null : "New password must be at least 8 characters long."
  }, [newPassword])

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword || !newPassword) return null
    return newPassword === confirmPassword ? null : "Passwords do not match."
  }, [newPassword, confirmPassword])

  const isFormValid = useMemo(() => {
    return (
      currentPassword.trim().length > 0 &&
      newPassword.length >= 8 &&
      newPassword === confirmPassword
    )
  }, [currentPassword, newPassword, confirmPassword])

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      setIsSaving(true)
      await updatePassword({
        currentPassword,
        newPassword,
      })
      toast.success("Password changed successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      console.error(err)
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update password."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="py-6 px-4 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
          <p className="text-muted-foreground text-sm">
            Update your password to keep your account secure.
          </p>
        </div>
        <hr className="my-6 border-border" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                aria-label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                aria-label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {passwordLengthError && (
                <p className="text-xs text-destructive">{passwordLengthError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                aria-label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {confirmPasswordError && (
                <p className="text-xs text-destructive">{confirmPasswordError}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSaving || !isFormValid}>
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </div>
    </ScrollArea>
  )
}
