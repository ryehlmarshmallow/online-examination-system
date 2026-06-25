import { apiClient } from "@/shared/lib/apiClient"
import type {
  NodeResponse,
  DomainType,
  CreateFolderPayload,
  RenameNodePayload,
  MoveNodesPayload,
  BulkCopyNodesPayload
} from "../types/hierarchy"

type PageResponse<T> = {
  content: T[]
  page: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

const getBasePath = (domain: DomainType) => {
  return domain === "POOL" ? "/api/pools/folders" : "/api/templates/folders"
}

export const hierarchyApi = {
  getContent: async (domain: DomainType, parentId: string | null, page = 0, size = 1000, sort?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    })
    if (parentId) {
      params.append("parentId", parentId)
    }
    if (sort) {
      params.append("sort", sort)
    }
    const response = await apiClient.get<PageResponse<NodeResponse>>(`${getBasePath(domain)}/content?${params.toString()}`)
    return response.data
  },

  applySortToOrderIndex: async (domain: DomainType, parentId: string | null, sort: string) => {
    const params = new URLSearchParams({ sort })
    if (parentId) {
      params.append("parentId", parentId)
    }
    await apiClient.post(`${getBasePath(domain)}/reindex?${params.toString()}`)
  },

  getBreadcrumb: async (domain: DomainType, nodeId: string | null) => {
    if (!nodeId) return []
    const response = await apiClient.get<NodeResponse[]>(`${getBasePath(domain)}/${nodeId}/breadcrumb`)
    return response.data
  },

  getFolderTree: async (domain: DomainType) => {
    const response = await apiClient.get<NodeResponse[]>(`${getBasePath(domain)}/tree`)
    return response.data
  },

  getFullTree: async (domain: DomainType) => {
    const root = domain === "POOL" ? "/api/pools" : "/api/templates"
    const response = await apiClient.get<NodeResponse[]>(`${root}/tree`)
    return response.data
  },

  reorderNode: async (domain: DomainType, nodeId: string, previousSiblingId: string | null) => {
    const params = new URLSearchParams()
    if (previousSiblingId) {
      params.append("previousSiblingId", previousSiblingId)
    }
    const response = await apiClient.post<NodeResponse>(`${getBasePath(domain)}/${nodeId}/move?${params.toString()}`)
    return response.data
  },

  createFolder: async (domain: DomainType, payload: CreateFolderPayload) => {
    const response = await apiClient.post<NodeResponse>(getBasePath(domain), payload)
    return response.data
  },

  renameNode: async (domain: DomainType, nodeId: string, payload: RenameNodePayload) => {
    const response = await apiClient.put<NodeResponse>(`${getBasePath(domain)}/${nodeId}/rename`, payload)
    return response.data
  },

  deleteNodes: async (domain: DomainType, nodeIds: string[]) => {
    await apiClient.delete(`${getBasePath(domain)}/deletions`, { data: { nodeIds } })
  },

  moveNodes: async (domain: DomainType, payload: MoveNodesPayload) => {
    await apiClient.post(`${getBasePath(domain)}/moves`, payload)
  },

  copyNodes: async (domain: DomainType, payload: BulkCopyNodesPayload) => {
    const response = await apiClient.post<{ nodeIds: string[] }>(`${getBasePath(domain)}/copies`, payload)
    return response.data
  },

  createItem: async (domain: DomainType, payload: { name: string; parentId: string | null }) => {
    const root = domain === "POOL" ? "/api/pools" : "/api/templates"
    const response = await apiClient.post<{ id: string }>(root, payload)
    return response.data
  }
}
