import { useMemo } from "react"
import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  BellIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  UserPlusIcon,
  Trash2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import type { NotificationItem } from "../api/notifications-api"
import { DataTable } from "@/shared/components/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

interface NotificationTableProps {
  data: NotificationItem[]
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onNotificationClick: (notification: NotificationItem) => void
  onDeleteClick: (notification: NotificationItem) => void
}

const getColumnClass = (columnId: string) =>
  cn(
    columnId === "notification" && "w-full p-0 border-b border-border"
  )

export function NotificationTable({
                                    data,
                                    page,
                                    pageSize,
                                    totalPages,
                                    onPageChange,
                                    onPageSizeChange,
                                    onNotificationClick,
                                    onDeleteClick,
                                  }: NotificationTableProps) {

  // Helpers for icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "EXAM_PUBLISHED":
        return (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
            <ClipboardListIcon className="h-5 w-5" />
          </div>
        )
      case "EXAM_GRADED":
        return (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <GraduationCapIcon className="h-5 w-5" />
          </div>
        )
      case "CLASSROOM_INVITATION":
        return (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <UserPlusIcon className="h-5 w-5" />
          </div>
        )
      default:
        return (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <BellIcon className="h-5 w-5" />
          </div>
        )
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  }

  const columns = useMemo<ColumnDef<NotificationItem>[]>(() => [
    {
      id: "notification",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div
            onClick={() => onNotificationClick(item)}
            className={`group flex items-center gap-4 p-4 cursor-pointer relative transition-colors ${
              !item.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
            }`}
          >
            {/* Unread indicator strip */}
            {!item.isRead && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
            )}

            {getNotificationIcon(item.type)}

            <div className="flex-1 min-w-0 space-y-1">
              <h4
                className={`text-sm font-medium ${!item.isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.message}
              </p>
            </div>

            <div className="flex items-center justify-end shrink-0 w-24 h-8">
              <span className="text-xs text-muted-foreground group-hover:hidden shrink-0">
                {formatTimeAgo(item.createdAt)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete notification"
                className="hidden group-hover:flex h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteClick(item)
                }}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      },
    }
  ], [onNotificationClick, onDeleteClick])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: page,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const nextState = updater({ pageIndex: page, pageSize })
        if (nextState.pageIndex !== page) {
          onPageChange(nextState.pageIndex)
        }
        if (nextState.pageSize !== pageSize) {
          onPageSizeChange(nextState.pageSize)
        }
      } else {
        if (updater.pageIndex !== page) {
          onPageChange(updater.pageIndex)
        }
        if (updater.pageSize !== pageSize) {
          onPageSizeChange(updater.pageSize)
        }
      }
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex flex-col gap-4">
      <div
        className="overflow-hidden rounded-lg border [&_thead]:hidden **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          getColumnClass={getColumnClass}
          noResultsMessage="No notifications found."
        />
      </div>

      {/* Custom Pagination Toolbar without the selection counts */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1" />
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger size="sm" className="w-fit min-w-16">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="min-w-fit">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-25 items-center justify-center text-sm font-medium">
            Page {page + 1} of {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(0)}
              disabled={page === 0}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages - 1 || totalPages === 0}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page === totalPages - 1 || totalPages === 0}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
