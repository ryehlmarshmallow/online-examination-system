import { apiClient } from "@/shared/lib/apiClient"

export type NotificationType = 'EXAM_PUBLISHED' | 'EXAM_GRADED' | 'CLASSROOM_INVITATION';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UserNotificationSettings {
  emailExamPublished: boolean;
  emailExamGraded: boolean;
  emailClassroomInvite: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export async function getNotifications(page = 0, size = 20): Promise<PaginatedResponse<NotificationItem>> {
  const response = await apiClient.get<PaginatedResponse<NotificationItem>>("/api/notifications", {
    params: { page, size }
  });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<number>("/api/notifications/unread-count");
  return response.data;
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.post("/api/notifications/mark-all-read");
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function deleteNotification(id: string): Promise<void> {
  await apiClient.delete(`/api/notifications/${id}`);
}

export async function deleteAllNotifications(onlyRead = false): Promise<void> {
  await apiClient.delete("/api/notifications", {
    params: { onlyRead }
  });
}

export async function getSettings(): Promise<UserNotificationSettings> {
  const response = await apiClient.get<UserNotificationSettings>("/api/notifications/settings");
  return response.data;
}

export async function updateSettings(settings: UserNotificationSettings): Promise<UserNotificationSettings> {
  const response = await apiClient.put<UserNotificationSettings>("/api/notifications/settings", settings);
  return response.data;
}
