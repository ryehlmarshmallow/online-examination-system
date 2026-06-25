import {
  type MouseEvent,
  type SubmitEvent,
  useCallback,
  useState
} from "react"
import {
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query"
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/shared/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { hierarchyApi } from "../api/hierarchy-api"
import { saveExamAs } from "@/features/exams/api/exam-api"
import {
  saveTemplateAs,
  savePoolAs
} from "@/features/questionsets/api/questionset-api"
import type { DomainType } from "../types/hierarchy"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import { Spinner } from "@/shared/components/ui/spinner"
import { cn } from "@/shared/lib/utils"

interface SaveAsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceId: string
  sourceType: "EXAM" | "TEMPLATE" | "POOL"
  sourceName: string
  onSuccess?: (newId: string, targetDomain: DomainType) => void
}

export function SaveAsDialog({
                               open,
                               onOpenChange,
                               sourceId,
                               sourceType,
                               sourceName,
                               onSuccess,
                             }: SaveAsDialogProps) {
  const queryClient = useQueryClient()
  const [targetDomain, setTargetDomain] = useState<DomainType>(
    sourceType === "POOL" ? "TEMPLATE" : "POOL"
  )
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [saveName, setSaveName] = useState(() => {
    const initialDomain = sourceType === "POOL" ? "TEMPLATE" : "POOL"
    const suffix = sourceType === "EXAM" && initialDomain === "TEMPLATE" ? " Template" : " Copy"
    return `${sourceName}${suffix}`
  })
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})

  // Fetch folders for selected target domain
  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
    queryKey: ["folders-tree", targetDomain],
    queryFn: () => hierarchyApi.getFolderTree(targetDomain),
    enabled: open,
  })

  // Build recursive path label
  const getFolderPath = useCallback(
    (folderId: string | null): string => {
      if (!folderId) return "/"
      const pathParts: string[] = []
      let currentId: string | null = folderId

      while (currentId) {
        const folder = folders.find((f) => f.id === currentId)
        if (folder) {
          pathParts.unshift(folder.name)
          currentId = folder.parentId
        } else {
          break
        }
      }
      return "/ " + pathParts.join(" / ") + " /"
    },
    [folders]
  )

  // Expand / collapse toggle
  const toggleExpand = (folderId: string, e: MouseEvent) => {
    e.stopPropagation()
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  // Mutation to handle save API execution
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        targetDomain,
        parentId: selectedParentId,
        name: saveName.trim(),
      }

      if (sourceType === "EXAM") {
        return saveExamAs(sourceId, payload)
      } else if (sourceType === "TEMPLATE") {
        return saveTemplateAs(sourceId, payload)
      } else {
        return savePoolAs(sourceId, payload)
      }
    },
    onSuccess: async (data) => {
      toast.success(`Successfully saved as "${saveName.trim()}"`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hierarchy-tree", targetDomain] }),
        queryClient.invalidateQueries({ queryKey: ["folders-tree", targetDomain] }),
      ])
      onOpenChange(false)
      onSuccess?.(data.id, targetDomain)
    },
    onError: (error) => {
      toast.error(`Failed to save resource: ${getErrorMessage(error)}`)
    },
  })

  // Form submit handler
  const handleSave = (e: SubmitEvent) => {
    e.preventDefault()
    if (!saveName.trim()) {
      toast.error("Please enter a name")
      return
    }
    saveMutation.mutate()
  }

  // Render folder hierarchy tree recursively
  const renderFolderNode = (parentId: string | null, depth = 0) => {
    const children = folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    if (children.length === 0) return null

    return (
      <div className={cn("flex flex-col", depth > 0 && "pl-4")}>
        {children.map((folder) => {
          const hasChildren = folders.some((f) => f.parentId === folder.id)
          const isExpanded = expandedFolders[folder.id]
          const isSelected = selectedParentId === folder.id

          return (
            <div key={folder.id} className="flex flex-col">
              <div
                onClick={() => setSelectedParentId(folder.id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer group select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {hasChildren ? (
                  <div
                    onClick={(e) => toggleExpand(folder.id, e)}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer"
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="size-3.5" />
                    ) : (
                      <ChevronRightIcon className="size-3.5" />
                    )}
                  </div>
                ) : (
                  <div className="p-0.5 shrink-0 select-none">
                    <div className="size-3.5" />
                  </div>
                )}
                {isSelected ? (
                  <FolderOpenIcon className="size-4 shrink-0" />
                ) : (
                  <FolderIcon className="size-4 shrink-0" />
                )}
                <span className="truncate flex-1">{folder.name}</span>
                {isSelected && <CheckIcon className="size-4 ml-auto shrink-0" />}
              </div>
              {hasChildren && isExpanded && (
                <div className="border-l border-border/60 ml-3.5 my-0.5">
                  {renderFolderNode(folder.id, depth + 1)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const getDialogTitle = () => {
    if (sourceType === "POOL") return "Save as Template..."
    if (sourceType === "TEMPLATE") return "Save as Pool..."
    return "Save As..."
  }

  const getDialogDescription = () => {
    if (sourceType === "POOL") return "Choose a name and folder location for this template."
    if (sourceType === "TEMPLATE") return "Choose a name and folder location for this pool."
    return "Choose a name, save type, and folder location for this item."
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="hidden" />
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-5 py-2 overflow-hidden flex-1">
          {/* Target Type Selector (EXAM only) */}
          {sourceType === "EXAM" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Save Type
              </Label>
              <Tabs
                value={targetDomain}
                onValueChange={(val: string) => {
                  const nextDomain = val as DomainType
                  setTargetDomain(nextDomain)
                  const suffix = sourceType === "EXAM" && nextDomain === "TEMPLATE" ? " Template" : " Copy"
                  setSaveName(`${sourceName}${suffix}`)
                  setSelectedParentId(null)
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="TEMPLATE">Save as Template</TabsTrigger>
                  <TabsTrigger value="POOL">Save as Pool</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Directory path label */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selected Location
            </Label>
            <Input
              aria-label="Selected Location"
              id="selected-location"
              readOnly
              value={getFolderPath(selectedParentId)}
              className="bg-muted text-xs font-medium text-muted-foreground select-all h-8"
            />
          </div>

          {/* Directory hierarchy browser */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Folder
            </Label>
            <div className="border rounded-md p-2 flex-1 min-h-45 bg-background overflow-hidden flex flex-col">
              {isLoadingFolders ? (
                <div className="flex-1 flex items-center justify-center">
                  <Spinner className="size-6 text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-1.5">
                    {/* Root Option */}
                    <div
                      onClick={() => setSelectedParentId(null)}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer select-none",
                        selectedParentId === null
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <FolderOpenIcon className="size-4 shrink-0" />
                      <span className="font-semibold">Root Directory</span>
                      {selectedParentId === null && <CheckIcon className="size-4 ml-auto shrink-0" />}
                    </div>
                    {/* Folder Nodes */}
                    <div className="border-t pt-1.5">
                      {folders.filter((f) => f.parentId === null).length === 0 ? (
                        <div className="text-xs text-muted-foreground p-2 italic">
                          No folders available in Root. Items will be saved to the Root folder.
                        </div>
                      ) : (
                        renderFolderNode(null)
                      )}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-2">
            <Label
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              New Name
            </Label>
            <Input
              id="resource-name"
              aria-label="New Name"
              type="text"
              required
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Midterm Blueprint"
            />
          </div>

          <DialogFooter className="bg-transparent border-t-0 px-0 pb-0 pt-4 m-0 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
