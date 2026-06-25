export type ClassroomGroup = {
  id: string
  name: string
  createdAt: string
  orderIndex: number
}

export type CreateClassroomGroupPayload = {
  name: string
}

export type RenameClassroomGroupPayload = {
  name: string
}

export type MoveClassroomGroupPayload = {
  previousSiblingId: string | null
}

export type BulkMoveClassroomGroupPayload = {
  classroomIds: string[]
  groupId: string | null
}

export type ClassroomRole = "OWNER" | "STAFF" | "STUDENT"

export type ClassroomInviteStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED" | "REJECTED"

export type MyClassroom = {
  id: string
  name: string
  description: string | null
  role: ClassroomRole
  canManageExams: boolean
  canManageStudents: boolean
  canManageGrades: boolean
  groupId: string | null
  orderIndex: number
  joinedAt: string
  createdAt: string
}

export type MoveClassroomPayload = {
  groupId: string | null
  previousSiblingId: string | null
}

export type Classroom = {
  id: string
  name: string
  description: string | null
  ownerUserId: string
  createdAt: string
}

export type ClassroomMember = {
  id: string
  userId: string
  username: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  role: ClassroomRole
  canManageExams: boolean
  canManageStudents: boolean
  canManageGrades: boolean
  joinedAt: string
  active: boolean
}

export type UserLookup = {
  id: string
  username: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
}

export type ClassroomInvite = {
  id: string
  classroomId: string
  classroomName: string
  classroomDescription: string | null
  invitedByUserId: string
  invitedByUsername: string
  invitedByFirstName: string
  invitedByMiddleName: string | null
  invitedByLastName: string
  targetUserId: string
  targetUsername: string
  targetFirstName: string
  targetMiddleName: string | null
  targetLastName: string
  targetEmail: string
  status: ClassroomInviteStatus
  actionable: boolean
  alreadyMember: boolean
  createdAt: string
  expiresAt: string
  respondedAt: string | null
}

export type ClassroomInviteLinkDetails = {
  token: string
  classroomId: string
  classroomName: string
  classroomDescription: string | null
  invitedByUsername: string | null
  invitedByFirstName: string | null
  invitedByLastName: string | null
  expired: boolean
  revoked: boolean
  capacityReached: boolean
  alreadyMember: boolean
}

export type ClassroomInviteLink = {
  id: string
  classroomId: string
  token: string
  expiresAt: string | null
  maxUses: number | null
  useCount: number
  revoked: boolean
  expired: boolean
  capacityReached: boolean
  createdAt: string
}

export type CreateClassroomPayload = {
  name: string
  description?: string
}

export type InviteUserPayload = {
  identifier: string
}

export type CreateInviteLinkPayload = {
  expiresAt?: string | null
  maxUses?: number | null
}

export type UpdateMemberPermissionsPayload = {
  canManageExams: boolean
  canManageStudents: boolean
  canManageGrades: boolean
  role: ClassroomRole
}
