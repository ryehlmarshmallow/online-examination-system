import type {
  OnChangeFn,
  PaginationState
} from "@tanstack/react-table"
import type { NodeResponse } from "../types/hierarchy"
import { useDataTableState } from "@/shared/hooks/use-data-table-state"

interface UseResourceTableStateProps {
  initialNodes: NodeResponse[]
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
}

export function useResourceTableState({
                                        initialNodes,
                                        pagination: controlledPagination,
                                        onPaginationChange,
                                      }: UseResourceTableStateProps) {
  const {
    data: nodes,
    setData: setNodes,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pagination,
  } = useDataTableState<NodeResponse>({
    initialData: initialNodes,
    storageKeyPrefix: "oes-resource-table",
    controlledPagination,
    onPaginationChange,
  })

  return {
    nodes,
    setNodes,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pagination,
  }
}

