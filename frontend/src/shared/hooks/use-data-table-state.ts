import {
  useEffect,
  useState
} from "react"
import {
  type VisibilityState,
  type ColumnFiltersState,
  type SortingState,
  type PaginationState,
  type OnChangeFn,
} from "@tanstack/react-table"
import { usePersistentPagination } from "./use-persistent-pagination"

export interface UseDataTableStateProps<TData> {
  initialData: TData[]
  storageKeyPrefix?: string
  defaultPageSize?: number
  controlledPagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
}

export function useDataTableState<TData>({
                                           initialData,
                                           storageKeyPrefix,
                                           defaultPageSize = 10,
                                           controlledPagination,
                                           onPaginationChange,
                                         }: UseDataTableStateProps<TData>) {
  const [data, setData] = useState<TData[]>(initialData)
  const [prevInitialData, setPrevInitialData] = useState<TData[]>(initialData)

  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData)
    setData(initialData)
  }

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // Persistent column visibility
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined" || !storageKeyPrefix) return {}
    const saved = localStorage.getItem(`${storageKeyPrefix}-column-visibility`)
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    if (storageKeyPrefix) {
      localStorage.setItem(`${storageKeyPrefix}-column-visibility`, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility, storageKeyPrefix])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Pagination state (uncontrolled or controlled fallback)
  const [localPagination, setLocalPagination] = usePersistentPagination(
    storageKeyPrefix ?? "",
    defaultPageSize
  )

  const pagination = controlledPagination ?? localPagination
  const setPagination = onPaginationChange ?? setLocalPagination

  return {
    data,
    setData,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
  }
}
