import { apiClient } from "@/shared/lib/apiClient"
import type {
  BulkMoveClassroomGroupPayload,
  Classroom,
  ClassroomGroup,
  ClassroomInvite,
  ClassroomInviteLink,
  ClassroomInviteLinkDetails,
  ClassroomMember,
  CreateClassroomGroupPayload,
  CreateClassroomPayload,
  CreateInviteLinkPayload,
  InviteUserPayload,
  MoveClassroomGroupPayload,
  MoveClassroomPayload,
  MyClassroom,
  RenameClassroomGroupPayload,
  UpdateMemberPermissionsPayload,
  UserLookup,
} from "@/features/classrooms/types/classroom"

export async function createClassroom(payload: CreateClassroomPayload): Promise<Classroom> {
  const response = await apiClient.post<Classroom>("/api/classrooms", payload)
  return response.data
}

export async function listMyClassrooms(): Promise<MyClassroom[]> {
  const response = await apiClient.get<MyClassroom[]>("/api/classrooms")
  return response.data
}

export async function listClassroomMembers(classroomId: string): Promise<ClassroomMember[]> {
  const response = await apiClient.get<ClassroomMember[]>(`/api/classrooms/${classroomId}/members`)
  return response.data
}

export async function searchClassroomUsers(classroomId: string, query: string): Promise<UserLookup[]> {
  const response = await apiClient.get<UserLookup[]>(`/api/classrooms/${classroomId}/users/search`, {
    params: { query },
  })
  return response.data
}

export async function inviteUser(classroomId: string, payload: InviteUserPayload): Promise<ClassroomInvite> {
  const response = await apiClient.post<ClassroomInvite>(`/api/classrooms/${classroomId}/invites`, payload)
  return response.data
}

export async function listPendingInvites(): Promise<ClassroomInvite[]> {
  const response = await apiClient.get<ClassroomInvite[]>("/api/classrooms/invites/pending")
  return response.data
}

export async function listClassroomInvites(classroomId: string): Promise<ClassroomInvite[]> {
  const response = await apiClient.get<ClassroomInvite[]>(`/api/classrooms/${classroomId}/invites`)
  return response.data
}

export async function getInvite(inviteId: string): Promise<ClassroomInvite> {
  const response = await apiClient.get<ClassroomInvite>(`/api/classrooms/invites/${inviteId}`)
  return response.data
}

export async function acceptInvite(inviteId: string): Promise<ClassroomInvite> {
  const response = await apiClient.post<ClassroomInvite>(`/api/classrooms/invites/${inviteId}/accept`)
  return response.data
}

export async function rejectInvite(inviteId: string): Promise<ClassroomInvite> {
  const response = await apiClient.post<ClassroomInvite>(`/api/classrooms/invites/${inviteId}/reject`)
  return response.data
}

export async function revokeInvite(classroomId: string, inviteId: string): Promise<ClassroomInvite> {
  const response = await apiClient.post<ClassroomInvite>(`/api/classrooms/${classroomId}/invites/${inviteId}/revoke`)
  return response.data
}

export async function createInviteLink(
  classroomId: string,
  payload: CreateInviteLinkPayload,
): Promise<ClassroomInviteLink> {
  const response = await apiClient.post<ClassroomInviteLink>(`/api/classrooms/${classroomId}/invite-links`, payload)
  return response.data
}

export async function listInviteLinks(classroomId: string): Promise<ClassroomInviteLink[]> {
  const response = await apiClient.get<ClassroomInviteLink[]>(`/api/classrooms/${classroomId}/invite-links`)
  return response.data
}

export async function revokeInviteLink(classroomId: string, linkId: string): Promise<ClassroomInviteLink> {
  const response = await apiClient.delete<ClassroomInviteLink>(
    `/api/classrooms/${classroomId}/invite-links/${linkId}`,
  )
  return response.data
}

export async function deleteInviteHistory(classroomId: string): Promise<void> {
  await apiClient.delete(`/api/classrooms/${classroomId}/invites/history`)
}

export async function deleteInactiveInviteLinks(classroomId: string): Promise<void> {
  await apiClient.delete(`/api/classrooms/${classroomId}/invite-links/inactive`)
}

export async function getInviteLinkDetails(token: string): Promise<ClassroomInviteLinkDetails> {
  const response = await apiClient.get<ClassroomInviteLinkDetails>(`/api/classrooms/invite-links/${token}`)
  return response.data
}

export async function acceptInviteLink(token: string): Promise<Classroom> {
  const response = await apiClient.post<Classroom>(`/api/classrooms/invite-links/${token}/accept`)
  return response.data
}

export async function updateMemberPermissions(
  classroomId: string,
  memberId: string,
  payload: UpdateMemberPermissionsPayload,
): Promise<ClassroomMember> {
  const response = await apiClient.put<ClassroomMember>(
    `/api/classrooms/${classroomId}/members/${memberId}/permissions`,
    payload,
  )
  return response.data
}

export async function kickMember(classroomId: string, memberId: string): Promise<void> {
  await apiClient.post(`/api/classrooms/${classroomId}/members/${memberId}/kick`)
}

export async function createClassroomGroup(payload: CreateClassroomGroupPayload): Promise<ClassroomGroup> {
  const response = await apiClient.post<ClassroomGroup>("/api/classrooms/groups", payload)
  return response.data
}

export async function renameClassroomGroup(
  groupId: string,
  payload: RenameClassroomGroupPayload,
): Promise<ClassroomGroup> {
  const response = await apiClient.put<ClassroomGroup>(`/api/classrooms/groups/${groupId}/rename`, payload)
  return response.data
}

export async function deleteClassroomGroup(groupId: string): Promise<void> {
  await apiClient.delete(`/api/classrooms/groups/${groupId}`)
}

export async function listClassroomGroups(): Promise<ClassroomGroup[]> {
  const response = await apiClient.get<ClassroomGroup[]>("/api/classrooms/groups")
  return response.data
}

export async function moveClassroomsToGroup(payload: BulkMoveClassroomGroupPayload): Promise<Classroom[]> {
  const response = await apiClient.put<Classroom[]>("/api/classrooms/group-moves", payload)
  return response.data
}

export async function moveClassroomGroup(
  groupId: string,
  payload: MoveClassroomGroupPayload,
): Promise<ClassroomGroup> {
  const response = await apiClient.put<ClassroomGroup>(`/api/classrooms/groups/${groupId}/move`, payload)
  return response.data
}

export async function moveClassroom(classroomId: string, payload: MoveClassroomPayload): Promise<MyClassroom> {
  const response = await apiClient.put<MyClassroom>(`/api/classrooms/${classroomId}/move`, payload)
  return response.data
}
