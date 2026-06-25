import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { useClassroomDetail } from "../hooks/use-classroom-detail"
import { ExamTable } from "@/features/exams/components/exam-table"
import { Badge } from "@/shared/components/ui/badge"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { CLASSROOM_ROLE_LABELS } from "../lib/constants"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

export function ClassroomDetailPage() {
  const {
    classroom,
    exams,
    groups,
    isLoading,
    canManageExams,
    handleMoveExam
  } = useClassroomDetail()

  useDocumentTitle(classroom ? classroom.name : "Classroom")

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading classroom details...</div>
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Classroom not found.</div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={1000}>
      <div className="flex flex-1 flex-col min-h-0">
        <div className="@container/main flex flex-1 flex-col min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{classroom.name}</h1>
                <Badge
                  variant={
                    classroom.role === "OWNER"
                      ? "default"
                      : classroom.role === "STAFF"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {CLASSROOM_ROLE_LABELS[classroom.role] ?? classroom.role}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {classroom.description ?? "No description available."}
              </p>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 lg:px-6 pb-6">
              <ExamTable
                classroomId={classroom.id}
                data={exams}
                groups={groups}
                canManageExams={canManageExams}
                onMove={handleMoveExam}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  )
}
