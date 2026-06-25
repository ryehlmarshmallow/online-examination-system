export type NodeType = "FOLDER" | "ITEM"

export type DomainType = "POOL" | "TEMPLATE"

export type NodeResponse = {
  id: string
  name: string
  nodeType: NodeType
  parentId: string | null
  path: string
  orderIndex: number
  createdAt: string
  modifiedAt: string
}

export type CreateFolderPayload = {
  name: string
  parentId: string | null
  previousSiblingId?: string | null
}

export type RenameNodePayload = {
  name: string
}

export type MoveNodesPayload = {
  nodeIds: string[]
  destinationParentId: string | null
}

export type BulkCopyNodesPayload = {
  nodeIds: string[]
  destinationParentId: string | null
}
