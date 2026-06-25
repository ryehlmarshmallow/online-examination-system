import {
  useLocation,
  Link
} from "react-router-dom"
import { cn } from "@/shared/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/shared/components/ui/sidebar"
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { hierarchyApi } from "../api/hierarchy-api"
import type { DomainType } from "../types/hierarchy"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"

interface HierarchyTreeProps {
  domain: DomainType
  className?: string
}

export function HierarchyTree({ domain, className }: HierarchyTreeProps) {
  const location = useLocation()
  const { data: nodes, isLoading } = useQuery({
    queryKey: ["hierarchy-tree", domain],
    queryFn: () => hierarchyApi.getFullTree(domain),
  })

  if (isLoading || !nodes) return null

  const rootUrl = domain === "POOL" ? "/pools" : "/templates"
  const label = domain === "POOL" ? "Pools" : "Templates"

  // Build tree structure
  const buildTree = (parentId: string | null) => {
    return nodes
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const renderNodes = (parentId: string | null) => {
    const children = buildTree(parentId)
    if (children.length === 0) return null

    return children.map((node) => {
      const isFolder = node.nodeType === "FOLDER"
      const url = isFolder ? `${rootUrl}/f/${node.id}` : `${rootUrl}/${node.id}`
      const hasChildren = nodes.some((n) => n.parentId === node.id)
      const Icon = isFolder ? FolderIcon : FileIcon

      if (!isFolder || !hasChildren) {
        return (
          <SidebarMenuSubItem key={node.id}>
            <SidebarMenuSubButton asChild isActive={location.pathname === url}>
              <Link to={url}>
                <div className="size-4 shrink-0 " />
                <Icon className="size-4 shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="truncate">{node.name}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{node.name}</p>
                  </TooltipContent>
                </Tooltip>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        )
      }

      return (
        <Collapsible key={node.id} asChild>
          <SidebarMenuSubItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton isActive={location.pathname === url} className="group">
                <ChevronRightIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                <Icon className="size-4 shrink-0" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={url} className="flex-1 truncate min-w-0">
                      {node.name}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{node.name}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mr-0 px-0">
                {renderNodes(node.id)}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuSubItem>
        </Collapsible>
      )
    })
  }

  const rootNodes = buildTree(null)

  return (
    <TooltipProvider delayDuration={1000}>
      <SidebarGroup className={cn("flex flex-col group-data-[collapsible=icon]:hidden", className)}>
        <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground shrink-0">
          {label}
        </SidebarGroupLabel>
        <SidebarGroupContent className="mt-1 flex-1 min-h-0">
          <ScrollArea className="h-full" constrainWidth>
            <SidebarMenu className="px-1.5 py-1">
              {rootNodes.map((node) => {
                const isFolder = node.nodeType === "FOLDER"
                const url = isFolder ? `${rootUrl}/f/${node.id}` : `${rootUrl}/${node.id}`
                const hasChildren = nodes.some((n) => n.parentId === node.id)
                const Icon = isFolder ? FolderIcon : FileIcon

                if (!isFolder || !hasChildren) {
                  return (
                    <SidebarMenuItem key={node.id}>
                      <SidebarMenuButton asChild isActive={location.pathname === url}>
                        <Link to={url}>
                          <div className="size-4 shrink-0" />
                          {/* Spacer */}
                          <Icon className="shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate">{node.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{node.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <Collapsible key={node.id} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton isActive={location.pathname === url} className="group">
                          <ChevronRightIcon
                            className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                          <Icon className="shrink-0" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={url} className="flex-1 truncate min-w-0">
                                {node.name}
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{node.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub className="mr-0 px-0">
                          {renderNodes(node.id)}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroupContent>
      </SidebarGroup>
    </TooltipProvider>
  )
}
