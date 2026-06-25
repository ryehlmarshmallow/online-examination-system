import {
  useMemo,
  useState
} from "react"
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import {
  createClassroomGroup,
  deleteClassroomGroup,
  listClassroomGroups,
  listMyClassrooms,
  renameClassroomGroup,
  moveClassroomGroup,
  moveClassroom,
} from "@/features/classrooms/api/classroom-api"
import type {
  ClassroomGroup,
  MyClassroom
} from "@/features/classrooms/types/classroom"
import { toast } from "sonner"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import { useDisclosure } from "@/shared/hooks/use-disclosure"

export function useClassrooms() {
  const queryClient = useQueryClient()
  const [selectedGroup, setSelectedGroup] = useState<ClassroomGroup | null>(null)
  const [groupName, setGroupName] = useState("")

  const createDialog = useDisclosure()
  const renameDialog = useDisclosure()
  const deleteDialog = useDisclosure()

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["classroom-groups"],
    queryFn: listClassroomGroups,
  })

  const { data: classrooms, isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
  })

  const createMutation = useMutation({
    mutationFn: createClassroomGroup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-groups"] })
      createDialog.onClose()
      setGroupName("")
      toast.success("Group created successfully")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameClassroomGroup(id, { name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-groups"] })
      renameDialog.onClose()
      setGroupName("")
      toast.success("Group renamed successfully")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClassroomGroup,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["classroom-groups"] }),
        queryClient.invalidateQueries({ queryKey: ["my-classrooms"] }),
      ])
      deleteDialog.onClose()
      toast.success("Group deleted successfully")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const moveGroupMutation = useMutation({
    mutationFn: ({ id, previousSiblingId }: { id: string; previousSiblingId: string | null }) =>
      moveClassroomGroup(id, { previousSiblingId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-groups"] })
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-groups"] })
      toast.error(getErrorMessage(error))
    },
  })

  const moveClassroomMutation = useMutation({
    mutationFn: ({
                   id,
                   groupId,
                   previousSiblingId,
                 }: {
      id: string
      groupId: string | null
      previousSiblingId: string | null
    }) => moveClassroom(id, { groupId, previousSiblingId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-classrooms"] })
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ["my-classrooms"] })
      toast.error(getErrorMessage(error))
    },
  })

  const classroomsByGroup = useMemo(() => {
    return (classrooms ?? []).reduce(
      (acc: Record<string, MyClassroom[]>, classroom: MyClassroom) => {
        const groupId = classroom.groupId ?? "other"
        if (!acc[groupId]) {
          acc[groupId] = []
        }
        acc[groupId].push(classroom)
        return acc
      },
      {} as Record<string, MyClassroom[]>,
    )
  }, [classrooms])

  const updateGroupOrder = async (newOrder: string[], movedId: string) => {
    const idx = newOrder.indexOf(movedId)
    if (idx === -1) return

    const prevId = idx === 0 ? null : newOrder[idx - 1]

    await moveGroupMutation.mutateAsync({ id: movedId, previousSiblingId: prevId })
  }

  const updateClassroomOrder = async (groupId: string, newOrder: string[], movedId: string) => {
    const idx = newOrder.indexOf(movedId)
    if (idx === -1) return

    const prevId = idx === 0 ? null : newOrder[idx - 1]

    await moveClassroomMutation.mutateAsync({
      id: movedId,
      groupId: groupId === "other" ? null : groupId,
      previousSiblingId: prevId,
    })
  }

  const moveClassroomToGroup = async (
    classroomId: string,
    _sourceGroupId: string,
    targetGroupId: string,
    newOrder: string[],
  ) => {
    const idx = newOrder.indexOf(classroomId)
    const prevId = idx <= 0 ? null : newOrder[idx - 1]

    await moveClassroomMutation.mutateAsync({
      id: classroomId,
      groupId: targetGroupId === "other" ? null : targetGroupId,
      previousSiblingId: prevId,
    })
  }

  return {
    groups: groups ?? [],
    classroomsByGroup,
    isLoading: isLoadingGroups || isLoadingClassrooms,
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
  }
}
