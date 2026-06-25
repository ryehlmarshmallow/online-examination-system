import { useState } from "react"
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData
} from "@tanstack/react-query"
import { hierarchyApi } from "../api/hierarchy-api"
import type {
  DomainType,
  CreateFolderPayload,
  RenameNodePayload,
  MoveNodesPayload,
  BulkCopyNodesPayload
} from "../types/hierarchy"
import { type PaginationState } from "@tanstack/react-table"
import { usePersistentPagination } from "@/shared/hooks/use-persistent-pagination"

export function useHierarchy(domain: DomainType, parentId: string | null) {
  const queryClient = useQueryClient()

  const [pagination, setPagination] = usePersistentPagination("oes-resource-table")

  const storageKey = `oes-resource-explorer-sort-${domain}`

  const [sortValue, setSortValueState] = useState<string>(() => {
    if (typeof window === "undefined") return "custom"
    try {
      const saved = localStorage.getItem(storageKey)
      return saved || "custom"
    } catch (error) {
      console.warn(`Error reading localStorage key "${storageKey}":`, error)
      return "custom"
    }
  })

  const [prevDomain, setPrevDomain] = useState(domain)
  if (domain !== prevDomain) {
    setPrevDomain(domain)
    let saved = "custom"
    try {
      if (typeof window !== "undefined") {
        saved = localStorage.getItem(storageKey) || "custom"
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${storageKey}":`, error)
    }
    setSortValueState(saved)
  }

  const setSortValue = (value: string | ((prev: string) => string)) => {
    setSortValueState((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value
      try {
        localStorage.setItem(storageKey, newValue)
      } catch (error) {
        console.warn(`Error writing localStorage key "${storageKey}":`, error)
      }
      return newValue
    })
  }

  const [prevParentId, setPrevParentId] = useState(parentId)
  const [prevSortValue, setPrevSortValue] = useState(sortValue)

  let pageIndex = pagination.pageIndex
  if (parentId !== prevParentId) {
    setPrevParentId(parentId)
    pageIndex = 0
    setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))
  }
  if (sortValue !== prevSortValue) {
    setPrevSortValue(sortValue)
    pageIndex = 0
    setPagination((prev: PaginationState) => ({ ...prev, pageIndex: 0 }))
  }

  const getSortParam = (val: string) => {
    switch (val) {
      case "name_asc":
        return "name,asc"
      case "name_desc":
        return "name,desc"
      case "created_asc":
        return "createdAt,asc"
      case "created_desc":
        return "createdAt,desc"
      case "modified_asc":
        return "modifiedAt,asc"
      case "modified_desc":
        return "modifiedAt,desc"
      default:
        return undefined
    }
  }

  const sortParam = getSortParam(sortValue)

  const queryKey = ["hierarchy", domain, parentId, pageIndex, pagination.pageSize, sortValue]

  const {
    data,
    isLoading: isContentLoading,
    error: contentError,
    isPlaceholderData,
    isFetching
  } = useQuery({
    queryKey,
    queryFn: () => hierarchyApi.getContent(domain, parentId, pageIndex, pagination.pageSize, sortParam),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const totalElements = data?.page.totalElements ?? 0

  const {
    data: breadcrumbNodes,
    isLoading: isBreadcrumbLoading,
    error: breadcrumbError
  } = useQuery({
    queryKey: ["breadcrumb", domain, parentId],
    queryFn: () => hierarchyApi.getBreadcrumb(domain, parentId),
    enabled: !!parentId,
    retry: false,
  })

  const createFolderMutation = useMutation({
    mutationFn: (payload: CreateFolderPayload) => hierarchyApi.createFolder(domain, payload),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
      ])
    },
  })

  const createItemMutation = useMutation({
    mutationFn: (payload: { name: string; parentId: string | null }) =>
      hierarchyApi.createItem(domain, payload),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
      ])
    },
  })

  const renameNodeMutation = useMutation({
    mutationFn: ({ nodeId, payload }: { nodeId: string; payload: RenameNodePayload }) =>
      hierarchyApi.renameNode(domain, nodeId, payload),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb", domain] }),
      ])
    },
  })

  const deleteNodesMutation = useMutation({
    mutationFn: (nodeIds: string[]) => hierarchyApi.deleteNodes(domain, nodeIds),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb", domain] }),
      ])
    },
  })

  const moveNodesMutation = useMutation({
    mutationFn: (payload: MoveNodesPayload) => hierarchyApi.moveNodes(domain, payload),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb", domain] }),
      ])
    },
  })

  const copyNodesMutation = useMutation({
    mutationFn: (payload: BulkCopyNodesPayload) => hierarchyApi.copyNodes(domain, payload),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb", domain] }),
      ])
    },
  })

  const reorderNodeMutation = useMutation({
    mutationFn: ({ nodeId, previousSiblingId }: { nodeId: string; previousSiblingId: string | null }) =>
      hierarchyApi.reorderNode(domain, nodeId, previousSiblingId),
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] }),
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", domain] }),
      ])
    },
  })

  const applySortMutation = useMutation({
    mutationFn: ({ sort }: { sort: string }) =>
      hierarchyApi.applySortToOrderIndex(domain, parentId, sort),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ["hierarchy", domain] })
    },
  })

  return {
    nodes: data?.content ?? [],
    breadcrumb: breadcrumbNodes ?? [],
    isLoading: isContentLoading || isBreadcrumbLoading,
    error: contentError || breadcrumbError,
    createFolder: createFolderMutation.mutate,
    isCreatingFolder: createFolderMutation.isPending,
    createItem: createItemMutation.mutate,
    isCreatingItem: createItemMutation.isPending,
    renameNode: renameNodeMutation.mutate,
    isRenaming: renameNodeMutation.isPending,
    deleteNodes: deleteNodesMutation.mutate,
    isDeleting: deleteNodesMutation.isPending,
    moveNodes: moveNodesMutation.mutateAsync,
    isMoving: moveNodesMutation.isPending,
    copyNodes: copyNodesMutation.mutateAsync,
    isCopying: copyNodesMutation.isPending,
    reorderNode: reorderNodeMutation.mutate,
    sortValue,
    setSortValue,
    applySort: applySortMutation.mutateAsync,
    isApplyingSort: applySortMutation.isPending,
    pagination: {
      ...pagination,
      totalElements,
      totalPages: data?.page.totalPages ?? 0,
    },
    setPagination,
    isPlaceholderData,
    isFetching,
  }
}
