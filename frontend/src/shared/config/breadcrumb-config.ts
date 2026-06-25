import type { MyClassroom } from "@/features/classrooms/types/classroom"
import type { Exam } from "@/features/exams/types/exam"

export interface BreadcrumbContext {
  classrooms?: MyClassroom[]
  exam?: Exam
}

export type BreadcrumbLabelFn = (
  params: Record<string, string | undefined>,
  data: BreadcrumbContext,
) => string

export interface BreadcrumbRoute {
  path: string
  label: string | BreadcrumbLabelFn
  /**
   * If true, this path will only match if it's the exact current path.
   * Useful for distinguishing between /classrooms and /classrooms/:id
   */
  exact?: boolean
}

export const breadcrumbRoutes: BreadcrumbRoute[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    exact: true,
  },
  {
    path: "/classrooms",
    label: "Classroom",
  },
  {
    path: "/classrooms/invite/:inviteId",
    label: "Invite",
    exact: true,
  },
  {
    path: "/classrooms/join/:token",
    label: "Join",
    exact: true,
  },
  {
    path: "/classrooms/:classroomId",
    label: (params, data) => {
      const classroom = data.classrooms?.find((c) => c.id === params.classroomId)
      return classroom?.name || "Loading..."
    },
  },
  {
    path: "/classrooms/:classroomId/members",
    label: "Members",
    exact: true,
  },
  {
    path: "/classrooms/:classroomId/stats",
    label: "Stats",
    exact: true,
  },
  {
    path: "/classrooms/:classroomId/exams/:examId",
    label: (_params, data) => {
      return data.exam?.title || "Loading..."
    },
  },
  {
    path: "/classrooms/:classroomId/exams/:examId/attempts",
    label: "My Attempts",
    exact: true,
  },
  {
    path: "/classrooms/:classroomId/exams/:examId/submissions",
    label: "All Submissions",
    exact: true,
  },
  {
    path: "/templates",
    label: "Template",
    exact: true,
  },
  {
    path: "/pools",
    label: "Pool",
    exact: true,
  },
  {
    path: "/notifications",
    label: "Notifications",
    exact: true,
  },
]
