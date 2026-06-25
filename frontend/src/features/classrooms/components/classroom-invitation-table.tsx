import { useMemo } from "react"
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  CopyIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  DataTable,
  DataTablePagination
} from "@/shared/components/data-table"
import { formatDate } from "@/shared/components/data-table-utils"
import { usePersistentPagination } from "@/shared/hooks/use-persistent-pagination"
import { cn } from "@/shared/lib/utils"
import type {
  ClassroomInvite,
  ClassroomInviteLink
} from "../types/classroom"

// Status Badge Renderers using standard Shadcn Badge variants (no custom color styles)
const getInviteStatusBadge = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return (
        <Badge variant="secondary">
          Accepted
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          Rejected
        </Badge>
      )
    case "REVOKED":
      return (
        <Badge variant="outline">
          Revoked
        </Badge>
      )
    case "EXPIRED":
      return (
        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
          Expired
        </Badge>
      )
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

const getLinkStatusBadge = (link: ClassroomInviteLink) => {
  if (link.revoked) return <Badge variant="outline">Revoked</Badge>
  if (link.expired) return <Badge variant="outline">Expired</Badge>
  if (link.capacityReached) return <Badge variant="outline">Full</Badge>
  return <Badge variant="default">Active</Badge>
}

// 1. Direct Invitations Table
interface DirectInvitationsTableProps {
  data: ClassroomInvite[]
  isPending: boolean
  onRevoke?: (inviteId: string) => void
  isRevoking?: boolean
}

export function ClassroomDirectInvitationsTable({
                                                  data,
                                                  isPending,
                                                  onRevoke,
                                                  isRevoking = false,
                                                }: DirectInvitationsTableProps) {
  const [pagination, setPagination] = usePersistentPagination("oes-classroom-direct-invites-table")

  const columns = useMemo<ColumnDef<ClassroomInvite>[]>(() => {
    const cols: ColumnDef<ClassroomInvite>[] = [
      {
        accessorKey: "targetUser",
        header: "Invited User",
        cell: ({ row }) => {
          const invite = row.original
          const targetName = [invite.targetFirstName, invite.targetMiddleName, invite.targetLastName]
            .filter(Boolean)
            .join(" ") || invite.targetUsername
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{targetName}</span>
              <span className="text-xs text-muted-foreground font-mono">@{invite.targetUsername}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "invitedBy",
        header: "Invited By",
        cell: ({ row }) => {
          const invite = row.original
          const inviterName = [invite.invitedByFirstName, invite.invitedByMiddleName, invite.invitedByLastName]
            .filter(Boolean)
            .join(" ") || invite.invitedByUsername
          return (
            <div className="flex flex-col">
              <span>{inviterName}</span>
              <span className="text-xs text-muted-foreground font-mono">@{invite.invitedByUsername}</span>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "Sent At",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: isPending ? "expiresAt" : "respondedAt",
        header: isPending ? "Expires At" : "Responded At",
        cell: ({ row }) => {
          const date = isPending ? row.original.expiresAt : row.original.respondedAt
          return (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {date ? formatDate(date) : "Never"}
            </span>
          )
        },
      },
    ]

    if (isPending) {
      cols.push({
        id: "actions",
        header: () => <div className="text-right pr-4">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end pr-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
              onClick={() => onRevoke?.(row.original.id)}
              disabled={isRevoking}
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              Revoke
            </Button>
          </div>
        ),
      })
    } else {
      cols.push({
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getInviteStatusBadge(row.original.status),
      })
    }

    return cols
  }, [isPending, onRevoke, isRevoking])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const getColumnClass = (columnId: string) =>
    cn(
      columnId === "targetUser" && "w-1/3 min-w-[200px]",
      columnId === "invitedBy" && "w-1/4 min-w-[150px]",
      columnId === "createdAt" && "w-40 min-w-[130px]",
      columnId === (isPending ? "expiresAt" : "respondedAt") && "w-40 min-w-[130px]",
      columnId === "actions" && "w-24 min-w-[96px] text-right",
      columnId === "status" && "w-32 min-w-[110px]"
    )

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          getColumnClass={getColumnClass}
          noResultsMessage={isPending ? "No pending invitations." : "No invitation history."}
        />
      </div>
      <DataTablePagination
        table={table}
        renderDetails={(total) =>
          `Total ${total} ${isPending ? "pending" : "historical"} invitation${total === 1 ? "" : "s"}.`
        }
      />
    </div>
  )
}

// 2. Invite Links Table
interface InviteLinksTableProps {
  data: ClassroomInviteLink[]
  onRevoke?: (linkId: string) => void
  isRevoking?: boolean
}

export function ClassroomInviteLinksTable({
                                            data,
                                            onRevoke,
                                            isRevoking = false,
                                          }: InviteLinksTableProps) {
  const [pagination, setPagination] = usePersistentPagination("oes-classroom-invite-links-table")

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/classrooms/join/${token}`
    void navigator.clipboard.writeText(fullUrl)
    toast.success("Invite link copied to clipboard!")
  }

  const columns = useMemo<ColumnDef<ClassroomInviteLink>[]>(() => [
    {
      accessorKey: "token",
      header: "Invitation Link URL",
      cell: ({ row }) => {
        const token = row.original.token
        return (
          <div className="flex items-center gap-2 font-mono text-xs max-w-xs sm:max-w-md">
            <span className="break-all">
              {window.location.origin}/classrooms/join/{token}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 text-muted-foreground shrink-0"
              onClick={() => handleCopyLink(token)}
              aria-label="Copy invitation link"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "maxUses",
      header: "Uses / Max",
      cell: ({ row }) => {
        const link = row.original
        return (
          <span className="text-sm font-medium text-muted-foreground">
            {link.useCount} / {link.maxUses || "Unlimited"}
          </span>
        )
      },
    },
    {
      accessorKey: "expiresAt",
      header: "Expires At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.original.expiresAt ? formatDate(row.original.expiresAt) : "Never"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getLinkStatusBadge(row.original),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: ({ row }) => {
        const link = row.original
        const isActionable = !link.expired && !link.revoked && !link.capacityReached
        return (
          <div className="flex justify-end pr-2">
            {isActionable && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
                onClick={() => onRevoke?.(link.id)}
                disabled={isRevoking}
              >
                <Trash2Icon className="h-3.5 w-3.5" />
                Revoke
              </Button>
            )}
          </div>
        )
      },
    },
  ], [onRevoke, isRevoking])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  const getColumnClass = (columnId: string) =>
    cn(
      columnId === "token" && "w-1/2 min-w-[250px]",
      columnId === "maxUses" && "w-32 min-w-[100px]",
      columnId === "expiresAt" && "w-40 min-w-[130px]",
      columnId === "createdAt" && "w-40 min-w-[130px]",
      columnId === "status" && "w-28 min-w-[90px]",
      columnId === "actions" && "w-24 min-w-[96px] text-right"
    )

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border **:data-[slot=table-container]:overflow-x-auto">
        <DataTable
          table={table}
          columns={columns}
          getColumnClass={getColumnClass}
          noResultsMessage="No invite links created yet."
        />
      </div>
      <DataTablePagination
        table={table}
        renderDetails={(total) =>
          `Total ${total} invite link${total === 1 ? "" : "s"}.`
        }
      />
    </div>
  )
}
