import { useParams } from "react-router-dom"
import { InfoIcon, HistoryIcon, ClipboardListIcon } from "lucide-react"
import { useExamDetail } from "@/features/exams/hooks/use-exam-detail"
import { NavExam } from "@/shared/components/nav-exam"

export function ExamSidebarNav() {
  const { classroomId, examId } = useParams<{ classroomId: string; examId: string }>()
  const { exam, canManageGrades } = useExamDetail()

  if (!examId || !exam) return null

  const items = [
    {
      title: "Summary",
      url: `/classrooms/${classroomId}/exams/${examId}`,
      icon: <InfoIcon />,
    },
    {
      title: "My Attempts",
      url: `/classrooms/${classroomId}/exams/${examId}/attempts`,
      icon: <HistoryIcon />,
    },
    ...(canManageGrades ? [
      {
        title: "All Submissions",
        url: `/classrooms/${classroomId}/exams/${examId}/submissions`,
        icon: <ClipboardListIcon />,
      },
    ] : []),
  ]

  return <NavExam examTitle={exam.title} items={items} />
}
