import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { useClassroomDetail } from "../hooks/use-classroom-detail"

export function ClassroomStatsPage() {
  const { classroom } = useClassroomDetail()
  useDocumentTitle(classroom ? `${classroom.name} - Statistics` : "Classroom Statistics")
  return (
    <div className="flex flex-1 flex-col p-4 lg:p-6">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Classroom Statistics</h1>
      <div className="flex flex-1 items-center justify-center border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Classroom analytics and statistics coming soon.</p>
      </div>
    </div>
  )
}
