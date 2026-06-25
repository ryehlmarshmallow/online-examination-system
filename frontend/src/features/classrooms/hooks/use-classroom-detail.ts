import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import {
  listClassroomExams,
  listClassroomExamGroups,
  updateExam,
  moveExam
} from "@/features/exams/api/exam-api"
import { listMyClassrooms } from "../api/classroom-api"
import type {
  StudentAnswerVisibilityMode,
  StudentGradeVisibilityMode,
  UpdateExamPayload,
  MoveExamPayload,
} from "@/features/exams/types/exam"
import { toast } from "sonner"
import { getErrorMessage } from "@/shared/lib/get-error-message"

export function useClassroomDetail() {
  const { classroomId } = useParams<{ classroomId: string }>()
  const queryClient = useQueryClient()

  const { data: classrooms, isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
  })

  const classroom = classrooms?.find((c) => c.id === classroomId)

  const { data: exams, isLoading: isLoadingExams } = useQuery({
    queryKey: ["classroom-exams", classroomId],
    queryFn: () => listClassroomExams(classroomId!),
    enabled: !!classroomId,
  })

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["classroom-exam-groups", classroomId],
    queryFn: () => listClassroomExamGroups(classroomId!),
    enabled: !!classroomId,
  })

  const updateExamMutation = useMutation({
    mutationFn: ({ examId, payload }: { examId: string; payload: UpdateExamPayload }) =>
      updateExam(examId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-exams", classroomId] })
      toast.success("Exam updated successfully")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const moveExamMutation = useMutation({
    mutationFn: ({ examId, payload }: { examId: string; payload: MoveExamPayload }) =>
      moveExam(examId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-exams", classroomId] })
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ["classroom-exams", classroomId] })
      toast.error(getErrorMessage(error))
    },
  })

  const handleUpdateVisibility = (
    examId: string,
    type: "grade" | "answer",
    value: StudentGradeVisibilityMode | StudentAnswerVisibilityMode,
  ) => {
    const exam = exams?.find((e) => e.id === examId)
    if (!exam) return

    const payload: UpdateExamPayload = {
      title: exam.title,
      studentGradeVisibilityMode:
        type === "grade"
          ? (value as StudentGradeVisibilityMode)
          : exam.studentGradeVisibilityMode,
      studentAnswerVisibilityMode:
        type === "answer"
          ? (value as StudentAnswerVisibilityMode)
          : exam.studentAnswerVisibilityMode,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      maxAttempts: exam.maxAttempts,
      groupId: exam.groupId,
    }

    updateExamMutation.mutate({ examId, payload })
  }

  const handleMoveExam = (examId: string, previousSiblingId: string | null) => {
    moveExamMutation.mutate({ examId, payload: { previousSiblingId } })
  }

  const canManageExams = classroom?.canManageExams ?? false
  const canManageStudents = classroom?.canManageStudents ?? false
  const canManageGrades = classroom?.canManageGrades ?? false

  return {
    classroom,
    exams: exams ?? [],
    groups: groups ?? [],
    isLoading: isLoadingClassrooms || isLoadingExams || isLoadingGroups,
    canManageExams,
    canManageStudents,
    canManageGrades,
    handleUpdateVisibility,
    handleMoveExam,
  }
}
