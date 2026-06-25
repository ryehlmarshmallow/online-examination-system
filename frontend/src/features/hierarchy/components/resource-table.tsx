import { useMemo } from "react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type OnChangeFn,
} from "@tanstack/react-table"
import {
  FileIcon,
  FolderIcon,
  MoreVerticalIcon,
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
import type { NodeResponse } from "../types/hierarchy"
import { cn } from "@/shared/lib/utils"
import { useResourceTableState } from "../hooks/use-resource-table-state"
import { useClipboardStore } from "../store/clipboard-store"
import {
  DataTable,
  DataTablePagination,
} from "@/shared/components/data-table"
import {
  getSelectColumn,
  getDragColumn,
  getDateColumn,
} from "@/shared/components/data-table-utils"
import { handleTableReorder } from "@/shared/lib/table-utils"

interface ResourceTableProps {
  nodes: NodeResponse[]
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  totalElements: number
  onFolderClick: (node: NodeResponse) => void
  onItemClick: (node: NodeResponse) => void
  onRename: (node: NodeResponse) => void
  onDelete: (node: NodeResponse) => void
  onMove: (node: NodeResponse) => void
  onReorder: (nodeId: string, previousSiblingId: string | null) => void
  isReorderEnabled?: boolean
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: OnChangeFn<Record<string, boolean>>
  onCopy?: (node: NodeResponse) => void
  onCut?: (node: NodeResponse) => void
  onSaveAs?: (node: NodeResponse) => void
  onDeploy?: (node: NodeResponse) => void
}

const getColumnClass = (columnId: string) =>
  cn(
    columnId === "drag" && "w-9 min-w-9 pr-0",
    columnId === "select" && "w-8 min-w-8 pl-0 text-center",
    columnId === "name" && "w-full max-w-0 min-w-64 overflow-hidden",
    columnId === "createdAt" && "w-54 min-w-54",
    columnId === "modifiedAt" && "w-54 min-w-54",
    columnId === "actions" && "w-12 min-w-12 text-center"
  )

export function ResourceTable({
                                nodes: initialNodes,
                                pagination: controlledPagination,
                                onPaginationChange,
                                totalElements,
                                isReorderEnabled = true,
                                onFolderClick,
                                onItemClick,
                                onRename,
                                onDelete,
                                onMove,
                                onReorder,
                                rowSelection: controlledRowSelection,
                                onRowSelectionChange: controlledOnRowSelectionChange,
                                onCopy,
                                onCut,
                                onSaveAs,
                                onDeploy,
                              }: ResourceTableProps) {
  const clipboard = useClipboardStore()

  const {
    nodes,
    setNodes,
    rowSelection: localRowSelection,
    setRowSelection: localSetRowSelection,
    pagination,
  } = useResourceTableState({
    initialNodes,
    pagination: controlledPagination,
    onPaginationChange,
  })

  const rowSelection = controlledRowSelection ?? localRowSelection
  const setRowSelection = controlledOnRowSelectionChange ?? localSetRowSelection

  const columns = useMemo<ColumnDef<NodeResponse>[]>(
    () => [
      getDragColumn<NodeResponse>(isReorderEnabled),
      getSelectColumn<NodeResponse>(),
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const node = row.original
          const isFolder = node.nodeType === "FOLDER"
          const Icon = isFolder ? FolderIcon : FileIcon
          const isCut = clipboard.action === "CUT" && clipboard.items.some((i) => i.id === node.id)

          return (
            <div
              className={cn(
                "flex items-center gap-2 cursor-pointer hover:underline transition-opacity duration-200",
                isCut && "opacity-45 grayscale-20"
              )}
              onClick={() => (isFolder ? onFolderClick(node) : onItemClick(node))}
            >
              <Icon className="size-4 text-muted-foreground shrink-0" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium truncate">{node.name}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{node.name}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )
        },
      },
      getDateColumn<NodeResponse>("createdAt", "Created At"),
      getDateColumn<NodeResponse>("modifiedAt", "Modified At"),
      {
        id: "actions",
        cell: ({ row }) => {
          const node = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVerticalIcon className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onRename(node)}>
                  Rename
                </DropdownMenuItem>
                {node.nodeType === "ITEM" && onSaveAs && (
                  <DropdownMenuItem onClick={() => onSaveAs(node)}>
                    Save As...
                  </DropdownMenuItem>
                )}
                {node.nodeType === "ITEM" && onDeploy && (
                  <DropdownMenuItem onClick={() => onDeploy(node)}>
                    Deploy as Exam
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onCopy?.(node)}>
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCut?.(node)}>
                  Cut
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove(node)}>
                  Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => onDelete(node)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [onFolderClick, onItemClick, onRename, onDelete, onMove, onCopy, onCut, onSaveAs, onDeploy, clipboard.items, clipboard.action, isReorderEnabled]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: nodes,
    columns,
    state: {
      rowSelection,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    rowCount: totalElements,
  })

  function handleReorder(activeId: string, overId: string) {
    handleTableReorder({
      activeId,
      overId,
      table,
      data: nodes,
      onReorder,
      setData: setNodes,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border overflow-hidden">
        <DataTable
          table={table}
          columns={columns}
          getColumnClass={getColumnClass}
          enableReorder={isReorderEnabled}
          onReorder={handleReorder}
          noResultsMessage="No resources found."
        />
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

