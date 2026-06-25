import {
  useState,
  useEffect,
  type SubmitEvent
} from "react"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { Switch } from "@/shared/components/ui/switch"
import { Label } from "@/shared/components/ui/label"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  getSettings,
  updateSettings
} from "@/features/notifications/api/notifications-api"
import type { UserNotificationSettings } from "@/features/notifications/api/notifications-api"
import { toast } from "sonner"

export function NotificationSettingsPage() {
  useDocumentTitle("Notification Settings")

  const [settings, setSettings] = useState<UserNotificationSettings>({
    emailExamPublished: false,
    emailExamGraded: false,
    emailClassroomInvite: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true)
        const data = await getSettings()
        setSettings(data)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load notification settings.")
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [])

  const handleToggleChange = (key: keyof UserNotificationSettings, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      const updated = await updateSettings(settings)
      setSettings(updated)
      toast.success("Notification preferences updated.")
    } catch (err) {
      console.error(err)
      toast.error("Failed to save notification preferences.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
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
          <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage how and when you receive email notifications from the platform.
          </p>
        </div>
        <hr className="my-6 border-border" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-4 border-b border-border pb-4">
              <div className="space-y-1">
                <Label htmlFor="emailExamPublished" className="text-base font-semibold">
                  New Exam Published
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email immediately when a teacher publishes a new exam in your classrooms.
                </p>
              </div>
              <Switch
                id="emailExamPublished"
                checked={settings.emailExamPublished}
                onCheckedChange={(checked) => handleToggleChange("emailExamPublished", checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-4 border-b border-border pb-4">
              <div className="space-y-1">
                <Label htmlFor="emailExamGraded" className="text-base font-semibold">
                  Exam Graded
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email as soon as your submitted exam attempt has been graded and scores are released.
                </p>
              </div>
              <Switch
                id="emailExamGraded"
                checked={settings.emailExamGraded}
                onCheckedChange={(checked) => handleToggleChange("emailExamGraded", checked)}
              />
            </div>

            <div className="flex items-center justify-between space-x-4 pb-2">
              <div className="space-y-1">
                <Label htmlFor="emailClassroomInvite" className="text-base font-semibold">
                  Classroom Invitations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive an email invitation when a teacher invites you to join a classroom.
                </p>
              </div>
              <Switch
                id="emailClassroomInvite"
                checked={settings.emailClassroomInvite}
                onCheckedChange={(checked) => handleToggleChange("emailClassroomInvite", checked)}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              "Save preferences"
            )}
          </Button>
        </form>
      </div>
    </ScrollArea>
  )
}
