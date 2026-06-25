import type { ReactNode } from "react"
import {
  Link,
  useLocation
} from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

export function NavExam({
                          examTitle,
                          items,
                          className,
                        }: {
  examTitle: string
  items: {
    title: string
    url: string
    icon?: ReactNode
  }[]
  className?: string
}) {
  const location = useLocation()

  return (
    <SidebarGroup className={cn("flex flex-col", className)}>
      <SidebarGroupLabel
        className="text-xs font-medium uppercase tracking-wider text-muted-foreground shrink-0 min-w-0">
        <span className="truncate">{examTitle}</span>
      </SidebarGroupLabel>
      <SidebarGroupContent className="mt-1 flex-1 min-h-0">
        <ScrollArea className="h-full" constrainWidth>
          <SidebarMenu className="px-1.5 py-1">
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={location.pathname === item.url}
                >
                  <Link to={item.url}>
                    {item.icon}
                    <span className="truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
