import {
  useState,
  type SubmitEvent
} from "react"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { updateProfile } from "@/features/auth/api/auth-api"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { toast } from "sonner"

export function ProfileSettingsPage() {
  useDocumentTitle("Profile Settings")
  const authUser = useAuthStore((state) => state.authUser)
  const setAuthUser = useAuthStore((state) => state.setAuthUser)

  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [prevAuthUser, setPrevAuthUser] = useState(authUser)

  // Initialize values
  if (authUser !== prevAuthUser) {
    setPrevAuthUser(authUser)
    if (authUser) {
      setFirstName(authUser.firstName || "")
      setMiddleName(authUser.middleName || "")
      setLastName(authUser.lastName || "")
    }
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and Last name are required.")
      return
    }

    try {
      setIsSaving(true)
      const updatedUser = await updateProfile({
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        lastName: lastName.trim(),
      })
      setAuthUser(updatedUser)
      toast.success("Profile updated successfully.")
    } catch (err) {
      console.error(err)
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update profile."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (!authUser) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="py-6 px-4 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground text-sm">
            Update your public profile name and view your account information.
          </p>
        </div>
        <hr className="my-6 border-border" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                aria-label="Username"
                value={authUser.username}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Usernames cannot be changed.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                aria-label="Email Address"
                value={authUser.email}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                aria-label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                aria-label="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Robert"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                aria-label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              aria-label="Role"
              value={authUser.userRole}
              disabled
              className="bg-muted text-muted-foreground w-full md:w-1/3"
            />
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              "Save profile changes"
            )}
          </Button>
        </form>
      </div>
    </ScrollArea>
  )
}
