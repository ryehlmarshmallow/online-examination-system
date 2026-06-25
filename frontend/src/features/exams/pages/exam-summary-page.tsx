import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import {
  AlertCircleIcon,
  PlayCircleIcon
} from "lucide-react"
import { format } from "date-fns"
import { VISIBILITY_LABELS } from "../lib/constants"
import { useExamDetail } from "../hooks/use-exam-detail"
import { ExamSettingsSheet } from "../components/exam-settings-sheet"

import { useDocumentTitle } from "@/shared/hooks/use-document-title"

export function ExamSummaryPage() {
  const {
    exam,
    attempts,
    startAttemptMutation,
    classroomId,
    examId,
    navigate,
    canManageExams,
    groups,
    updateExamMutation,
  } = useExamDetail()

  useDocumentTitle(exam ? exam.title : "Exam")

  if (!exam) return null

  const activeAttempt = attempts?.find((a) => a.status === "IN_PROGRESS")
  const completedAttempts =
    attempts?.filter((a) => a.status !== "IN_PROGRESS") ?? []

  const now = new Date()
  const isNotStarted = new Date(exam.startTime) > now
  const isExpired = exam.endTime ? new Date(exam.endTime) < now : false
  const maxAttemptsReached =
    exam.maxAttempts !== null && completedAttempts.length >= exam.maxAttempts

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "Infinite"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Settings</CardTitle>
          {canManageExams && (
            <ExamSettingsSheet
              exam={exam}
              groups={groups}
              onSave={async (payload) => {
                await updateExamMutation.mutateAsync(payload)
              }}
              isSaving={updateExamMutation.isPending}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{formatDuration(exam.duration)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Max Attempts:</span>
            <span className="font-medium">{exam.maxAttempts ?? "Unlimited"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Grade Visibility:</span>
            <span className="font-medium">
              {VISIBILITY_LABELS[exam.studentGradeVisibilityMode] ??
                exam.studentGradeVisibilityMode}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Answer Visibility:</span>
            <span className="font-medium">
              {VISIBILITY_LABELS[exam.studentAnswerVisibilityMode] ??
                exam.studentAnswerVisibilityMode}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Start Time:</span>
            <span className="font-medium">{format(new Date(exam.startTime), "PPp")}</span>
          </div>
          {exam.endTime && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">End Time:</span>
              <span className="font-medium">
                {format(new Date(exam.endTime), "PPp")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col justify-center p-6 text-center">
        {activeAttempt ? (
          <>
            <CardHeader>
              <CardTitle>Attempt in Progress</CardTitle>
              <CardDescription>
                You have an ongoing attempt for this exam.
              </CardDescription>
            </CardHeader>
            <Button
              className="mt-4"
              onClick={() =>
                navigate(
                  `/classrooms/${classroomId}/exams/${examId}/attempts/${activeAttempt.attemptId}`
                )
              }
            >
              Continue Attempt
            </Button>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Ready to Start?</CardTitle>
              <CardDescription>
                Make sure you have a stable internet connection.
              </CardDescription>
            </CardHeader>
            <Button
              className="mt-4"
              disabled={
                startAttemptMutation.isPending ||
                maxAttemptsReached ||
                isNotStarted ||
                isExpired
              }
              onClick={() => startAttemptMutation.mutate()}
            >
              {startAttemptMutation.isPending ? (
                "Starting..."
              ) : (
                <>
                  <PlayCircleIcon className="mr-2 h-5 w-5" /> Start Attempt
                </>
              )}
            </Button>
            {maxAttemptsReached && (
              <p className="mt-2 text-xs text-destructive flex items-center justify-center gap-1">
                <AlertCircleIcon className="h-3 w-3" /> Max attempts reached
              </p>
            )}
            {isNotStarted && (
              <p className="mt-2 text-xs text-destructive flex items-center justify-center gap-1">
                <AlertCircleIcon className="h-3 w-3" /> Exam has not started yet
              </p>
            )}
            {isExpired && (
              <p className="mt-2 text-xs text-destructive flex items-center justify-center gap-1">
                <AlertCircleIcon className="h-3 w-3" /> Exam has expired
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
