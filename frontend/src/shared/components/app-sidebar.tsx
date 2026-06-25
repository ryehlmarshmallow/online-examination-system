import { type ComponentProps } from "react"
import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboardIcon,
  RocketIcon,
  SchoolIcon,
  ClipboardPenIcon,
  DatabaseIcon,
  BellIcon,
  BellDotIcon
} from "lucide-react"

import { NavMain } from "@/shared/components/nav-main"
import { NavSecondary } from "@/shared/components/nav-secondary"
import { NavUser } from "@/shared/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"

import { getUnreadCount } from "@/features/notifications/api/notifications-api"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { ClassroomSidebarNav } from "@/features/classrooms/components/classroom-sidebar-nav"
import { SettingsSidebarNav } from "@/features/settings/components/settings-sidebar-nav"
import { ExamSidebarNav } from "@/features/exams/components/exam-sidebar-nav"
import { HierarchyTree } from "@/features/hierarchy/components/hierarchy-tree"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Classroom",
      url: "/classrooms",
      icon: <SchoolIcon />,
    },
    {
      title: "Template",
      url: "/templates",
      icon: <ClipboardPenIcon />,
    },
    {
      title: "Pool",
      url: "/pools",
      icon: <DatabaseIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const location = useLocation()
  const authUser = useAuthStore((state) => state.authUser)

  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 30000,
    refetchInterval: 30000,
    enabled: !!authUser,
  })

  const hasUnread = unreadCount !== undefined && unreadCount > 0

  const navSecondary = [
    {
      title: "Notifications",
      url: "/notifications",
      icon: hasUnread ? <BellDotIcon /> : <BellIcon />,
    },
  ]

  const isPoolSection = location.pathname.startsWith("/pools")
  const isTemplateSection = location.pathname.startsWith("/templates")
  const isSettingsSection = location.pathname.startsWith("/settings")
  const isClassroomSection = location.pathname.startsWith("/classrooms") && !isSettingsSection

  const user = authUser ? {
    firstName: authUser.firstName,
    middleName: authUser.middleName,
    lastName: authUser.lastName,
    email: authUser.email,
    avatar: null,
  } : {
    firstName: "Guest",
    lastName: "",
    email: "",
    avatar: null,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard">
                <RocketIcon className="size-5!" />
                <span className="text-base font-semibold truncate">Online Examination System</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden!">
        <NavMain items={data.navMain} />
        
        {isClassroomSection && (
          <>
            <ClassroomSidebarNav />
            <ExamSidebarNav />
          </>
        )}
        
        {isSettingsSection && <SettingsSidebarNav />}
        
        {isPoolSection && <HierarchyTree domain="POOL" className="flex-1 min-h-0" />}
        {isTemplateSection && <HierarchyTree domain="TEMPLATE" className="flex-1 min-h-0" />}
        
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

