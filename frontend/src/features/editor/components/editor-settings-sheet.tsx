import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Button } from "@/shared/components/ui/button";
import { Settings2Icon } from "lucide-react";
import { useEditorSettings } from "@/shared/hooks/use-editor-settings";
import { AVAILABLE_EDITOR_THEMES } from "../lib/constants";

export function EditorSettingsSheet() {
  const editorSettings = useEditorSettings();

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Editor settings">
              <Settings2Icon className="w-4 h-4" />
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Editor Settings</p>
        </TooltipContent>
      </Tooltip>
      <SheetContent side="right" className="sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>Editor Settings</SheetTitle>
          <SheetDescription>
            Customize your code editor experience. These settings are persisted locally.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
          <div className="grid gap-3">
            <Label>Theme</Label>
            <Select
              value={editorSettings.theme}
              onValueChange={editorSettings.setTheme}
            >
              <SelectTrigger id="theme" aria-label="Theme" className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-72">
                  {AVAILABLE_EDITOR_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label>Font Size</Label>
            <Input
              id="fontSize"
              type="number"
              value={editorSettings.fontSize}
              onChange={(e) => editorSettings.setFontSize(parseInt(e.target.value) || 15)}
              min={8}
              max={32}
              aria-label="Font size"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="cursor-pointer">
              Line Wrapping
            </Label>
            <Switch
              id="lineWrapping"
              aria-label="Line wrapping"
              checked={editorSettings.lineWrapping}
              onCheckedChange={(checked) => editorSettings.setLineWrapping(checked)}
            />
          </div>
        </div>
        <SheetFooter className="px-4 flex flex-col gap-2">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => editorSettings.reset()}
          >
            Reset to Defaults
          </Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
