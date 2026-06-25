import {
  useState,
  useEffect,
  useCallback,
  useRef
} from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  BellIcon,
  CheckCheckIcon,
  Trash2Icon,
  TrashIcon
} from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { useDisclosure } from "@/shared/hooks/use-disclosure"
import { usePersistentPagination } from "@/shared/hooks/use-persistent-pagination"
import { type PaginationState } from "@tanstack/react-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/shared/components/ui/dialog"
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../api/notifications-api"
import type {
  NotificationItem
} from "../api/notifications-api"
import { NotificationTable } from "../components/notification-table"

export function NotificationPage() {
  const navigate = useNavigate()
  useDocumentTitle("Notifications")

  // Notification Feed State
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [pagination, setPagination] = usePersistentPagination("oes-notification-table")
  const page = pagination.pageIndex
  const pageSize = pagination.pageSize
  const setPage = useCallback((p: number | ((prev: number) => number)) => {
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageIndex: typeof p === "function" ? p(prev.pageIndex) : p,
    }))
  }, [setPagination])

  const setPageSize = useCallback((size: number) => {
    setPagination((prev: PaginationState) => ({
      ...prev,
      pageSize: size,
      pageIndex: 0,
    }))
  }, [setPagination])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [inboxLoading, setInboxLoading] = useState(true)

  // Dialog disclosures
  const deleteAllDialog = useDisclosure()
  const deleteAllReadDialog = useDisclosure()
  const deleteSingleDialog = useDisclosure()
  const [notificationToDelete, setNotificationToDelete] = useState<NotificationItem | null>(null)

  // Pending actions state
  const [deletingAll, setDeletingAll] = useState(false)
  const [deletingAllRead, setDeletingAllRead] = useState(false)
  const [deletingSingle, setDeletingSingle] = useState(false)


  // Fetch notifications list
  const fetchNotifications = async (targetPage = 0, currentSize = pageSize) => {
    try {
      setInboxLoading(true)
      const data = await getNotifications(targetPage, currentSize)
      setNotifications(data.content)
      setPage(data.page.number)
      setTotalPages(data.page.totalPages)
      setTotalElements(data.page.totalElements)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications list")
    } finally {
      setInboxLoading(false)
    }
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (err) {
      console.error("Failed to fetch unread count", err)
    }
  }

  const initParamsRef = useRef({ pageSize, setPage })
  useEffect(() => {
    initParamsRef.current = { pageSize, setPage }
  }, [pageSize, setPage])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const { pageSize: currentSize, setPage: currentSetPage } = initParamsRef.current
        const [notificationsData, count] = await Promise.all([
          getNotifications(0, currentSize),
          getUnreadCount(),
        ])
        if (!mounted) return
        setNotifications(notificationsData.content)
        currentSetPage(notificationsData.page.number)
        setTotalPages(notificationsData.page.totalPages)
        setTotalElements(notificationsData.page.totalElements)
        setUnreadCount(count)
      } catch (err) {
        console.error("Failed to initialize notifications page", err)
        toast.error("Failed to load notifications data")
      } finally {
        if (mounted) {
          setInboxLoading(false)
        }
      }
    }
    void init()
    return () => {
      mounted = false
    }
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      toast.success("All notifications marked as read")
      await fetchNotifications(page)
      await fetchUnreadCount()
    } catch (err) {
      console.error(err)
      toast.error("Failed to mark notifications as read")
    }
  }

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true)
      await deleteAllNotifications(false)
      toast.success("All notifications deleted successfully")
      deleteAllDialog.onClose()
      await fetchNotifications(0)
      await fetchUnreadCount()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete notifications")
    } finally {
      setDeletingAll(false)
    }
  }

  const handleDeleteAllRead = async () => {
    try {
      setDeletingAllRead(true)
      await deleteAllNotifications(true)
      toast.success("All read notifications deleted")
      deleteAllReadDialog.onClose()
      await fetchNotifications(0)
      await fetchUnreadCount()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete read notifications")
    } finally {
      setDeletingAllRead(false)
    }
  }

  const handleDeleteSingle = async () => {
    if (!notificationToDelete) return
    try {
      setDeletingSingle(true)
      await deleteNotification(notificationToDelete.id)
      toast.success("Notification deleted")
      deleteSingleDialog.onClose()

      const isLastItem = notifications.length === 1
      const targetPage = isLastItem && page > 0 ? page - 1 : page

      await fetchNotifications(targetPage)
      await fetchUnreadCount()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete notification")
    } finally {
      setDeletingSingle(false)
      setNotificationToDelete(null)
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    // 1. Mark as read on backend if unread
    if (!item.isRead) {
      try {
        await markAsRead(item.id)
        // Optimistically update list and unread count
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        console.error("Failed to mark single notification as read", err)
      }
    }

    // 2. Parse metadata and navigate
    if (item.metadata) {
      try {
        const meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
        if (item.type === "EXAM_PUBLISHED" && meta.classroomId && meta.examId) {
          navigate(`/classrooms/${meta.classroomId}/exams/${meta.examId}`)
          return
        }
        if (item.type === "EXAM_GRADED" && meta.classroomId && meta.examId && meta.attemptId) {
          navigate(`/classrooms/${meta.classroomId}/exams/${meta.examId}/attempts/${meta.attemptId}`)
          return
        }
        if (item.type === "CLASSROOM_INVITATION" && meta.inviteId) {
          navigate(`/classrooms/invite/${meta.inviteId}`)
          return
        }
      } catch (e) {
        console.error("Error parsing notification metadata", e)
      }
    }

    // Fallbacks
    if (item.type === "CLASSROOM_INVITATION") {
      navigate("/classrooms")
    }
  }


  const handlePageChange = (newPageIndex: number) => {
    void fetchNotifications(newPageIndex, pageSize)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    void fetchNotifications(0, newPageSize)
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="@container/main flex flex-1 flex-col min-h-0">
        <div className="flex shrink-0 items-center justify-between gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your inbox alerts and exam results.
            </p>
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 lg:px-6 pb-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Your Messages</h2>
                  <p className="text-sm text-muted-foreground">
                    {totalElements} total notification{totalElements !== 1 && "s"}
                  </p>
                </div>
                {totalElements > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteAllDialog.onOpen}
                      className="flex items-center gap-1.5"
                    >
                      <Trash2Icon className="h-4 w-4" />
                      Delete all
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deleteAllReadDialog.onOpen}
                      className="flex items-center gap-1.5 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete all read
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5"
                      >
                        <CheckCheckIcon className="h-4 w-4" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {inboxLoading && notifications.length === 0 ? (
                <div className="flex h-48 items-center justify-center">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-56 text-center p-6 border border-dashed rounded-lg bg-muted/20">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3 text-muted-foreground">
                    <BellIcon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">No notifications</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    You're all caught up! New alerts regarding your classes or exams will appear here.
                  </p>
                </div>
              ) : (
                <NotificationTable
                  data={notifications}
                  page={page}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  onNotificationClick={handleNotificationClick}
                  onDeleteClick={(item) => {
                    setNotificationToDelete(item)
                    deleteSingleDialog.onOpen()
                  }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialog.isOpen} onOpenChange={deleteAllDialog.setIsOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Notifications</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all of your notifications? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={deleteAllDialog.onClose} disabled={deletingAll}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deletingAll}>
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Read Dialog */}
      <Dialog open={deleteAllReadDialog.isOpen} onOpenChange={deleteAllReadDialog.setIsOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Read Notifications</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all read notifications? This will leave behind all unread notifications.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={deleteAllReadDialog.onClose} disabled={deletingAllRead}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllRead} disabled={deletingAllRead}>
              {deletingAllRead ? "Deleting..." : "Delete Read"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Single Dialog */}
      <Dialog open={deleteSingleDialog.isOpen} onOpenChange={deleteSingleDialog.setIsOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={deleteSingleDialog.onClose} disabled={deletingSingle}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSingle} disabled={deletingSingle}>
              {deletingSingle ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
