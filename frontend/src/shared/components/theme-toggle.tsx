import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { useTheme } from "@/shared/components/theme-context"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"

import {
  CheckIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon
} from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              {theme === "light" && <SunIcon className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "dark" && <MoonIcon className="h-[1.2rem] w-[1.2rem]" />}
              {theme === "system" && <SunMoonIcon className="h-[1.2rem] w-[1.2rem]" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          Toggle theme
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center">
          <SunIcon className="h-4 w-4" />
          <span className="ml-auto">Light</span>
          <CheckIcon className={cn("ml-2 h-4 w-4", theme !== "light" && "invisible")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center">
          <MoonIcon className="h-4 w-4" />
          <span className="ml-auto">Dark</span>
          <CheckIcon className={cn("ml-2 h-4 w-4", theme !== "dark" && "invisible")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center">
          <SunMoonIcon className="h-4 w-4" />
          <span className="ml-auto">System</span>
          <CheckIcon className={cn("ml-2 h-4 w-4", theme !== "system" && "invisible")} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}