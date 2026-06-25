import {
  useLocation,
  matchPath,
  generatePath,
  type Params
} from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { listMyClassrooms } from "@/features/classrooms/api/classroom-api"
import { getExamDetail } from "@/features/exams/api/exam-api"
import {
  type BreadcrumbContext,
  breadcrumbRoutes
} from "@/shared/config/breadcrumb-config"

export type BreadcrumbItem = {
  label: string
  href?: string
  isCurrentPage?: boolean
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()

  // Fetch data needed for dynamic labels
  const { data: classrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
    staleTime: 1000 * 60 * 5,
  })

  const examMatch = matchPath(
    { path: "/classrooms/:classroomId/exams/:examId/*" },
    pathname
  )
  const examId = examMatch?.params.examId

  const { data: exam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => getExamDetail(examId!),
    enabled: !!examId,
    staleTime: 1000 * 60 * 5,
  })

  const contextData: BreadcrumbContext = { classrooms, exam }

  // Iterate through registry and find all matching segments
  const matchedItems: (BreadcrumbItem & { pathLength: number })[] = []

  breadcrumbRoutes.forEach((route) => {
    const match = matchPath({ path: route.path, end: route.exact ?? false }, pathname)

    if (match) {
      // Skip classroom detail matching if the matched classroomId param is actually a route word like "invite" or "join"
      if (match.params.classroomId === "invite" || match.params.classroomId === "join") {
        return
      }

      const label =
        typeof route.label === "function"
          ? route.label(match.params as Params<string>, contextData)
          : route.label

      const href = generatePath(route.path, match.params)
      const isCurrentPage = pathname === href

      matchedItems.push({
        label,
        href: isCurrentPage || label === "Loading..." ? undefined : href,
        isCurrentPage,
        pathLength: route.path.length,
      })
    }
  })

  if (matchedItems.length === 0) {
    return [{ label: "Online Examination System", isCurrentPage: true }]
  }

  // Sort by path length to ensure hierarchy (e.g., /classrooms before /classrooms/1)
  return matchedItems
    .sort((a, b) => a.pathLength - b.pathLength)
    .map((item) => ({
      label: item.label,
      href: item.href,
      isCurrentPage: item.isCurrentPage,
    }))
}
