import {
  useState,
  useEffect,
  type SubmitEvent
} from "react"
import { useParams } from "react-router-dom"
import {
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query"
import { toast } from "sonner"
import {
  LinkIcon,
  UserPlusIcon,
  ClockIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  UsersIcon,
  UserCheckIcon,
  HistoryIcon,
  XCircleIcon,
  ChevronDownIcon,
  Trash2Icon
} from "lucide-react"
import { format } from "date-fns"

import { Calendar } from "@/shared/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/shared/components/ui/popover"
import {
  Field,
  FieldGroup,
  FieldLabel
} from "@/shared/components/ui/field"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { useClassroomDetail } from "../hooks/use-classroom-detail"
import {
  listClassroomInvites,
  inviteUser,
  revokeInvite,
  listInviteLinks,
  createInviteLink,
  revokeInviteLink,
  searchClassroomUsers,
  listClassroomMembers,
  deleteInviteHistory,
  deleteInactiveInviteLinks
} from "../api/classroom-api"
import type {
  ClassroomInvite,
  UserLookup
} from "../types/classroom"

import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/shared/components/ui/tabs"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/shared/components/ui/select"
import {
  ClassroomDirectInvitationsTable,
  ClassroomInviteLinksTable
} from "../components/classroom-invitation-table"

export function ClassroomInvitationsPage() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const queryClient = useQueryClient()
  const { classroom, isLoading: isLoadingClassroom } = useClassroomDetail()

  useDocumentTitle(classroom ? `${classroom.name} - Invitations` : "Classroom Invitations")

  // Queries
  const { data: invites = [], isLoading: isLoadingInvites } = useQuery<ClassroomInvite[]>({
    queryKey: ["classroom-invites", classroomId],
    queryFn: () => listClassroomInvites(classroomId!),
    enabled: !!classroomId,
  })

  const { data: inviteLinks = [], isLoading: isLoadingLinks } = useQuery({
    queryKey: ["classroom-invite-links", classroomId],
    queryFn: () => listInviteLinks(classroomId!),
    enabled: !!classroomId,
  })

  const { data: members = [] } = useQuery({
    queryKey: ["classroom-members", classroomId],
    queryFn: () => listClassroomMembers(classroomId!),
    enabled: !!classroomId,
  })

  // Dialog & Form States
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [createLinkDialogOpen, setCreateLinkDialogOpen] = useState(false)
  const [deleteHistoryConfirmOpen, setDeleteHistoryConfirmOpen] = useState(false)
  const [deleteInactiveLinksConfirmOpen, setDeleteInactiveLinksConfirmOpen] = useState(false)

  // Direct Invite Dialog States
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<UserLookup[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)

  // Invite Link Form States
  const [maxUses, setMaxUses] = useState<string>("")
  const [expirationPreset, setExpirationPreset] = useState<string>("never")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [customTime, setCustomTime] = useState<string>("23:59:00")
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Search Debounce Effect
  useEffect(() => {
    const isShort = searchQuery.trim().length < 3
    const timer = setTimeout(() => {
      if (isShort) {
        setDebouncedQuery("")
      } else {
        setDebouncedQuery(searchQuery.trim())
      }
    }, isShort ? 0 : 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search Query
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["classroom-user-search", classroomId, debouncedQuery],
    queryFn: () => searchClassroomUsers(classroomId!, debouncedQuery),
    enabled: !!classroomId && debouncedQuery.length >= 3,
  })

  // Mutations
  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(classroomId!, inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-invites", classroomId] })
      toast.success("Invitation revoked successfully")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  const createLinkMutation = useMutation({
    mutationFn: (payload: { expiresAt: string | null; maxUses: number | null }) =>
      createInviteLink(classroomId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-invite-links", classroomId] })
      toast.success("Invitation link created successfully")
      setCreateLinkDialogOpen(false)
      // Reset Form
      setMaxUses("")
      setExpirationPreset("never")
      setCustomDate(undefined)
      setCustomTime("23:59:00")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  const revokeLinkMutation = useMutation({
    mutationFn: (linkId: string) => revokeInviteLink(classroomId!, linkId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-invite-links", classroomId] })
      toast.success("Invitation link revoked successfully")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  const deleteHistoryMutation = useMutation({
    mutationFn: () => deleteInviteHistory(classroomId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-invites", classroomId] })
      toast.success("Invitation history cleared successfully")
      setDeleteHistoryConfirmOpen(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  const deleteInactiveLinksMutation = useMutation({
    mutationFn: () => deleteInactiveInviteLinks(classroomId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["classroom-invite-links", classroomId] })
      toast.success("Inactive invite links cleared successfully")
      setDeleteInactiveLinksConfirmOpen(false)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    }
  })

  // Partition Direct Invites
  const pendingInvites = invites.filter((inv) => inv.status === "PENDING")
  const historyInvites = invites.filter((inv) => inv.status !== "PENDING")

  // Handle direct invite form submit
  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) return
    setInviteLoading(true)

    let successCount = 0
    let failureCount = 0
    const errors: string[] = []

    for (const user of selectedUsers) {
      try {
        await inviteUser(classroomId!, { identifier: user.username })
        successCount++
      } catch (err) {
        console.error(`Failed to invite ${user.username}:`, err)
        failureCount++
        errors.push(`${user.username}: ${getErrorMessage(err)}`)
      }
    }

    setInviteLoading(false)
    void queryClient.invalidateQueries({ queryKey: ["classroom-invites", classroomId] })

    if (successCount > 0 && failureCount === 0) {
      toast.success(`Successfully invited ${successCount} user(s).`)
      setInviteDialogOpen(false)
      setSelectedUsers([])
      setSearchQuery("")
    } else if (successCount > 0 && failureCount > 0) {
      toast.info(`Successfully invited ${successCount} user(s). Failed for: ${errors.join(", ")}`)
      setInviteDialogOpen(false)
      setSelectedUsers([])
      setSearchQuery("")
    } else {
      toast.error(errors.length > 0 ? errors.join(", ") : "Failed to send invitations.")
    }
  }

  // Handle invite link creation submit
  const handleCreateLink = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    let expiresAt: string | null = null
    const now = new Date()

    if (expirationPreset === "1day") {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    } else if (expirationPreset === "7days") {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (expirationPreset === "30days") {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    } else if (expirationPreset === "custom" && customDate) {
      const hours = customTime ? parseInt(customTime.split(":")[0], 10) : 23
      const minutes = customTime ? parseInt(customTime.split(":")[1], 10) : 59
      const seconds = customTime ? parseInt(customTime.split(":")[2] || "0", 10) : 0

      const mergedDate = new Date(customDate)
      mergedDate.setHours(hours, minutes, seconds, 0)
      expiresAt = mergedDate.toISOString()
    }

    const maxUsesNum = maxUses ? parseInt(maxUses, 10) : null

    createLinkMutation.mutate({ expiresAt, maxUses: maxUsesNum })
  }

  if (isLoadingClassroom) {
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
            <h1 className="text-2xl font-bold tracking-tight">{classroom.name}</h1>
            <p className="text-muted-foreground">
              Manage student invitations and dynamic invite links for this classroom.
            </p>
          </div>
        </div>

        {/* Content Tabs */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 lg:px-6 pb-6">
            <Tabs defaultValue="direct" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="direct" className="flex items-center gap-2">
                  <UserPlusIcon className="h-4 w-4" />
                  <span>Direct Invitations</span>
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Invite Links</span>
                </TabsTrigger>
              </TabsList>

              {/* Direct Invitations Tab */}
              <TabsContent value="direct" className="space-y-6 mt-6">
                <Card className="border border-border/80 shadow-md">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-primary" />
                        Direct Invitations
                      </CardTitle>
                      <CardDescription>
                        Invite specific users by their username or email.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setInviteDialogOpen(true)} className="gap-2 shadow-sm font-medium">
                      <PlusIcon className="h-4 w-4" />
                      Invite Member
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-8">
                    {/* Pending Invitations list */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        Pending Invitations
                      </h3>
                      {isLoadingInvites ? (
                        <div className="flex justify-center p-8">
                          <Spinner className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <ClassroomDirectInvitationsTable
                          data={pendingInvites}
                          isPending={true}
                          onRevoke={revokeInviteMutation.mutate}
                          isRevoking={revokeInviteMutation.isPending}
                        />
                      )}
                    </div>

                    {/* Invitation History list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                          Invitation History
                        </h3>
                        {historyInvites.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 h-8 font-medium"
                            onClick={() => setDeleteHistoryConfirmOpen(true)}
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                            Clear History
                          </Button>
                        )}
                      </div>
                      {isLoadingInvites ? (
                        <div className="flex justify-center p-8">
                          <Spinner className="h-6 w-6 text-muted-foreground" />
                        </div>
                      ) : (
                        <ClassroomDirectInvitationsTable
                          data={historyInvites}
                          isPending={false}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invitation Links Tab */}
              <TabsContent value="link" className="space-y-6 mt-6">
                <Card className="border border-border/80 shadow-md">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-primary" />
                        Invitation Links
                      </CardTitle>
                      <CardDescription>
                        Generate sharable URLs that allow students to join the classroom directly.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {inviteLinks.some(link => link.expired || link.revoked || link.capacityReached) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 h-8 font-medium"
                          onClick={() => setDeleteInactiveLinksConfirmOpen(true)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                          Clear Inactive
                        </Button>
                      )}
                      <Button onClick={() => setCreateLinkDialogOpen(true)} className="gap-2 shadow-sm font-medium">
                        <PlusIcon className="h-4 w-4" />
                        Create Link
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {isLoadingLinks ? (
                      <div className="flex justify-center p-8">
                        <Spinner className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <ClassroomInviteLinksTable
                        data={inviteLinks}
                        onRevoke={revokeLinkMutation.mutate}
                        isRevoking={revokeLinkMutation.isPending}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {/* Direct Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5 text-primary" />
              Invite Members
            </DialogTitle>
            <DialogDescription>
              Search for users to invite them to this classroom.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username or email..."
                aria-label="Search username or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selected Users list */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Users to invite ({selectedUsers.length})
                </Label>
                <div
                  className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 border border-border rounded-md bg-muted/20">
                  {selectedUsers.map((user) => {
                    const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || user.username
                    return (
                      <Badge key={user.id} variant="secondary" className="gap-1 px-2.5 py-1">
                        <span className="font-medium">{fullName}</span>
                        <button
                          type="button"
                          className="ml-1 text-muted-foreground hover:text-foreground outline-hidden"
                          onClick={() => setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id))}
                        >
                          <XCircleIcon className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search Results list */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Search Results
              </Label>
              <div className="h-44 border border-border rounded-md overflow-hidden bg-card">
                <ScrollArea className="h-full">
                  {isSearching ? (
                    <div className="flex justify-center items-center h-full py-16">
                      <Spinner className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : searchQuery.trim().length < 3 ? (
                    <div
                      className="flex justify-center items-center h-full text-sm text-muted-foreground p-6 text-center">
                      Type at least 3 characters to search.
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div
                      className="flex justify-center items-center h-full text-sm text-muted-foreground p-6 text-center">
                      No users found.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {searchResults.map((user) => {
                        const fullName = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || user.username
                        const isAlreadySelected = selectedUsers.some((u) => u.id === user.id)
                        const isAlreadyMember = members.some((m) => m.userId === user.id && m.active)
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between p-3 transition-colors ${
                              isAlreadySelected || isAlreadyMember
                                ? "bg-muted/40 cursor-default"
                                : "hover:bg-muted/60 cursor-pointer"
                            } ${isAlreadyMember ? "opacity-60" : ""}`}
                            onClick={() => {
                              if (isAlreadySelected || isAlreadyMember) return
                              setSelectedUsers([...selectedUsers, user])
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{fullName}</span>
                              <span className="text-xs text-muted-foreground">@{user.username} • {user.email}</span>
                            </div>
                            {isAlreadyMember ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                Already Member
                              </Badge>
                            ) : isAlreadySelected ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-[10px]">
                                <UserCheckIcon className="h-3 w-3" /> Selected
                              </Badge>
                            ) : (
                              <Button variant="ghost" size="sm" className="h-8 py-0 px-2 text-xs">
                                Select
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false)
                setSelectedUsers([])
                setSearchQuery("")
              }}
              disabled={inviteLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={inviteLoading || selectedUsers.length === 0}
              className="min-w-28"
            >
              {inviteLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Inviting...
                </>
              ) : (
                "Send Invites"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Specifications Dialog */}
      <Dialog open={createLinkDialogOpen} onOpenChange={setCreateLinkDialogOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateLink}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Create Invite Link
              </DialogTitle>
              <DialogDescription>
                Configure specifications for the new invitation link.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Max Uses */}
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (Capacity)</Label>
                <Input
                  id="maxUses"
                  aria-label="Max Uses (Capacity)"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  The maximum number of students who can join using this link. Leave blank for unlimited.
                </p>
              </div>

              {/* Expiration Preset Dropdown with Shadcn Select */}
              <div className="space-y-2">
                <Label htmlFor="expirationPreset">Link Expiration</Label>
                <Select value={expirationPreset} onValueChange={setExpirationPreset}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select link expiration" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="never">Never Expire</SelectItem>
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="7days">7 Days</SelectItem>
                    <SelectItem value="30days">30 Days</SelectItem>
                    <SelectItem value="custom">Custom Date & Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date & Time Picker */}
              {expirationPreset === "custom" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 mb-1">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    Expiration Date & Time
                  </Label>
                  <FieldGroup className="flex flex-row gap-4">
                    <Field className="flex-1">
                      <FieldLabel htmlFor="custom-date-picker">Date</FieldLabel>
                      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="custom-date-picker"
                            className="w-full justify-between font-normal text-left"
                            type="button"
                          >
                            {customDate ? format(customDate, "PPP") : "Select date"}
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={customDate}
                            captionLayout="dropdown"
                            defaultMonth={customDate}
                            onSelect={(date) => {
                              setCustomDate(date)
                              setCalendarOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field className="w-36">
                      <FieldLabel htmlFor="custom-time-picker">Time</FieldLabel>
                      <Input
                        type="time"
                        id="custom-time-picker"
                        aria-label="Time"
                        step="1"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    </Field>
                  </FieldGroup>
                  <input
                    type="hidden"
                    required
                    value={customDate ? "selected" : ""}
                    readOnly
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateLinkDialogOpen(false)
                  setMaxUses("")
                  setExpirationPreset("never")
                  setCustomDate(undefined)
                  setCustomTime("23:59:00")
                }}
                disabled={createLinkMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLinkMutation.isPending}>
                {createLinkMutation.isPending ? "Creating..." : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete History Confirmation Dialog */}
      <Dialog open={deleteHistoryConfirmOpen} onOpenChange={setDeleteHistoryConfirmOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Invitation History</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all invitation history? This will permanently remove all past invitation
              records (accepted, rejected, or revoked direct invitations) for this classroom. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteHistoryConfirmOpen(false)}
              disabled={deleteHistoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteHistoryMutation.mutate()}
              disabled={deleteHistoryMutation.isPending}
            >
              {deleteHistoryMutation.isPending ? "Clearing..." : "Clear History"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Inactive Links Confirmation Dialog */}
      <Dialog open={deleteInactiveLinksConfirmOpen} onOpenChange={setDeleteInactiveLinksConfirmOpen}>
        <DialogTrigger asChild><span className="hidden" /></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Inactive Invitation Links</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all inactive invitation links? This will permanently remove all invite
              links that are expired, revoked, or have reached their maximum capacity of uses. Active invite links will
              not be affected. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteInactiveLinksConfirmOpen(false)}
              disabled={deleteInactiveLinksMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteInactiveLinksMutation.mutate()}
              disabled={deleteInactiveLinksMutation.isPending}
            >
              {deleteInactiveLinksMutation.isPending ? "Clearing..." : "Clear Inactive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
