import { useState } from "react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Spinner } from "@/shared/components/ui/spinner"
import {
  EditIcon,
  SaveAll
} from "lucide-react"
import { EXAM_STATUS_LABELS } from "../lib/constants"
import { useExamDetail } from "../hooks/use-exam-detail"
import { Outlet } from "react-router-dom"
import { SaveAsDialog } from "@/features/hierarchy/components/save-as-dialog"

export function ExamLayout() {
  const { exam, isLoading, canManageExams, classroomId, examId, navigate } = useExamDetail()
  const [saveAsOpen, setSaveAsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-muted-foreground" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Exam not found.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="@container/main flex flex-1 flex-col min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
              <Badge variant="outline">
                {EXAM_STATUS_LABELS[exam.status] ?? exam.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Exam details and attempts</p>
          </div>
          {canManageExams && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSaveAsOpen(true)}
              >
                <SaveAll className="mr-2 h-4 w-4" /> Save As...
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/classrooms/${classroomId}/exams/${examId}/edit`)
                }
              >
                <EditIcon className="mr-2 h-4 w-4" /> Edit Exam
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 lg:px-6 pb-6">
            <Outlet />
          </div>
        </ScrollArea>
      </div>
      {saveAsOpen && exam && (
        <SaveAsDialog
          open={saveAsOpen}
          onOpenChange={setSaveAsOpen}
          sourceId={exam.id}
          sourceType="EXAM"
          sourceName={exam.title}
        />
      )}
    </div>
  )
}
