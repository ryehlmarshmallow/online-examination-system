import {
  useState,
  useEffect
} from "react"
import { type PaginationState } from "@tanstack/react-table"

export function usePersistentPagination(storageKey: string, defaultPageSize = 10) {
  const [pagination, setPaginationState] = useState<PaginationState>(() => {
    const defaultVal = { pageIndex: 0, pageSize: defaultPageSize }
    if (typeof window === "undefined" || !storageKey) return defaultVal
    try {
      const saved = localStorage.getItem(`${storageKey}-page-size`)
      return saved ? { ...defaultVal, pageSize: Number(saved) } : defaultVal
    } catch (error) {
      console.warn(`Error reading localStorage key "${storageKey}-page-size":`, error)
      return defaultVal
    }
  })

  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(`${storageKey}-page-size`, pagination.pageSize.toString())
      } catch (error) {
        console.warn(`Error writing localStorage key "${storageKey}-page-size":`, error)
      }
    }
  }, [pagination.pageSize, storageKey])

  return [pagination, setPaginationState] as const
}
