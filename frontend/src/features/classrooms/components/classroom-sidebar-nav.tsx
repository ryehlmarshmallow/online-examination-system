import { useParams } from "react-router-dom"
import { UsersIcon, MailIcon, LineChartIcon, ClipboardListIcon } from "lucide-react"
import { useClassroomDetail } from "@/features/classrooms/hooks/use-classroom-detail"
import { NavClassroom } from "@/shared/components/nav-classroom"

export function ClassroomSidebarNav() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const { classroom, canManageStudents } = useClassroomDetail()

  if (!classroomId || !classroom) return null

  const items = [
    {
      title: "Exams",
      url: `/classrooms/${classroomId}`,
      icon: <ClipboardListIcon />,
    },
    ...(canManageStudents || classroom.role === "OWNER" ? [
      {
        title: "Members",
        url: `/classrooms/${classroomId}/members`,
        icon: <UsersIcon />,
      },
      {
        title: "Invitations",
        url: `/classrooms/${classroomId}/invitations`,
        icon: <MailIcon />,
      },
    ] : []),
    ...(classroom.role === "OWNER" || classroom.role === "STAFF" ? [
      {
        title: "Stats",
        url: `/classrooms/${classroomId}/stats`,
        icon: <LineChartIcon />,
      },
    ] : []),
  ]

  return <NavClassroom classroomName={classroom.name} items={items} />
}
