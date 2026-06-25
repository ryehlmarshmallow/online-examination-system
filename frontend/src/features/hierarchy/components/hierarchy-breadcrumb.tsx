import { Fragment } from "react"
import { Link } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import type {
  NodeResponse,
  DomainType
} from "../types/hierarchy"

interface HierarchyBreadcrumbProps {
  domain: DomainType
  breadcrumb: NodeResponse[]
}

export function HierarchyBreadcrumb({
                                      domain,
                                      breadcrumb,
                                    }: HierarchyBreadcrumbProps) {
  const rootLabel = domain === "POOL" ? "Pools" : "Templates"
  const rootUrl = domain === "POOL" ? "/pools" : "/templates"
  const isAtRoot = breadcrumb.length === 0

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              {isAtRoot ? (
                <BreadcrumbPage className="max-w-[20ch] truncate">{rootLabel}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="max-w-[20ch] truncate">
                  <Link to={rootUrl}>
                    {rootLabel}
                  </Link>
                </BreadcrumbLink>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{rootLabel}</p>
            </TooltipContent>
          </Tooltip>
        </BreadcrumbItem>
        {breadcrumb.length > 0 && <BreadcrumbSeparator />}
        {breadcrumb.map((node, index) => {
          const isLast = index === breadcrumb.length - 1
          const url = `${rootUrl}/f/${node.id}`

          return (
            <Fragment key={node.id}>
              <BreadcrumbItem className="min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLast ? (
                      <BreadcrumbPage className="max-w-[20ch] truncate">{node.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild className="max-w-[20ch] truncate">
                        <Link to={url}>{node.name}</Link>
                      </BreadcrumbLink>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{node.name}</p>
                  </TooltipContent>
                </Tooltip>
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
