import {
  type ReactNode,
  useMemo,
  useState,
  useRef
} from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  EllipsisVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  GripVerticalIcon,
} from "lucide-react"
import { Link } from "react-router-dom"
import type {
  ClassroomGroup,
  MyClassroom
} from "@/features/classrooms/types/classroom"
import { useClassrooms } from "../hooks/use-classrooms"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { cn } from "@/shared/lib/utils"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip"

import {
  DndContext,
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  DragOverlay,
  type CollisionDetection,
} from "@dnd-kit/core"
import {
  restrictToVerticalAxis,
  restrictToWindowEdges
} from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

const COLLAPSED_GROUPS_KEY = "oes-classroom-collapsed-groups"

export function ClassroomListPage() {
  useDocumentTitle("Classrooms")
  const queryClient = useQueryClient()
  const wasDraggingRef = useRef(false)
  const {
    groups,
    classroomsByGroup,
    isLoading,
    selectedGroup,
    setSelectedGroup,
    groupName,
    setGroupName,
    createDialog,
    renameDialog,
    deleteDialog,
    createMutation,
    renameMutation,
    deleteMutation,
    updateGroupOrder,
    updateClassroomOrder,
    moveClassroomToGroup,
  } = useClassrooms()

  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_GROUPS_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [isReorderingGroups, setIsReorderingGroups] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<"group" | "card" | null>(null)
  const [initialGroupId, setInitialGroupId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  )

  const allGroupIds = useMemo(() => ["other", ...groups.map((g) => g.id)], [groups])

  const openGroups = useMemo(
    () => allGroupIds.filter((id) => !collapsedGroups.includes(id)),
    [allGroupIds, collapsedGroups],
  )

  const customCollisionDetection: CollisionDetection = (args) => {
    if (isReorderingGroups) {
      return closestCenter(args)
    }

    // Start by finding any intersecting droppable using pointer coordinates
    const pointerCollisions = pointerWithin(args)

    // Fallback to rectIntersection if no pointer collisions
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args)

    // Find the first colliding droppable ID
    const overId = collisions[0]?.id

    if (overId != null) {
      const overIdStr = String(overId)
      const isGroup = overIdStr === "other" || groups.some((g) => g.id === overIdStr)

      if (isGroup) {
        const classrooms = classroomsByGroup[overIdStr] ?? []

        if (classrooms.length > 0) {
          const classroomIds = classrooms.map((c) => c.id)
          const filteredContainers = args.droppableContainers.filter(
            (container) => classroomIds.includes(String(container.id))
          )

          const itemCollisions = closestCorners({
            ...args,
            droppableContainers: filteredContainers,
          })

          if (itemCollisions.length > 0) {
            return itemCollisions
          }
        }
      }

      return collisions
    }

    return closestCorners(args)
  }

  const handleAccordionChange = (newOpenGroups: string[]) => {
    if (isReorderingGroups) return
    const newCollapsed = allGroupIds.filter((id) => !newOpenGroups.includes(id))
    setCollapsedGroups(newCollapsed)
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(newCollapsed))
  }

  const handleDragStart = (event: DragStartEvent) => {
    wasDraggingRef.current = true
    const { active } = event
    setActiveId(active.id as string)
    const type = isReorderingGroups ? "group" : "card"
    setActiveType(type)

    if (type === "card") {
      const activeIdStr = active.id as string
      for (const [gId, list] of Object.entries(classroomsByGroup)) {
        if (list.some((c) => c.id === activeIdStr)) {
          setInitialGroupId(gId)
          break
        }
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    if (activeIdStr === overIdStr) return

    if (isReorderingGroups) {
      // Persistence handled in handleDragEnd
      return
    }

    // Find active card and its current group
    let activeGroupId: string | undefined

    for (const [gId, list] of Object.entries(classroomsByGroup)) {
      if (list.some((c) => c.id === activeIdStr)) {
        activeGroupId = gId
        break
      }
    }

    if (!activeGroupId) return

    // Find over item's group
    let overGroupId: string | undefined

    for (const [gId, list] of Object.entries(classroomsByGroup)) {
      if (list.some((c) => c.id === overIdStr)) {
        overGroupId = gId
        break
      }
    }

    // If over item is a group container (e.g., dragging to an empty or open group container)
    if (!overGroupId) {
      if (overIdStr === "other" || groups.some((g) => g.id === overIdStr)) {
        if (openGroups.includes(overIdStr)) {
          overGroupId = overIdStr
        }
      }
    }

    if (!overGroupId || activeGroupId === overGroupId) return

    // Cross-group move: optimistically update React Query cache — change groupId AND reposition
    queryClient.setQueryData(["my-classrooms"], (old: MyClassroom[] | undefined) => {
      if (!old) return old

      const activeItem = old.find((c) => c.id === activeIdStr)
      if (!activeItem) return old

      const updatedActive = {
        ...activeItem,
        groupId: overGroupId === "other" ? null : overGroupId!,
      }

      // Remove the active item from the flat array
      const withoutActive = old.filter((c) => c.id !== activeIdStr)

      // Find the position of the 'over' item and insert before it
      const flatOverIndex = withoutActive.findIndex((c) => c.id === overIdStr)
      if (flatOverIndex !== -1) {
        withoutActive.splice(flatOverIndex, 0, updatedActive)
      } else {
        // Dragging onto an empty group container — append
        withoutActive.push(updatedActive)
      }

      return withoutActive
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    const activeIdStr = active.id as string
    const overIdStr = over?.id as string
    const currentInitialGroupId = initialGroupId

    setTimeout(() => {
      wasDraggingRef.current = false
    }, 50)

    setActiveId(null)
    setActiveType(null)
    setInitialGroupId(null)

    if (!over) return

    if (isReorderingGroups) {
      if (activeIdStr === overIdStr) return

      const oldIndex = groups.findIndex((g) => g.id === activeIdStr)
      const newIndex = groups.findIndex((g) => g.id === overIdStr)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(groups, oldIndex, newIndex)

        // Optimistically update React Query cache
        queryClient.setQueryData(["classroom-groups"], reordered)

        await updateGroupOrder(reordered.map((g) => g.id), activeIdStr)
      }
    } else {
      if (!currentInitialGroupId) return

      // Determine the target group of the drop
      let targetGroupId: string | undefined
      if (overIdStr === "other" || groups.some((g) => g.id === overIdStr)) {
        targetGroupId = overIdStr
      } else {
        // Find the group of the classroom card we dropped over
        for (const [gId, list] of Object.entries(classroomsByGroup)) {
          if (list.some((c) => c.id === overIdStr)) {
            targetGroupId = gId
            break
          }
        }
      }

      if (!targetGroupId) return

      // For both cross-group and same-group moves, compute the final order
      // using arrayMove based on where the item is now vs where `over` is.
      const list = classroomsByGroup[targetGroupId] ?? []
      const oldIndex = list.findIndex((c) => c.id === activeIdStr)
      const newIndex = overIdStr === targetGroupId
        ? list.length - 1  // Dropped on the group container itself — go to end
        : list.findIndex((c) => c.id === overIdStr)

      if (oldIndex === -1 || newIndex === -1) return
      if (oldIndex === newIndex && currentInitialGroupId === targetGroupId) return

      const reordered = oldIndex !== newIndex
        ? arrayMove(list, oldIndex, newIndex)
        : list

      const newOrder = reordered.map((c) => c.id)

      if (currentInitialGroupId !== targetGroupId) {
        await moveClassroomToGroup(activeIdStr, currentInitialGroupId, targetGroupId, newOrder)
      } else {
        // Optimistically update React Query cache for same-group reordering
        queryClient.setQueryData(["my-classrooms"], (old: MyClassroom[] | undefined) => {
          if (!old) return old

          // Extract classrooms belonging to this group
          const groupClassrooms = old.filter(
            (c) => (c.groupId ?? "other") === currentInitialGroupId
          )

          const oldIndexInGroup = groupClassrooms.findIndex((c) => c.id === activeIdStr)
          const newIndexInGroup = overIdStr === targetGroupId
            ? groupClassrooms.length - 1
            : groupClassrooms.findIndex((c) => c.id === overIdStr)

          if (oldIndexInGroup === -1 || newIndexInGroup === -1) return old

          const reorderedGroup = arrayMove(groupClassrooms, oldIndexInGroup, newIndexInGroup)

          // Reconstruct the flat my-classrooms array maintaining the relative order of other groups,
          // but updating the order of classrooms in this group
          let reorderedIndex = 0
          return old.map((c) => {
            if ((c.groupId ?? "other") === currentInitialGroupId) {
              return reorderedGroup[reorderedIndex++]
            }
            return c
          })
        })

        await updateClassroomOrder(currentInitialGroupId, newOrder, activeIdStr)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-muted-foreground">Loading classrooms...</div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={1000}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        modifiers={isReorderingGroups ? [restrictToVerticalAxis, restrictToWindowEdges] : undefined}
      >
        <div
          className="flex flex-1 flex-col min-h-0"
          onClickCapture={(e) => {
            if (wasDraggingRef.current) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <div className="@container/main flex flex-1 flex-col min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">Classrooms</h1>
                <p className="text-muted-foreground">
                  Manage your classrooms and classroom groups.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isReorderingGroups ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsReorderingGroups(!isReorderingGroups)
                  }}
                >
                  <GripVerticalIcon className="mr-1.5 h-4 w-4" />
                  {isReorderingGroups ? "Done Reordering" : "Reorder Groups"}
                </Button>
                <Dialog open={createDialog.isOpen} onOpenChange={createDialog.setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => {
                        setGroupName("")
                      }}
                    >
                      <PlusIcon />
                      <span className="hidden sm:inline">New Group</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Group</DialogTitle>
                      <DialogDescription>
                        Enter a name for the new classroom group.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          id="create-name"
                          aria-label="Group name"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="e.g. Morning Classes"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && groupName) {
                              createMutation.mutate({ name: groupName })
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={createDialog.onClose}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => createMutation.mutate({ name: groupName })}
                        disabled={!groupName || createMutation.isPending}
                      >
                        {createMutation.isPending ? "Creating..." : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 lg:px-6 pb-6">
                <Accordion
                  type="multiple"
                  value={isReorderingGroups ? [] : openGroups}
                  onValueChange={handleAccordionChange}
                >
                  <SortableContext
                    items={groups.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                    disabled={!isReorderingGroups}
                  >
                    {groups.map((group) => (
                      <SortableAccordionItem
                        key={group.id}
                        group={group}
                        isReordering={isReorderingGroups}
                        classrooms={classroomsByGroup[group.id] ?? []}
                        renameDialog={renameDialog}
                        deleteDialog={deleteDialog}
                        setSelectedGroup={setSelectedGroup}
                        setGroupName={setGroupName}
                      >
                        <DroppableClassroomGrid
                          groupId={group.id}
                          classrooms={classroomsByGroup[group.id] ?? []}
                          isOpen={openGroups.includes(group.id)}
                        />
                      </SortableAccordionItem>
                    ))}
                  </SortableContext>

                  <AccordionItem value="other" className="border-none">
                    <div className="relative">
                      <AccordionTrigger
                        className={cn(
                          "text-lg hover:no-underline relative **:data-[slot=accordion-trigger-icon]:absolute **:data-[slot=accordion-trigger-icon]:right-11 **:data-[slot=accordion-trigger-icon]:top-1/2 **:data-[slot=accordion-trigger-icon]:-translate-y-1/2 **:data-[slot=accordion-trigger-icon]:ml-0",
                          isReorderingGroups && "pointer-events-none select-none opacity-50 pr-16",
                        )}
                      >
                        <div className="flex items-center gap-2 pr-16">
                          Other
                          <Badge variant="secondary">
                            {classroomsByGroup["other"]?.length ?? 0}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      <DroppableClassroomGrid
                        groupId="other"
                        classrooms={classroomsByGroup["other"] ?? []}
                        isOpen={openGroups.includes("other")}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </div>

          <Dialog open={renameDialog.isOpen} onOpenChange={renameDialog.setIsOpen}>
            <DialogTrigger className="hidden" />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Group</DialogTitle>
                <DialogDescription>Enter a new name for the group.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    id="rename-name"
                    aria-label="Group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && groupName && selectedGroup) {
                        renameMutation.mutate({ id: selectedGroup.id, name: groupName })
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={renameDialog.onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    renameMutation.mutate({ id: selectedGroup!.id, name: groupName })
                  }
                  disabled={!groupName || renameMutation.isPending}
                >
                  {renameMutation.isPending ? "Renaming..." : "Rename"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteDialog.isOpen} onOpenChange={deleteDialog.setIsOpen}>
            <DialogTrigger className="hidden" />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Group</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete "{selectedGroup?.name}"? Any classrooms in this
                  group will be moved to "Other".
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={deleteDialog.onClose}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedGroup!.id)}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <DragOverlay adjustScale={false}>
          {activeId && activeType === "card" && (
            <div className="w-75 pointer-events-none">
              {(() => {
                const activeCard = Object.values(classroomsByGroup)
                  .flat()
                  .find((c) => c.id === activeId)
                return activeCard ? <SortableClassroomCard classroom={activeCard} isOverlay /> : null
              })()}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  )
}

function SortableAccordionItem({
                                 group,
                                 isReordering,
                                 classrooms,
                                 renameDialog,
                                 deleteDialog,
                                 setSelectedGroup,
                                 setGroupName,
                                 children,
                               }: {
  group: ClassroomGroup
  isReordering: boolean
  classrooms: MyClassroom[]
  renameDialog: { onOpen: () => void }
  deleteDialog: { onOpen: () => void }
  setSelectedGroup: (g: ClassroomGroup) => void
  setGroupName: (n: string) => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
    disabled: !isReordering,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <AccordionItem
      ref={setNodeRef}
      style={style}
      value={group.id}
      className={cn(
        "border-none relative rounded-lg transition-colors",
        isDragging && "opacity-80 bg-muted/40 z-10",
      )}
    >
      <div className="relative">
        {isReordering && (
          <div
            {...attributes}
            {...listeners}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing p-1.5 hover:bg-accent hover:text-accent-foreground rounded text-muted-foreground"
          >
            <GripVerticalIcon className="size-4" />
          </div>
        )}
        <AccordionTrigger
          className={cn(
            "text-lg hover:no-underline relative **:data-[slot=accordion-trigger-icon]:absolute **:data-[slot=accordion-trigger-icon]:right-11 **:data-[slot=accordion-trigger-icon]:top-1/2 **:data-[slot=accordion-trigger-icon]:-translate-y-1/2 **:data-[slot=accordion-trigger-icon]:ml-0",
            isReordering ? "pl-11 pointer-events-none select-none pr-16" : "pl-0",
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden pr-16">
            <span className="truncate">{group.name}</span>
            <Badge variant="secondary" className="shrink-0">
              {classrooms.length}
            </Badge>
          </div>
        </AccordionTrigger>

        {!isReordering && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground data-[state=open]:bg-muted"
                >
                  <EllipsisVerticalIcon />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedGroup(group)
                    setGroupName(group.name)
                    renameDialog.onOpen()
                  }}
                >
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => {
                    setSelectedGroup(group)
                    deleteDialog.onOpen()
                  }}
                >
                  <TrashIcon />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  )
}

function DroppableClassroomGrid({
                                  groupId,
                                  classrooms,
                                  isOpen,
                                }: {
  groupId: string
  classrooms: MyClassroom[]
  isOpen: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
    disabled: !isOpen,
  })

  if (classrooms.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "py-10 text-center text-sm text-muted-foreground rounded-lg border-2 border-dashed border-muted/50 transition-all select-none",
          isOver && "border-primary/50 bg-primary/5 text-primary",
        )}
      >
        No classrooms in this group. Drag a classroom card here to add it.
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "grid grid-cols-1 gap-4 px-1 py-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card rounded-lg transition-all",
        isOver && "bg-primary/2 ring-2 ring-primary/20",
      )}
    >
      <SortableContext items={classrooms.map((c) => c.id)} strategy={rectSortingStrategy}>
        {classrooms.map((classroom) => (
          <SortableClassroomCard key={classroom.id} classroom={classroom} />
        ))}
      </SortableContext>
    </div>
  )
}

function SortableClassroomCard({
                                 classroom,
                                 isOverlay = false,
                               }: {
  classroom: MyClassroom
  isOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: classroom.id,
  })

  const style = isOverlay ? undefined : {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-30 rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 dark:bg-primary/10 dark:border-primary/15 opacity-60 transition-all shadow-inner"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group cursor-grab active:cursor-grabbing select-none",
        isOverlay && "cursor-grabbing",
      )}
    >
      <Link
        to={`/classrooms/${classroom.id}`}
        className="block pointer-events-auto cursor-grab active:cursor-grabbing text-inherit"
        style={{ textDecoration: 'none' }}
      >
        <Card
          className={cn(
            "@container/card hover:ring-primary/50 transition-all",
            isOverlay && "ring-2 ring-primary bg-linear-to-t from-primary/5 to-card shadow-lg opacity-95",
          )}
        >
          <CardHeader>
            <CardDescription className="line-clamp-1 select-none">
              {classroom.description ?? "No description"}
            </CardDescription>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="text-xl font-semibold @[250px]/card:text-xl truncate select-none">
                  {classroom.name}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{classroom.name}</p>
              </TooltipContent>
            </Tooltip>
            <CardAction>
              <Badge
                variant={
                  classroom.role === "OWNER"
                    ? "default"
                    : classroom.role === "STAFF"
                      ? "secondary"
                      : "outline"
                }
              >
                {classroom.role}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter
            className="flex-row items-center justify-between gap-1.5 text-xs text-muted-foreground select-none">
            <div>Joined {new Date(classroom.joinedAt).toLocaleDateString()}</div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
}
