import { useMemo } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { Badge } from "@/shared/components/ui/badge"
import { DataTable } from "@/shared/components/data-table"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import type { ExamAttempt } from "../types/exam"
import { ATTEMPT_STATUS_LABELS } from "../lib/constants"
import { useExamDetail } from "../hooks/use-exam-detail"
import {
  CircleCheckIcon,
  Loader2Icon
} from "lucide-react"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function ExamMyAttemptsPage() {
  const { exam, attempts, classroomId, examId } = useExamDetail()

  useDocumentTitle(exam ? `${exam.title} - My Attempts` : "My Attempts")

  const columns = useMemo<ColumnDef<ExamAttempt>[]>(
    () => [
      {
        accessorKey: "attemptNumber",
        header: "Attempt",
        cell: ({ row }) => (
          <div className="font-medium">
            <Link
              to={`/classrooms/${classroomId}/exams/${examId}/attempts/${row.original.attemptId}`}
              className="text-primary hover:underline"
            >
              Attempt {row.original.attemptNumber}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "startedAt",
        header: "Started At",
        cell: ({ row }) => (
          <div className="font-medium">
            {format(new Date(row.original.startedAt), "PPp")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          const label = ATTEMPT_STATUS_LABELS[status] ?? status

          if (status === "IN_PROGRESS") {
            return (
              <Badge variant="secondary" className="gap-1">
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                {label}
              </Badge>
            )
          }

          if (status === "SUBMITTED") {
            return (
              <Badge variant="outline" className="gap-1">
                <CircleCheckIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Badge>
            )
          }

          if (status === "GRADED") {
            return (
              <Badge variant="outline" className="gap-1">
                <CircleCheckIcon className="h-3.5 w-3.5 fill-green-500 text-background dark:fill-green-400" />
                {label}
              </Badge>
            )
          }

          return <Badge>{label}</Badge>
        },
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted At",
        cell: ({ row }) => (
          <div className="tabular-nums">
            {row.original.submittedAt
              ? format(new Date(row.original.submittedAt), "PPp")
              : "-"}
          </div>
        ),
      },
    ],
    [classroomId, examId]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: attempts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          noResultsMessage="No attempts found."
        />
      </div>
    </div>
  )
}
