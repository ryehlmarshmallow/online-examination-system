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

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function ExamAllSubmissionsPage() {
  const { exam, allAttempts, classroomId, examId } = useExamDetail()

  useDocumentTitle(exam ? `${exam.title} - Submissions` : "All Submissions")

  const columns = useMemo<ColumnDef<ExamAttempt>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Student",
        cell: ({ row }) => (
          <div className="font-medium">
            {row.original.studentName ?? "Unknown Student"}
          </div>
        ),
      },
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
          <div className="tabular-nums text-xs">
            {format(new Date(row.original.startedAt), "PPp")}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "IN_PROGRESS" ? "secondary" : "default"}
          >
            {ATTEMPT_STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
    ],
    [classroomId, examId]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: allAttempts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          noResultsMessage="No submissions found."
        />
      </div>
    </div>
  )
}
