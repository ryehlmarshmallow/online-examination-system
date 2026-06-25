import {
  useNavigate,
  useParams
} from "react-router-dom"
import {
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import {
  getExamDetail,
  getAttemptHistory,
  getAllAttempts,
  startAttempt,
  listClassroomExamGroups,
  updateExam,
} from "../api/exam-api"
import { listMyClassrooms } from "@/features/classrooms/api/classroom-api"
import { toast } from "sonner"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import type { UpdateExamPayload } from "../types/exam"

export function useExamDetail() {
  const { classroomId, examId } = useParams<{ classroomId: string; examId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: classrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
  })

  const classroom = classrooms?.find((c) => c.id === classroomId)
  const canManageExams = classroom?.canManageExams ?? false
  const canManageGrades = classroom?.canManageGrades ?? false

  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => getExamDetail(examId!),
    enabled: !!examId,
  })

  const { data: attempts, isLoading: isLoadingAttempts } = useQuery({
    queryKey: ["exam-attempts", examId],
    queryFn: () => getAttemptHistory(examId!),
    enabled: !!examId,
  })

  const { data: allAttempts, isLoading: isLoadingAllAttempts } = useQuery({
    queryKey: ["exam-all-attempts", examId],
    queryFn: () => getAllAttempts(examId!),
    enabled: !!examId && canManageGrades,
  })

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["classroom-exam-groups", classroomId],
    queryFn: () => listClassroomExamGroups(classroomId!),
    enabled: !!classroomId && canManageExams,
  })

  const startAttemptMutation = useMutation({
    mutationFn: () => startAttempt(examId!),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["exam-attempts", examId] })
      navigate(`/classrooms/${classroomId}/exams/${examId}/attempts/${data.attemptId}`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateExamMutation = useMutation({
    mutationFn: (payload: UpdateExamPayload) => updateExam(examId!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exam", examId] })
      await queryClient.invalidateQueries({ queryKey: ["classroom-exams", classroomId] })
      toast.success("Exam settings updated successfully")
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return {
    classroomId,
    examId,
    classroom,
    exam,
    attempts,
    allAttempts,
    groups: groups ?? [],
    isLoading:
      isLoadingExam ||
      isLoadingAttempts ||
      (canManageGrades && isLoadingAllAttempts) ||
      (canManageExams && isLoadingGroups),
    canManageExams,
    canManageGrades,
    startAttemptMutation,
    updateExamMutation,
    navigate,
  }
}

