import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import {
  useTheme,
  type Theme
} from "@/shared/components/theme-context"
import { useEditorSettings } from "@/shared/hooks/use-editor-settings"
import { Label } from "@/shared/components/ui/label"
import { Switch } from "@/shared/components/ui/switch"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

import { AVAILABLE_EDITOR_THEMES } from "@/features/editor/lib/constants"

export function PreferencesSettingsPage() {
  useDocumentTitle("Preferences")
  const { theme: appTheme, setTheme: setAppTheme } = useTheme()
  const editorSettings = useEditorSettings()

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="py-6 px-4 lg:px-8 max-w-2xl mx-auto w-full">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Preferences Settings</h1>
          <p className="text-muted-foreground text-sm">
            Customize your appearance and default code editor configurations.
          </p>
        </div>
        <hr className="my-6 border-border" />

        <div className="space-y-8">
          {/* App Theme settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">App Theme</h2>
            <div className="max-w-xs space-y-2">
              <Label htmlFor="appThemeSelect">Theme Preference</Label>
              <Select value={appTheme} onValueChange={(val) => setAppTheme(val as Theme)}>
                <SelectTrigger id="appThemeSelect">
                  <SelectValue placeholder="Choose theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="light">Light Mode</SelectItem>
                  <SelectItem value="dark">Dark Mode</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your interface color preference.
              </p>
            </div>
          </div>

          <hr className="border-border" />

          {/* Code Editor settings */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold tracking-tight">Code Editor Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="editorThemeSelect">Editor Color Theme</Label>
                <Select
                  value={editorSettings.theme}
                  onValueChange={editorSettings.setTheme}
                >
                  <SelectTrigger id="editorThemeSelect">
                    <SelectValue placeholder="Select editor theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-64">
                      {AVAILABLE_EDITOR_THEMES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editorFontSize">Editor Font Size (px)</Label>
                <Input
                  id="editorFontSize"
                  aria-label="Editor Font Size (px)"
                  type="number"
                  value={editorSettings.fontSize}
                  onChange={(e) => editorSettings.setFontSize(parseInt(e.target.value) || 15)}
                  min={8}
                  max={32}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="space-y-0.5">
                <Label htmlFor="editorLineWrapping" className="text-base font-semibold cursor-pointer">
                  Editor Line Wrapping
                </Label>
                <p className="text-sm text-muted-foreground">
                  Wrap long lines of code automatically to fit the editor width.
                </p>
              </div>
              <Switch
                id="editorLineWrapping"
                checked={editorSettings.lineWrapping}
                onCheckedChange={editorSettings.setLineWrapping}
              />
            </div>
          </div>

          <hr className="border-border" />

          <div className="pt-2 flex justify-start">
            <Button
              variant="outline"
              onClick={() => {
                editorSettings.reset()
                setAppTheme("system")
              }}
            >
              Reset all to defaults
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
