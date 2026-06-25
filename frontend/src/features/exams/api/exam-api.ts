import { apiClient } from "@/shared/lib/apiClient"
import type {
  Exam,
  ExamGroup,
  UpdateExamPayload,
  MoveExamPayload,
  ExamAttempt,
  AttemptAnswersResponse,
  StudentGradeVisibilityMode,
  StudentAnswerVisibilityMode,
  FileSubmissionResponse
} from "../types/exam"
import type { QuestionGroupRequest } from "@/features/questionsets/api/questionset-api"

export type SaveAnswerPayload = {
  questionId: string
  answerData: unknown // Polymorphic QuestionResponseData
  sequenceNumber: number
}

export type CreateExamPayload = {
  templateId: string
  title?: string
  classroomId: string
  studentGradeVisibilityMode?: StudentGradeVisibilityMode
  studentAnswerVisibilityMode?: StudentAnswerVisibilityMode
  startTime?: string
  endTime?: string | null
  duration?: number | null
  maxAttempts?: number | null
  groupId?: string | null
  previousSiblingId?: string | null
}

export async function listClassroomExams(classroomId: string): Promise<Exam[]> {
  const response = await apiClient.get<Exam[]>(`/api/classrooms/${classroomId}/exams`)
  return response.data
}

export async function createExam(payload: CreateExamPayload): Promise<Exam> {
  const response = await apiClient.post<Exam>("/api/exams", payload)
  return response.data
}

export async function listClassroomExamGroups(classroomId: string): Promise<ExamGroup[]> {
  const response = await apiClient.get<ExamGroup[]>(`/api/classrooms/${classroomId}/exam-groups`)
  return response.data
}

export async function getExamDetail(examId: string): Promise<Exam> {
  const response = await apiClient.get<Exam>(`/api/exams/${examId}`)
  return response.data
}

export async function updateExam(examId: string, payload: UpdateExamPayload): Promise<Exam> {
  const response = await apiClient.put<Exam>(`/api/exams/${examId}`, payload)
  return response.data
}

export async function updateExamQuestions(examId: string, questionGroups: QuestionGroupRequest[]): Promise<Exam> {
  const response = await apiClient.put<Exam>(`/api/exams/${examId}/questions`, { questionGroups })
  return response.data
}

export async function moveExam(examId: string, payload: MoveExamPayload): Promise<Exam> {
  const response = await apiClient.put<Exam>(`/api/exams/${examId}/move`, payload)
  return response.data
}

export async function startAttempt(examId: string): Promise<ExamAttempt> {
  const response = await apiClient.post<ExamAttempt>(`/api/exams/${examId}/attempts`)
  return response.data
}

export async function saveAnswer(attemptId: string, payload: SaveAnswerPayload): Promise<ExamAttempt> {
  const response = await apiClient.put<ExamAttempt>(`/api/attempts/${attemptId}/save-answer`, payload)
  return response.data
}

export async function submitAttempt(attemptId: string): Promise<ExamAttempt> {
  const response = await apiClient.post<ExamAttempt>(`/api/attempts/${attemptId}/submit`)
  return response.data
}

export async function heartbeat(attemptId: string): Promise<ExamAttempt> {
  const response = await apiClient.post<ExamAttempt>(`/api/attempts/${attemptId}/heartbeat`)
  return response.data
}

export async function getAttemptHistory(examId: string): Promise<ExamAttempt[]> {
  const response = await apiClient.get<ExamAttempt[]>(`/api/exams/${examId}/attempts`)
  return response.data
}

export async function getAllAttempts(examId: string): Promise<ExamAttempt[]> {
  const response = await apiClient.get<ExamAttempt[]>(`/api/exams/${examId}/all-attempts`)
  return response.data
}

export async function getAttemptAnswers(attemptId: string): Promise<AttemptAnswersResponse> {
  const response = await apiClient.get<AttemptAnswersResponse>(`/api/attempts/${attemptId}/answers`)
  return response.data
}

export async function manualGradeQuestion(attemptId: string, questionId: string, score: number): Promise<void> {
  await apiClient.put(`/api/attempts/${attemptId}/questions/${questionId}/grade`, { score })
}

export async function clearManualGrade(attemptId: string, questionId: string): Promise<void> {
  await apiClient.delete(`/api/attempts/${attemptId}/questions/${questionId}/grade`)
}

export async function uploadQuestionFiles(attemptId: string, questionId: string, files: FileList): Promise<FileSubmissionResponse> {
  const formData = new FormData()
  Array.from(files).forEach((file) => {
    formData.append("files", file)
  })

  const response = await apiClient.post<FileSubmissionResponse>(
    `/api/attempts/${attemptId}/questions/${questionId}/files`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  )
  return response.data
}

export async function deleteQuestionFile(attemptId: string, questionId: string, fileId: string): Promise<FileSubmissionResponse> {
  const response = await apiClient.delete<FileSubmissionResponse>(
    `/api/attempts/${attemptId}/questions/${questionId}/files/${fileId}`
  )
  return response.data
}

export async function downloadSubmittedFile(attemptId: string, fileId: string): Promise<Blob> {
  const response = await apiClient.get(`/api/attempts/${attemptId}/files/${fileId}`, {
    responseType: "blob",
  })
  return response.data
}

export type SaveExamAsPayload = {
  targetDomain: "TEMPLATE" | "POOL"
  parentId: string | null
  name: string
}

export async function saveExamAs(examId: string, payload: SaveExamAsPayload): Promise<{ id: string }> {
  const response = await apiClient.post<{ id: string }>(`/api/exams/${examId}/save-as`, payload)
  return response.data
}

