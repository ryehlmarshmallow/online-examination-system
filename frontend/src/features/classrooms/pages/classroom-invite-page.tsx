import {
  useState,
  useEffect
} from "react"
import {
  useParams,
  useNavigate
} from "react-router-dom"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import {
  GraduationCapIcon,
  UserIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ClockIcon,
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Spinner } from "@/shared/components/ui/spinner"
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
  getInvite,
  rejectInvite,
  acceptInvite,
  getInviteLinkDetails,
  acceptInviteLink
} from "../api/classroom-api"
import type {
  ClassroomInvite,
  ClassroomInviteLinkDetails
} from "../types/classroom"

interface ClassroomInvitePageProps {
  type: "user" | "link"
}

export function ClassroomInvitePage({ type }: ClassroomInvitePageProps) {
  const { inviteId, token } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [inviteData, setInviteData] = useState<ClassroomInvite | null>(null)
  const [linkData, setLinkData] = useState<ClassroomInviteLinkDetails | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)

        if (type === "user" && inviteId) {
          const data = await getInvite(inviteId)
          if (!active) return

          if (data.alreadyMember) {
            toast.info("You are already in this class.")
            navigate(`/classrooms/${data.classroomId}`, { replace: true })
            return
          }

          setInviteData(data)
        } else if (type === "link" && token) {
          const data = await getInviteLinkDetails(token)
          if (!active) return

          if (data.alreadyMember) {
            toast.info("You are already in this class.")
            navigate(`/classrooms/${data.classroomId}`, { replace: true })
            return
          }

          setLinkData(data)
        } else {
          setErrorMsg("Invalid invitation information.")
        }
      } catch (err) {
        console.error("Error loading invite details:", err)
        if (active) {
          const apiErr = err as { response?: { data?: { message?: string } } }
          setErrorMsg(apiErr?.response?.data?.message || "Failed to load invitation details. It may be invalid or you might not have permission.")
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      active = false
    }
  }, [inviteId, token, type, navigate])

  const handleAccept = async () => {
    try {
      setActionLoading(true)
      if (type === "user" && inviteId && inviteData) {
        await acceptInvite(inviteId)
        await queryClient.invalidateQueries({ queryKey: ["my-classrooms"] })
        toast.success(`Successfully joined class: ${inviteData.classroomName}`)
        navigate(`/classrooms/${inviteData.classroomId}`, { replace: true })
      } else if (type === "link" && token && linkData) {
        const classroom = await acceptInviteLink(token)
        await queryClient.invalidateQueries({ queryKey: ["my-classrooms"] })
        toast.success(`Successfully joined class: ${linkData.classroomName}`)
        navigate(`/classrooms/${classroom.id}`, { replace: true })
      }
    } catch (err) {
      console.error("Error accepting invite:", err)
      const apiErr = err as { response?: { data?: { message?: string } } }
      toast.error(apiErr?.response?.data?.message || "Failed to accept the invitation.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setActionLoading(true)
      if (type === "user" && inviteId) {
        const updated = await rejectInvite(inviteId)
        setInviteData(updated)
        toast.success("Invitation declined.")
      } else if (type === "link") {
        toast.success("Invitation declined.")
        navigate("/classrooms", { replace: true })
      }
    } catch (err) {
      console.error("Error rejecting invite:", err)
      const apiErr = err as { response?: { data?: { message?: string } } }
      toast.error(apiErr?.response?.data?.message || "Failed to decline the invitation.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md border-border shadow-xl">
          <CardHeader className="text-center">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
              <AlertTriangleIcon className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight text-foreground">Invitation Error</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              {errorMsg}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center border-t border-border pt-6">
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-2">
              <ChevronLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Determine classroom info and status
  const classroomName = type === "user" ? inviteData?.classroomName : linkData?.classroomName
  const classroomDescription = type === "user" ? inviteData?.classroomDescription : linkData?.classroomDescription

  // Format inviter name
  let inviterName = ""
  if (type === "user" && inviteData) {
    const first = inviteData.invitedByFirstName || ""
    const last = inviteData.invitedByLastName || ""
    const user = inviteData.invitedByUsername || ""
    inviterName = (first + " " + last).trim() || user
  } else if (type === "link" && linkData) {
    const first = linkData.invitedByFirstName || ""
    const last = linkData.invitedByLastName || ""
    const user = linkData.invitedByUsername || ""
    inviterName = (first + " " + last).trim() || user
  }

  // Determine invite state/status
  let isActionable = false
  let statusText = "PENDING"
  let statusColor: "default" | "secondary" | "destructive" | "outline" = "default"
  let statusIcon = null

  if (type === "user" && inviteData) {
    isActionable = inviteData.actionable
    statusText = inviteData.status

    if (statusText === "ACCEPTED") {
      statusColor = "secondary"
      statusIcon = <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
    } else if (statusText === "EXPIRED") {
      statusColor = "destructive"
      statusIcon = <ClockIcon className="h-4 w-4 text-destructive" />
    } else if (statusText === "REJECTED") {
      statusColor = "destructive"
      statusIcon = <XCircleIcon className="h-4 w-4 text-destructive" />
    } else if (statusText === "REVOKED") {
      statusColor = "destructive"
      statusIcon = <AlertTriangleIcon className="h-4 w-4 text-destructive" />
    }
  } else if (type === "link" && linkData) {
    const isExpired = linkData.expired
    const isRevoked = linkData.revoked
    const isCapacityReached = linkData.capacityReached

    isActionable = !isExpired && !isRevoked && !isCapacityReached

    if (isExpired) {
      statusText = "EXPIRED"
      statusColor = "destructive"
      statusIcon = <ClockIcon className="h-4 w-4 text-destructive" />
    } else if (isRevoked) {
      statusText = "REVOKED"
      statusColor = "destructive"
      statusIcon = <AlertTriangleIcon className="h-4 w-4 text-destructive" />
    } else if (isCapacityReached) {
      statusText = "CAPACITY_REACHED"
      statusColor = "destructive"
      statusIcon = <AlertTriangleIcon className="h-4 w-4 text-destructive" />
    }
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-linear-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <Card
        className="w-full max-w-lg border border-border shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-3xl">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div
          className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />

        <CardHeader className="text-center pt-8">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-inner">
            <GraduationCapIcon className="h-9 w-9" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground line-clamp-2">
              {classroomName}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
              {inviterName && (
                <>
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Invited by <strong className="text-foreground">{inviterName}</strong></span>
                </>
              )}
            </CardDescription>
            <div className="flex justify-center mt-2.5">
              <Badge variant={statusColor}>
                {statusText}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 md:px-8">
          {/* Status Display if not actionable */}
          {!isActionable && (
            <div
              className="flex items-center gap-3 justify-center rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm font-medium text-destructive">
              {statusIcon}
              <span>
                {statusText === "EXPIRED" && "This invitation link has expired."}
                {statusText === "REJECTED" && "You have rejected this invitation."}
                {statusText === "REVOKED" && "This invitation has been revoked."}
                {statusText === "CAPACITY_REACHED" && "This class invite link is full and cannot accept more members."}
                {statusText === "ACCEPTED" && "You have already accepted this invitation."}
              </span>
            </div>
          )}

          {/* Description Container */}
          <div className="rounded-2xl border border-border bg-card/50 p-5 shadow-sm">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-2">Classroom
              Details</h4>
            {classroomDescription ? (
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {classroomDescription}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided for this classroom.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 px-6 md:px-8 pb-8 pt-2">
          {isActionable ? (
            <>
              <Button
                variant="outline"
                className="w-full sm:w-1/2 order-2 sm:order-1 border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all font-semibold"
                onClick={() => setDeclineDialogOpen(true)}
                disabled={actionLoading}
              >
                Decline
              </Button>
              <Button
                className="w-full sm:w-1/2 order-1 sm:order-2 shadow-lg hover:shadow-xl bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold"
                onClick={handleAccept}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Accept & Join"
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-border/80 hover:bg-muted font-semibold transition-all"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>

      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline the invitation to join{" "}
              <strong className="text-foreground">{classroomName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await handleReject()
                setDeclineDialogOpen(false)
              }}
              disabled={actionLoading}
            >
              {actionLoading ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
