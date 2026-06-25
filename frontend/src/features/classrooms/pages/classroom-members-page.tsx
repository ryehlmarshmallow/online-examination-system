import {
  useState,
  useMemo,
  useCallback
} from "react"
import { useParams } from "react-router-dom"
import {
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query"
import { toast } from "sonner"
import {
  CrownIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  Trash2Icon,
  MoreVerticalIcon
} from "lucide-react"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { usePersistentPagination } from "@/shared/hooks/use-persistent-pagination"
import { useClassroomDetail } from "../hooks/use-classroom-detail"
import { useAuthStore } from "@/features/auth/store/auth-store"
import { CLASSROOM_ROLE_LABELS } from "../lib/constants"
import {
  listClassroomMembers,
  updateMemberPermissions,
  kickMember
} from "../api/classroom-api"
import type {
  ClassroomMember,
  UpdateMemberPermissionsPayload
} from "../types/classroom"

import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/shared/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
import { Switch } from "@/shared/components/ui/switch"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Spinner } from "@/shared/components/ui/spinner"
import { cn } from "@/shared/lib/utils"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import {
  DataTable,
  DataTablePagination
} from "@/shared/components/data-table"
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from "@tanstack/react-table"
import { formatDate } from "@/shared/components/data-table-utils"

export function ClassroomMembersPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const queryClient = useQueryClient()
  const { classroom, isLoading: isLoadingClassroom } = useClassroomDetail()
  const authUser = useAuthStore((state) => state.authUser)

  useDocumentTitle(classroom ? `${classroom.name} - Members` : "Classroom Members")

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["classroom-members", classroomId],
    queryFn: () => listClassroomMembers(classroomId!),
    enabled: !!classroomId,
  })

  // State for kick confirmation dialog
  const [memberToKick, setMemberToKick] = useState<ClassroomMember | null>(null)
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false)

  // Mutations
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberPermissionsPayload }) =>
      updateMemberPermissions(classroomId!, memberId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-members", classroomId] })
      toast.success("Permissions updated successfully")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  const kickMutation = useMutation({
    mutationFn: (memberId: string) => kickMember(classroomId!, memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-members", classroomId] })
      toast.success("Member removed successfully")
      setIsKickDialogOpen(false)
      setMemberToKick(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  // Helper permissions checks
  const isOwner = classroom?.role === "OWNER"
  const canManageStudents = classroom?.canManageStudents || isOwner

  // Partition members by role
  const students = useMemo(() => members.filter((m) => m.role === "STUDENT" && m.active), [members])
  const staffs = useMemo(() => members.filter((m) => m.role === "STAFF" && m.active), [members])
  const owners = useMemo(() => members.filter((m) => m.role === "OWNER" && m.active), [members])

  // Pagination states
  const [studentPagination, setStudentPagination] = usePersistentPagination("oes-classroom-students")
  const [staffPagination, setStaffPagination] = usePersistentPagination("oes-classroom-staffs")
  const [ownerPagination, setOwnerPagination] = usePersistentPagination("oes-classroom-owners")

  // Member promotion & demotion actions
  const handlePromoteToStaff = useCallback((member: ClassroomMember) => {
    updatePermissionsMutation.mutate({
      memberId: member.id,
      payload: {
        canManageExams: false,
        canManageStudents: false,
        canManageGrades: false,
        role: "STAFF"
      }
    })
  }, [updatePermissionsMutation])

  const handleDemoteToStudent = useCallback((member: ClassroomMember) => {
    updatePermissionsMutation.mutate({
      memberId: member.id,
      payload: {
        canManageExams: false,
        canManageStudents: false,
        canManageGrades: false,
        role: "STUDENT"
      }
    })
  }, [updatePermissionsMutation])

  const handleTogglePermission = useCallback((member: ClassroomMember, key: "canManageExams" | "canManageStudents" | "canManageGrades") => {
    const payload: UpdateMemberPermissionsPayload = {
      canManageExams: member.canManageExams,
      canManageStudents: member.canManageStudents,
      canManageGrades: member.canManageGrades,
      role: member.role,
      [key]: !member[key]
    }
    updatePermissionsMutation.mutate({
      memberId: member.id,
      payload
    })
  }, [updatePermissionsMutation])

  const handleKickConfirm = () => {
    if (!memberToKick) return
    kickMutation.mutate(memberToKick.id)
  }

  // Common Name Cell renderer
  const renderNameCell = useCallback((member: ClassroomMember) => {
    const fullName = [member.firstName, member.middleName, member.lastName].filter(Boolean).join(" ")
    const isSelf = authUser?.username === member.username
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            {fullName}
            {isSelf && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 py-0">
                You
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">@{member.username}</span>
        </div>
      </div>
    )
  }, [authUser])

  // Column definitions
  const studentColumns = useMemo<ColumnDef<ClassroomMember>[]>(() => {
    const cols: ColumnDef<ClassroomMember>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => renderNameCell(row.original),
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "joinedAt",
        header: "Joined At",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatDate(row.original.joinedAt)}
          </span>
        ),
      },
    ]

    if (canManageStudents) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right pr-4">Actions</div>,
        cell: ({ row }) => {
          const member = row.original
          const isSelf = authUser?.username === member.username
          return (
            <div className="flex justify-end pr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => handlePromoteToStaff(member)}>
                      <ShieldCheckIcon className="mr-2 h-4 w-4" />
                      Promote to Staff
                    </DropdownMenuItem>
                  )}
                  {isOwner && <DropdownMenuSeparator />}
                  {!isSelf && (
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => {
                        setMemberToKick(member)
                        setIsKickDialogOpen(true)
                      }}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      })
    }

    return cols
  }, [canManageStudents, isOwner, authUser, renderNameCell, handlePromoteToStaff])

  const staffColumns = useMemo<ColumnDef<ClassroomMember>[]>(() => {
    const cols: ColumnDef<ClassroomMember>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => renderNameCell(row.original),
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "canManageExams",
        header: "Manage Exams",
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="flex items-center">
              <Switch
                checked={member.canManageExams}
                disabled={!isOwner || updatePermissionsMutation.isPending}
                onCheckedChange={() => handleTogglePermission(member, "canManageExams")}
                aria-label="Toggle exam management permission"
              />
            </div>
          )
        },
      },
      {
        accessorKey: "canManageStudents",
        header: "Manage Students",
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="flex items-center">
              <Switch
                checked={member.canManageStudents}
                disabled={!isOwner || updatePermissionsMutation.isPending}
                onCheckedChange={() => handleTogglePermission(member, "canManageStudents")}
                aria-label="Toggle student management permission"
              />
            </div>
          )
        },
      },
      {
        accessorKey: "canManageGrades",
        header: "Manage Grades",
        cell: ({ row }) => {
          const member = row.original
          return (
            <div className="flex items-center">
              <Switch
                checked={member.canManageGrades}
                disabled={!isOwner || updatePermissionsMutation.isPending}
                onCheckedChange={() => handleTogglePermission(member, "canManageGrades")}
                aria-label="Toggle grade management permission"
              />
            </div>
          )
        },
      },
    ]

    if (isOwner) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right pr-4">Actions</div>,
        cell: ({ row }) => {
          const member = row.original
          const isSelf = authUser?.username === member.username
          return (
            <div className="flex justify-end pr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleDemoteToStudent(member)}>
                    <GraduationCapIcon className="mr-2 h-4 w-4" />
                    Demote to Student
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!isSelf && (
                    <DropdownMenuItem
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onClick={() => {
                        setMemberToKick(member)
                        setIsKickDialogOpen(true)
                      }}
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      })
    }

    return cols
  }, [isOwner, authUser, updatePermissionsMutation.isPending, renderNameCell, handleDemoteToStudent, handleTogglePermission])

  const ownerColumns = useMemo<ColumnDef<ClassroomMember>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => renderNameCell(row.original),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "joinedAt",
      header: "Joined At",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {formatDate(row.original.joinedAt)}
        </span>
      ),
    },
  ], [renderNameCell])

  const getMemberColumnClass = (columnId: string) =>
    cn(
      columnId === "name" && "w-1/3 min-w-[200px] font-medium",
      columnId === "email" && "w-1/3 min-w-[200px]",
      columnId === "joinedAt" && "w-1/3 min-w-[150px]",
      (columnId === "canManageExams" || columnId === "canManageStudents" || columnId === "canManageGrades") && "w-[150px] min-w-[150px]",
      columnId === "actions" && "w-16 min-w-[64px] text-right"
    )

  // React Tables
  // eslint-disable-next-line react-hooks/incompatible-library
  const studentTable = useReactTable({
    data: students,
    columns: studentColumns,
    state: {
      pagination: studentPagination,
    },
    onPaginationChange: setStudentPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const staffTable = useReactTable({
    data: staffs,
    columns: staffColumns,
    state: {
      pagination: staffPagination,
    },
    onPaginationChange: setStaffPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const ownerTable = useReactTable({
    data: owners,
    columns: ownerColumns,
    state: {
      pagination: ownerPagination,
    },
    onPaginationChange: setOwnerPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  if (isLoadingClassroom || isLoadingMembers) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Classroom not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="@container/main flex flex-1 flex-col min-h-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{classroom.name}</h1>
              <Badge
                variant={
                  classroom.role === "OWNER"
                    ? "default"
                    : classroom.role === "STAFF"
                      ? "secondary"
                      : "outline"
                }
              >
                {CLASSROOM_ROLE_LABELS[classroom.role] ?? classroom.role}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {classroom.description || "Manage students, staff, and owner permissions for this classroom."}
            </p>
          </div>
        </div>

        {/* Content Tabs */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 lg:px-6 pb-6">
            <div className="space-y-6">
              <Tabs defaultValue="students" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="students" className="flex items-center gap-2">
                    <GraduationCapIcon className="h-4 w-4" />
                    <span>Students</span>
                  </TabsTrigger>
                  <TabsTrigger value="staffs" className="flex items-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>Staff</span>
                  </TabsTrigger>
                  <TabsTrigger value="owner" className="flex items-center gap-2">
                    <CrownIcon className="h-4 w-4" />
                    <span>Owner</span>
                  </TabsTrigger>
                </TabsList>

                {/* Students Tab */}
                <TabsContent value="students" className="space-y-4 mt-4">
                  <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
                    <DataTable
                      table={studentTable}
                      columns={studentColumns}
                      getColumnClass={getMemberColumnClass}
                      noResultsMessage="No students found."
                    />
                  </div>
                  <DataTablePagination
                    table={studentTable}
                    renderDetails={(total) =>
                      `There ${total === 1 ? "is" : "are"} ${total} student${total === 1 ? "" : "s"} in this classroom.`
                    }
                  />
                </TabsContent>

                {/* Staff Tab */}
                <TabsContent value="staffs" className="space-y-4 mt-4">
                  <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
                    <DataTable
                      table={staffTable}
                      columns={staffColumns}
                      getColumnClass={getMemberColumnClass}
                      noResultsMessage="No staff members found."
                    />
                  </div>
                  <DataTablePagination
                    table={staffTable}
                    renderDetails={(total) =>
                      `There ${total === 1 ? "is" : "are"} ${total} staff${total === 1 ? "" : "s"} in this classroom.`
                    }
                  />
                </TabsContent>

                {/* Owner Tab */}
                <TabsContent value="owner" className="space-y-4 mt-4">
                  <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
                    <DataTable
                      table={ownerTable}
                      columns={ownerColumns}
                      getColumnClass={getMemberColumnClass}
                      noResultsMessage="No owner found."
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Kick Confirmation Dialog */}
      <Dialog open={isKickDialogOpen} onOpenChange={setIsKickDialogOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {memberToKick
                  ? [memberToKick.firstName, memberToKick.middleName, memberToKick.lastName]
                    .filter(Boolean)
                    .join(" ")
                  : "this member"}
              </span>{" "}
              from the classroom? This action cannot be undone, and they will lose access to all exams and submissions
              in this classroom.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsKickDialogOpen(false)
                setMemberToKick(null)
              }}
              disabled={kickMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleKickConfirm}
              disabled={kickMutation.isPending}
            >
              {kickMutation.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
