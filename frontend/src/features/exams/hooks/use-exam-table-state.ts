import {
  useEffect,
  useMemo,
  useState
} from "react"
import type {
  Exam,
  ExamGroup
} from "../types/exam"
import { useDataTableState } from "@/shared/hooks/use-data-table-state"

interface UseExamTableStateProps {
  classroomId?: string
  initialData: Exam[]
  groups: ExamGroup[]
}

export function useExamTableState({ classroomId, initialData, groups }: UseExamTableStateProps) {
  const {
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
  } = useDataTableState<Exam>({
    initialData,
    storageKeyPrefix: "oes-exam-table",
    defaultPageSize: 10,
  })

  // Group Exclusions Persistence
  const [excludedGroupIds, setExcludedGroupIds] = useState<string[]>(() => {
    if (typeof window === "undefined" || !classroomId) return []
    const saved = localStorage.getItem(`oes-exam-table-group-exclusions-${classroomId}`)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    if (classroomId) {
      localStorage.setItem(`oes-exam-table-group-exclusions-${classroomId}`, JSON.stringify(excludedGroupIds))
    }
  }, [excludedGroupIds, classroomId])

  // Derive Group Filter to Column Filters
  const effectiveColumnFilters = useMemo(() => {
    const allIds = [...groups.map((g) => g.id), "other"]
    const includedIds = allIds.filter((id) => !excludedGroupIds.includes(id))
    const otherFilters = columnFilters.filter((f) => f.id !== "groupId")
    if (includedIds.length === allIds.length) {
      return otherFilters
    }
    return [...otherFilters, { id: "groupId", value: includedIds }]
  }, [columnFilters, excludedGroupIds, groups])

  const toggleAllGroups = () => {
    const isAllSelected = excludedGroupIds.length === 0
    if (isAllSelected) {
      setExcludedGroupIds([...groups.map((g) => g.id), "other"])
    } else {
      setExcludedGroupIds([])
    }
  }

  const toggleGroup = (id: string) => {
    setExcludedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  return {
    data,
    setData,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnFilters: effectiveColumnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    pagination,
    setPagination,
    excludedGroupIds,
    toggleAllGroups,
    toggleGroup,
  }
}

