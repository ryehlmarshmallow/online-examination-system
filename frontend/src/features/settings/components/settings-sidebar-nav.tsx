import {
  CircleUserRoundIcon,
  BellIcon,
  Settings2Icon,
  LockIcon
} from "lucide-react"
import { NavSettings } from "@/shared/components/nav-settings"

const settingsNavItems = [
  {
    title: "Profile",
    url: "/settings/profile",
    icon: <CircleUserRoundIcon className="size-4" />,
  },
  {
    title: "Notifications",
    url: "/settings/notifications",
    icon: <BellIcon className="size-4" />,
  },
  {
    title: "Preferences",
    url: "/settings/preferences",
    icon: <Settings2Icon className="size-4" />,
  },
  {
    title: "Security",
    url: "/settings/security",
    icon: <LockIcon className="size-4" />,
  },
]

export function SettingsSidebarNav() {
  return <NavSettings items={settingsNavItems} />
}
