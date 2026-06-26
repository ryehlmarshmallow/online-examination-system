import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TableType,
} from "@tanstack/react-table"
import {
  FilterIcon,
  CheckIcon,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import type {
  Exam,
  ExamGroup,
  StudentAnswerVisibilityMode,
  StudentGradeVisibilityMode
} from "../types/exam"
import { useExamTableState } from "../hooks/use-exam-table-state"
import { VISIBILITY_OPTIONS } from "../lib/constants"
import {
  DataTable,
  DataTablePagination,
  DataTableColumnToggle,
} from "@/shared/components/data-table"
import {
  getDragColumn,
  getDateColumn,
} from "@/shared/components/data-table-utils"
import { handleTableReorder } from "@/shared/lib/table-utils"

const COLUMN_LABELS: Record<string, string> = {
  title: "Name",
  groupId: "Group",
  startTime: "Start Time",
  endTime: "End Time",
  studentGradeVisibilityMode: "Grade Visibility",
  studentAnswerVisibilityMode: "Answer Visibility",
}

const getColumnClass = (columnId: string) =>
  cn(
    columnId === "drag" && "w-9 min-w-9 pr-0",
    columnId === "title" && "w-full max-w-0 min-w-64 overflow-hidden",
    columnId === "groupId" && "w-full max-w-0 min-w-64 overflow-hidden",
    (columnId === "startTime" || columnId === "endTime") && "w-44 min-w-44",
    (columnId === "studentGradeVisibilityMode" || columnId === "studentAnswerVisibilityMode") && "w-48 min-w-48"
  )

interface ExamTableProps {
  classroomId?: string
  data: Exam[]
  groups: ExamGroup[]
  canManageExams: boolean
  onMove: (examId: string, previousSiblingId: string | null) => void
}

function TableActions({
                        table,
                        groups,
                        excludedGroupIds,
                        onToggleAll,
                        onToggleGroup
                      }: {
  table: TableType<Exam>
  groups: ExamGroup[]
  excludedGroupIds: string[]
  onToggleAll: () => void
  onToggleGroup: (id: string) => void
}) {
  const isAllSelected = excludedGroupIds.length === 0

  return (
    <div className="flex items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FilterIcon className="mr-2 h-4 w-4" />
            Group Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onToggleAll()
            }}
          >
            Select All
            {isAllSelected && <CheckIcon className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {groups.map((group) => (
            <DropdownMenuItem
              key={group.id}
              onSelect={(e) => {
                e.preventDefault()
                onToggleGroup(group.id)
              }}
            >
              <span className="truncate">{group.name}</span>
              {!excludedGroupIds.includes(group.id) && (
                <CheckIcon className="ml-auto h-4 w-4 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              onToggleGroup("other")
            }}
          >
            Other
            {!excludedGroupIds.includes("other") && (
              <CheckIcon className="ml-auto h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DataTableColumnToggle table={table} columnLabels={COLUMN_LABELS} />
    </div>
  )
}

export function ExamTable({
                            classroomId,
                            data: initialData,
                            groups,
                            canManageExams,
                            onMove
                          }: ExamTableProps) {
  const {
    data,
    setData,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    excludedGroupIds,
    toggleAllGroups,
    toggleGroup,
  } = useExamTableState({ classroomId, initialData, groups })

  const columns = useMemo<ColumnDef<Exam>[]>(() => {
    const cols: ColumnDef<Exam>[] = []

    if (canManageExams) {
      cols.push(getDragColumn<Exam>())
    }

    cols.push(
      {
        accessorKey: "title",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate font-medium">
                  <Link
                    to={`/classrooms/${classroomId}/exams/${row.original.id}`}
                    className="hover:underline"
                  >
                    {row.getValue("title")}
                  </Link>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{row.getValue("title")}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "groupId",
        header: "Group",
        cell: ({ row }) => {
          const groupId = row.getValue("groupId")
          const group = groups.find((g) => g.id === groupId)
          const name = group ? group.name : ""
          return (
            <div className="flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate">
                    {name}
                  </div>
                </TooltipTrigger>
                {name && (
                  <TooltipContent>
                    <p>{name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          )
        },
        filterFn: (row, id, value) => {
          if (value === undefined) return true
          const groupId = row.getValue(id)
          const effectiveGroupId = groupId === null ? "other" : groupId
          return value.includes(effectiveGroupId)
        },
      },
      getDateColumn<Exam>("startTime", "Start Time"),
      getDateColumn<Exam>("endTime", "End Time", "No end time"),
      {
        accessorKey: "studentGradeVisibilityMode",
        header: "Grade Visibility",
        cell: ({ row }) => {
          const value = row.getValue("studentGradeVisibilityMode") as StudentGradeVisibilityMode
          return (
            <div>
              {VISIBILITY_OPTIONS.find((o) => o.value === value)?.label || value}
            </div>
          )
        },
      },
      {
        accessorKey: "studentAnswerVisibilityMode",
        header: "Answer Visibility",
        cell: ({ row }) => {
          const value = row.getValue("studentAnswerVisibilityMode") as StudentAnswerVisibilityMode
          return (
            <div>
              {VISIBILITY_OPTIONS.find((o) => o.value === value)?.label || value}
            </div>
          )
        },
      },
    )

    return cols
  }, [groups, canManageExams, classroomId])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  function handleReorder(activeId: string, overId: string) {
    handleTableReorder({
      activeId,
      overId,
      table,
      data,
      onReorder: onMove,
      setData,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <TableActions
        table={table}
        groups={groups}
        excludedGroupIds={excludedGroupIds}
        onToggleAll={toggleAllGroups}
        onToggleGroup={toggleGroup}
      />
      <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          getColumnClass={getColumnClass}
          enableReorder={canManageExams}
          onReorder={handleReorder}
          noResultsMessage="No exams found."
        />
      </div>
      <DataTablePagination table={table} hideSelectionText />
    </div>
  )
}

