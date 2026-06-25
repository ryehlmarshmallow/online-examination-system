import { useHierarchy } from "../hooks/use-hierarchy"
import { ResourceTable } from "./resource-table"
import { HierarchyBreadcrumb } from "./hierarchy-breadcrumb"
import type {
  DomainType,
  NodeResponse
} from "../types/hierarchy"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import {
  PlusIcon,
  FolderPlusIcon,
  AlertCircleIcon,
  CopyIcon,
  ScissorsIcon,
  ClipboardPasteIcon,
  XIcon,
  Trash2Icon,
  SaveIcon
} from "lucide-react"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/shared/lib/utils"
import { CreateNodeDialog } from "./create-node-dialog"
import { RenameNodeDialog } from "./rename-node-dialog"
import { SaveAsDialog } from "./save-as-dialog"
import { DeployExamDialog } from "./deploy-exam-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import {
  useEffect,
  useState
} from "react"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import { TooltipProvider } from "@/shared/components/ui/tooltip"
import { useClipboardStore } from "../store/clipboard-store"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/shared/components/ui/select"

interface ResourceExplorerProps {
  domain: DomainType
  parentId: string | null
  itemLabel?: string
}

export function ResourceExplorer({ domain, parentId, itemLabel }: ResourceExplorerProps) {
  const navigate = useNavigate()
  const {
    nodes,
    breadcrumb,
    isLoading,
    error,
    isPlaceholderData,
    createFolder,
    isCreatingFolder,
    createItem,
    isCreatingItem,
    renameNode,
    isRenaming,
    deleteNodes,
    isDeleting,
    reorderNode,
    pagination,
    setPagination,
    pagination: { totalElements },
    copyNodes,
    moveNodes,
    sortValue,
    setSortValue,
    applySort,
    isApplyingSort,
  } = useHierarchy(domain, parentId)

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [prevParentIdState, setPrevParentIdState] = useState(parentId)

  if (parentId !== prevParentIdState) {
    setPrevParentIdState(parentId)
    setRowSelection({})
  }

  const [isPasting, setIsPasting] = useState(false)
  const [nodeToRename, setNodeToRename] = useState<NodeResponse | null>(null)
  const [nodesToDelete, setNodesToDelete] = useState<NodeResponse[] | null>(null)
  const [saveAsNode, setSaveAsNode] = useState<NodeResponse | null>(null)
  const [deployNode, setDeployNode] = useState<NodeResponse | null>(null)
  const clipboard = useClipboardStore()

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
  const selectedNodes = nodes.filter((node) => selectedIds.includes(node.id))
  const hasSelection = selectedIds.length > 0

  const handleCopy = (node: NodeResponse) => {
    clipboard.copy(domain, [{ id: node.id, name: node.name, nodeType: node.nodeType }])
    toast.success(`Copied "${node.name}" to clipboard`)
    setRowSelection({})
  }

  const handleCut = (node: NodeResponse) => {
    clipboard.cut(domain, [{ id: node.id, name: node.name, nodeType: node.nodeType }])
    toast.success(`Cut "${node.name}" to clipboard`)
    setRowSelection({})
  }

  const handleBulkCopy = () => {
    const itemsToCopy = selectedNodes.map(node => ({
      id: node.id,
      name: node.name,
      nodeType: node.nodeType
    }))
    clipboard.copy(domain, itemsToCopy)
    toast.success(`Copied ${itemsToCopy.length} items to clipboard`)
    setRowSelection({})
  }

  const handleBulkCut = () => {
    const itemsToCut = selectedNodes.map(node => ({
      id: node.id,
      name: node.name,
      nodeType: node.nodeType
    }))
    clipboard.cut(domain, itemsToCut)
    toast.success(`Cut ${itemsToCut.length} items to clipboard`)
    setRowSelection({})
  }

  const handleBulkDelete = () => {
    setNodesToDelete(selectedNodes)
  }

  const handlePaste = async () => {
    if (clipboard.items.length === 0) return
    const currentFolderNode = breadcrumb[breadcrumb.length - 1]
    const destinationName = currentFolderNode?.name || "Root"

    setIsPasting(true)
    try {
      const nodeIds = clipboard.items.map(item => item.id)
      if (clipboard.action === "CUT") {
        await moveNodes({
          nodeIds,
          destinationParentId: parentId,
        })
        toast.success(`Successfully moved ${nodeIds.length} ${nodeIds.length === 1 ? 'item' : 'items'} to "${destinationName}"`)
        clipboard.clear()
      } else {
        await copyNodes({
          nodeIds,
          destinationParentId: parentId,
        })
        toast.success(`Successfully copied ${nodeIds.length} ${nodeIds.length === 1 ? 'item' : 'items'} to "${destinationName}"`)
      }
    } catch (err) {
      toast.error(`Failed to paste items: ${getErrorMessage(err)}`)
    } finally {
      setIsPasting(false)
    }
  }

  // Redirect if we are trying to explore an ITEM (e.g. /pools/f/:poolId)
  useEffect(() => {
    if (breadcrumb.length > 0) {
      const currentNode = breadcrumb[breadcrumb.length - 1]
      // Only redirect if the current leaf of the breadcrumb is what we are looking at
      // and it's an ITEM (not a FOLDER)
      if (currentNode.id === parentId && currentNode.nodeType === 'ITEM') {
        const rootUrl = domain === "POOL" ? "/pools" : "/templates"
        navigate(`${rootUrl}/${currentNode.id}`, { replace: true })
      }
    }
  }, [breadcrumb, parentId, domain, navigate])

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-6">
        <AlertCircleIcon className="h-12 w-12 text-destructive" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Failed to load folder</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {getErrorMessage(error)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate(domain === "POOL" ? "/pools" : "/templates")}>
            Go to Root
          </Button>
        </div>
      </div>
    );
  }

  const handleFolderClick = (node: NodeResponse) => {
    const rootUrl = domain === "POOL" ? "/pools" : "/templates"
    navigate(`${rootUrl}/f/${node.id}`)
  }

  const handleItemClick = (node: NodeResponse) => {
    const rootUrl = domain === "POOL" ? "/pools" : "/templates"
    navigate(`${rootUrl}/${node.id}`)
  }

  const handleRename = (node: NodeResponse) => {
    setNodeToRename(node)
  }

  const handleDelete = (node: NodeResponse) => {
    setNodesToDelete([node])
  }

  return (
    <TooltipProvider delayDuration={1000}>
      <div className="flex flex-1 flex-col min-h-0">
        <div className="@container/main flex flex-1 flex-col min-h-0">
          <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <HierarchyBreadcrumb
              domain={domain}
              breadcrumb={breadcrumb}
            />
            <div className="flex items-center gap-2">
              <Select value={sortValue} onValueChange={setSortValue}>
                <SelectTrigger size="sm" className="w-42.5 text-xs font-medium">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="custom">Custom Order</SelectItem>
                  <SelectItem value="name_asc">Name (A to Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z to A)</SelectItem>
                  <SelectItem value="created_desc">Newest Created</SelectItem>
                  <SelectItem value="created_asc">Oldest Created</SelectItem>
                  <SelectItem value="modified_desc">Recently Modified</SelectItem>
                  <SelectItem value="modified_asc">Least Recently Modified</SelectItem>
                </SelectContent>
              </Select>
              {sortValue !== "custom" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isApplyingSort}
                  onClick={async () => {
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
                          return ""
                      }
                    }
                    const param = getSortParam(sortValue)
                    if (!param) return
                    try {
                      await applySort({ sort: param })
                      toast.success("Sort order saved to Custom Order")
                      setSortValue("custom")
                    } catch (err) {
                      toast.error(`Failed to save sort order: ${getErrorMessage(err)}`)
                    }
                  }}
                >
                  <SaveIcon className="size-4 mr-2" />
                  Save as Custom
                </Button>
              )}
              <CreateNodeDialog
                title="Create Folder"
                description="Enter a name for the new folder."
                placeholder="e.g. Semester 1"
                onSubmit={(name) => createFolder({ name, parentId })}
                isLoading={isCreatingFolder}
                trigger={
                  <Button variant="outline" size="sm" disabled={isLoading}>
                    <FolderPlusIcon className="size-4 mr-2" />
                    New Folder
                  </Button>
                }
              />
              {itemLabel && (
                <CreateNodeDialog
                  title={`Create ${itemLabel}`}
                  description={`Enter a name for the new ${itemLabel.toLowerCase()}.`}
                  placeholder={`e.g. ${itemLabel === "POOL" ? "Exam Pool" : "Quiz Template"}`}
                  onSubmit={(name) => createItem({ name, parentId })}
                  isLoading={isCreatingItem}
                  trigger={
                    <Button size="sm" disabled={isLoading}>
                      <PlusIcon className="size-4 mr-2" />
                      New {itemLabel}
                    </Button>
                  }
                />
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 lg:px-6 pb-6 relative">
              {isLoading ? (
                <ResourceTableSkeleton />
              ) : (
                <>
                  {isPlaceholderData && (
                    <div
                      className="absolute inset-x-4 lg:inset-x-6 top-0 bottom-6 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md transition-opacity">
                      <Spinner className="size-8 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn("transition-opacity duration-200", isPlaceholderData && "pointer-events-none opacity-50")}>
                    <ResourceTable
                      nodes={nodes}
                      pagination={pagination}
                      onPaginationChange={setPagination}
                      totalElements={totalElements}
                      isReorderEnabled={sortValue === "custom"}
                      onFolderClick={handleFolderClick}
                      onItemClick={handleItemClick}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onMove={() => {
                        // TODO: implement move dialog
                      }}
                      onReorder={(nodeId, previousSiblingId) => {
                        reorderNode({ nodeId, previousSiblingId })
                      }}
                      rowSelection={rowSelection}
                      onRowSelectionChange={setRowSelection}
                      onCopy={handleCopy}
                      onCut={handleCut}
                      onSaveAs={(node) => setSaveAsNode(node)}
                      onDeploy={(node) => setDeployNode(node)}
                    />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
          {/* Floating Selection Command Bar */}
          {hasSelection && (
            <div
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-popover text-popover-foreground border border-border/80 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
              <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                {selectedIds.length} selected
              </span>
              <div className="h-4 w-px bg-border mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkCopy}
                className="rounded-full gap-1.5 h-8 text-xs font-medium px-3.5"
              >
                <CopyIcon className="size-3.5 text-muted-foreground" />
                Copy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkCut}
                className="rounded-full gap-1.5 h-8 text-xs font-medium px-3.5"
              >
                <ScissorsIcon className="size-3.5 text-muted-foreground" />
                Cut
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="rounded-full gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10 px-3.5"
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRowSelection({})}
                className="rounded-full h-8 w-8 text-muted-foreground hover:bg-muted"
                aria-label="Clear selection"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}

          {/* Floating Clipboard/Paste Bar */}
          {!hasSelection && clipboard.items.length > 0 && clipboard.domain === domain && (
            <div
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-background border border-border/80 rounded-full shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-2">
                {clipboard.action === "CUT" ? (
                  <ScissorsIcon className="size-3.5 text-primary" />
                ) : (
                  <CopyIcon className="size-3.5 text-primary" />
                )}
                <span>{clipboard.items.length} {clipboard.items.length === 1 ? 'item' : 'items'} ready to paste</span>
              </div>
              <div className="h-4 w-px bg-border mx-1" />
              <Button
                variant="default"
                size="sm"
                onClick={handlePaste}
                disabled={isPasting}
                className="rounded-full gap-1.5 h-8 px-4 text-xs font-semibold shadow-sm"
              >
                {isPasting ? (
                  <Spinner className="size-3.5 text-primary-foreground animate-spin" />
                ) : (
                  <ClipboardPasteIcon className="size-3.5" />
                )}
                Paste Here
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clipboard.clear()}
                className="rounded-full h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            </div>
          )}
          <RenameNodeDialog
            node={nodeToRename}
            onClose={() => setNodeToRename(null)}
            onSubmit={(name) => {
              if (nodeToRename) {
                renameNode({ nodeId: nodeToRename.id, payload: { name } })
              }
            }}
            isLoading={isRenaming}
          />
          <Dialog open={!!nodesToDelete} onOpenChange={(open) => !open && setNodesToDelete(null)}>
            <DialogTrigger className="hidden" />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {nodesToDelete && nodesToDelete.length === 1 ? (nodesToDelete[0].nodeType === "FOLDER" ? "Folder" : "Item") : "Items"}</DialogTitle>
                <DialogDescription>
                  {nodesToDelete && nodesToDelete.length === 1
                    ? `Are you sure you want to delete "${nodesToDelete[0].name}"? This action cannot be undone.`
                    : `Are you sure you want to delete the ${nodesToDelete?.length || 0} selected items? This action cannot be undone.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNodesToDelete(null)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (nodesToDelete) {
                      const ids = nodesToDelete.map((n) => n.id)
                      deleteNodes(ids)
                      if (nodesToDelete.length > 1) {
                        setRowSelection({})
                      }
                      setNodesToDelete(null)
                    }
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {saveAsNode && (
            <SaveAsDialog
              open={!!saveAsNode}
              onOpenChange={(open) => !open && setSaveAsNode(null)}
              sourceId={saveAsNode.id}
              sourceType={domain}
              sourceName={saveAsNode.name}
            />
          )}

          {deployNode && (
            <DeployExamDialog
              open={!!deployNode}
              onOpenChange={(open) => !open && setDeployNode(null)}
              sourceId={deployNode.id}
              sourceType={domain}
              sourceName={deployNode.name}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

function ResourceTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <div className="h-10 bg-muted/50 border-b flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40 ml-auto" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 flex items-center px-4 gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className={cn("h-4", i % 2 === 0 ? "w-48" : "w-64")} />
              <Skeleton className="h-4 w-40 ml-auto" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>
    </div>
  )
}
