export type StudentGradeVisibilityMode =
  | "NOT_VIEW_AFTER_FINISHED"
  | "VIEW_AFTER_FINISHED_EACH_ATTEMPT"
  | "VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT"

export type StudentAnswerVisibilityMode =
  | "NOT_VIEW_AFTER_FINISHED"
  | "VIEW_AFTER_FINISHED_EACH_ATTEMPT"
  | "VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT"

export type ExamStatus = "NOT_STARTED" | "RUNNING" | "EXPIRED"

export type ExamQuestion = {
  id: string
  prompt: string
  type: string
  points: number
  content: unknown // We'll keep unknown for polymorphic content for now but avoid it in components
  rubric: unknown
}

export type ExamAttemptAnswer = {
  questionId: string
  answer: unknown
  rubric?: unknown
  score?: number
  graded?: boolean
  overridden?: boolean
}

export type AttemptAnswersResponse = {
  attemptId: string
  status: string
  rubricVisible: boolean
  gradeVisible: boolean
  answers: ExamAttemptAnswer[]
  rubricHiddenReason?: string
  gradeHiddenReason?: string
}

export type ExamQuestionGroup = {
  id: string
  prompt: string | null
  isGroup: boolean
  questions: ExamQuestion[]
}

export type Exam = {
  id: string
  title: string
  classroomId: string
  groupId: string | null
  questionGroupCount: number
  orderIndex: number
  studentGradeVisibilityMode: StudentGradeVisibilityMode
  studentAnswerVisibilityMode: StudentAnswerVisibilityMode
  startTime: string
  endTime: string | null
  duration: number | null
  maxAttempts: number | null
  status: string
  questionGroups?: ExamQuestionGroup[]
}

export type ExamGroup = {
  id: string
  name: string
  createdAt: string
}

export type UpdateExamPayload = {
  title: string
  studentGradeVisibilityMode: StudentGradeVisibilityMode
  studentAnswerVisibilityMode: StudentAnswerVisibilityMode
  startTime: string
  endTime: string | null
  duration: number | null
  maxAttempts: number | null
  groupId: string | null
}

export type MoveExamPayload = {
  previousSiblingId: string | null
}

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED"

export type ExamAttempt = {
  attemptId: string
  attemptNumber: number
  status: AttemptStatus
  startedAt: string
  submittedAt: string | null
  calculatedDeadline: string | null
  serverTime: string
  studentId?: string
  studentName?: string
}

export interface FileDetails {
  fileId: string
  originalFilename: string
}

export interface FileSubmissionResponse {
  attemptId: string
  questionId: string
  uploadedCount: number
  files: FileDetails[]
}
