import {
  useEffect,
  useState,
  useMemo,
  useCallback
} from "react"
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
  saveAnswer,
  submitAttempt,
  heartbeat,
  getAttemptAnswers,
  manualGradeQuestion,
  clearManualGrade,
  uploadQuestionFiles,
  deleteQuestionFile,
  downloadSubmittedFile
} from "../api/exam-api"
import { listMyClassrooms } from "@/features/classrooms/api/classroom-api"
import { Button } from "@/shared/components/ui/button"
import { Spinner } from "@/shared/components/ui/spinner"
import { toast } from "sonner"
import { ExamTimer } from "../components/exam-timer"
import { useDocumentTitle } from "@/shared/hooks/use-document-title"
import { QuestionNavigator } from "../components/question-navigator"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SendIcon,
  CheckCircle2Icon,
  CloudSyncIcon,
  CloudOffIcon,
  PencilIcon,
  AlertCircleIcon,
  RotateCcwIcon,
} from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { MarkdownRenderer } from "@/shared/components/markdown-renderer"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import { useDebouncedCallback } from "@/shared/hooks/use-debounced-callback"
import type {
  ExamAttemptAnswer,
  ExamQuestion,
  FileDetails
} from "../types/exam"
import type {
  SingleChoiceRubric,
  MultipleChoiceRubric
} from "@/features/questions/types/question"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { useDisclosure } from "@/shared/hooks/use-disclosure"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Label } from "@/shared/components/ui/label"
import { Separator } from "@/shared/components/ui/separator"
import { SingleChoiceQuestion } from "../components/questions/single-choice-question"
import { MultipleChoiceQuestion } from "../components/questions/multiple-choice-question"
import { EssayQuestion } from "../components/questions/essay-question"
import { FileQuestion } from "../components/questions/file-question"

export function ExamAttemptPage() {
  const { classroomId, examId, attemptId } = useParams<{ classroomId: string; examId: string; attemptId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const confirmDialog = useDisclosure()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sequenceNumber, setSequenceNumber] = useState(() => Date.now())
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [isAnswersInitialized, setIsAnswersInitialized] = useState(false)
  const [syncingQuestions, setSyncingQuestions] = useState<Set<string>>(new Set())
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())

  useEffect(() => {
    const isUploading = syncingQuestions.size > 0;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [syncingQuestions]);

  const [prevAttemptId, setPrevAttemptId] = useState(attemptId)
  if (attemptId !== prevAttemptId) {
    setPrevAttemptId(attemptId)
    setIsAnswersInitialized(false)
    setAnswers({})
    setCurrentQuestionIndex(0)
  }

  const { data: classrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
  })

  const classroom = classrooms?.find((c) => c.id === classroomId)
  const canManageGrades = classroom?.canManageGrades ?? false

  const { data: exam, isLoading: isLoadingExam, error: errorExam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => getExamDetail(examId!),
    enabled: !!examId,
    retry: false,
  })

  const { data: attemptStatus } = useQuery({
    queryKey: ["attempt-status", attemptId],
    queryFn: () => heartbeat(attemptId!),
    refetchInterval: 60000,
    enabled: !!attemptId,
    retry: false,
  })

  const { data: initialAnswers, isLoading: isLoadingAnswers, error: errorAnswers } = useQuery({
    queryKey: ["attempt-answers", attemptId],
    queryFn: () => getAttemptAnswers(attemptId!),
    enabled: !!attemptId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  })

  const status = attemptStatus?.status ?? initialAnswers?.status
  const isReadOnly = status != null && status !== "IN_PROGRESS"

  useDocumentTitle(
    exam
      ? isReadOnly
        ? `Attempt: ${exam.title}`
        : `Taking: ${exam.title}`
      : "Exam Attempt"
  )

  // Flat list of questions for easier navigation
  const questions = useMemo(() => {
    return exam?.questionGroups?.flatMap(g => g.questions) ?? []
  }, [exam])

  const currentQuestion = questions[currentQuestionIndex]

  const promptClass = useMemo(() => {
    const len = currentQuestion?.prompt?.length ?? 0;
    if (len < 120) {
      return "text-2xl font-medium leading-relaxed";
    } else if (len < 280) {
      return "text-lg font-medium leading-relaxed text-foreground/95";
    } else {
      return "text-base font-normal leading-relaxed text-foreground/90";
    }
  }, [currentQuestion?.prompt]);

  const currentGroup = useMemo(() => {
    if (!exam?.questionGroups || !currentQuestion) return null
    return exam.questionGroups.find(g => g.questions.some(q => q.id === currentQuestion.id))
  }, [exam, currentQuestion])

  const groupQuestionSpan = useMemo(() => {
    if (!currentGroup || !questions.length) return null;
    const groupQuestions = currentGroup.questions;
    if (!groupQuestions.length) return null;

    const firstId = groupQuestions[0].id;
    const lastId = groupQuestions[groupQuestions.length - 1].id;

    const startIdx = questions.findIndex(q => q.id === firstId);
    const endIdx = questions.findIndex(q => q.id === lastId);

    if (startIdx === -1 || endIdx === -1) return null;

    return {
      start: startIdx + 1,
      end: endIdx + 1,
      isSingle: startIdx === endIdx
    };
  }, [currentGroup, questions]);

  const attemptAnswer = useMemo(() =>
      initialAnswers?.answers.find(a => a.questionId === currentQuestion?.id),
    [initialAnswers, currentQuestion]
  )
  const isRubricVisible = initialAnswers?.rubricVisible ?? false

  const getOptionStatus = useCallback((optIdParam: string | number) => {
    const optId = String(optIdParam);
    if (!isRubricVisible || !currentQuestion) return null;

    const rubric = (attemptAnswer?.rubric || currentQuestion.rubric) as SingleChoiceRubric | MultipleChoiceRubric;
    if (!rubric) return null;

    const selectedIds = (answers[currentQuestion.id!] as {
      selectedOptionIds?: string[],
      selectedOptionId?: string
    } | undefined);
    const isSelected = selectedIds?.selectedOptionIds?.includes(optId) || selectedIds?.selectedOptionId === optId;

    const optIdNum = Number(optId);

    if (currentQuestion.type === 'SINGLE_CHOICE' || (currentQuestion.type === 'MULTIPLE_CHOICE' && (rubric.graderType === 'DICHOTOMOUS' || rubric.graderType === 'HALVING'))) {
      const mcRubric = rubric as MultipleChoiceRubric;
      const scRubric = rubric as SingleChoiceRubric;
      const correctIds = (mcRubric.graderType !== 'WEIGHTED' ? mcRubric.correctOptionIds : []) || (scRubric.correctOptionId != null ? [scRubric.correctOptionId] : []);
      const isCorrect = correctIds.some(id => String(id) === optId);

      if (isSelected) {
        return isCorrect ? 'correct' : 'incorrect';
      } else if (isCorrect) {
        return 'missed';
      }
    } else if (currentQuestion.type === 'MULTIPLE_CHOICE' && rubric.graderType === 'WEIGHTED') {
      const weight = rubric.optionWeights?.[optId] ?? rubric.optionWeights?.[optIdNum] ?? 0;
      if (isSelected) {
        if (weight > 0) return 'weighted-positive-selected';
        if (weight < 0) return 'weighted-negative-selected';
        return 'weighted-neutral-selected';
      } else {
        if (weight > 0) return 'weighted-positive-unselected';
        if (weight < 0) return 'weighted-negative-unselected';
        return 'weighted-neutral-unselected';
      }
    }

    return null;
  }, [isRubricVisible, attemptAnswer, currentQuestion, answers]);


  // Initialize answers from initialAnswers only once
  if (initialAnswers && !isAnswersInitialized) {
    const mapped = initialAnswers.answers.reduce((acc: Record<string, unknown>, curr: ExamAttemptAnswer) => {
      const answerData = curr.answer as {
        type: string;
        selectedOptionIds?: number[];
        selectedOptionId?: number;
        answerText?: string;
        files?: FileDetails[]
      };
      if (answerData) {
        if (answerData.type === 'MULTIPLE_CHOICE') {
          acc[curr.questionId] = {
            selectedOptionIds: answerData.selectedOptionIds?.map(String) || [],
            selectedOptionId: (answerData.selectedOptionIds && answerData.selectedOptionIds.length > 0) ? String(answerData.selectedOptionIds[0]) : undefined
          };
        } else if (answerData.type === 'SINGLE_CHOICE') {
          acc[curr.questionId] = {
            selectedOptionId: answerData.selectedOptionId != null ? String(answerData.selectedOptionId) : undefined
          };
        } else if (answerData.type === 'ESSAY') {
          acc[curr.questionId] = { text: answerData.answerText || "" };
        } else if (answerData.type === 'FILE') {
          acc[curr.questionId] = { files: answerData.files || [] };
        } else {
          acc[curr.questionId] = answerData;
        }
      }
      return acc;
    }, {});
    setAnswers(mapped);
    setIsAnswersInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: ({ questionId, answerData, seq }: { questionId: string; answerData: unknown; seq: number }) =>
      saveAnswer(attemptId!, { questionId, answerData: answerData as Record<string, unknown>, sequenceNumber: seq }),
    onSuccess: (data) => {
      queryClient.setQueryData(["attempt-status", attemptId], data)
    },
    onError: async (err: Error) => {
      const errorMsg = getErrorMessage(err);
      if (errorMsg === "ATTEMPT_EXPIRED") {
        await queryClient.invalidateQueries({ queryKey: ["exam-attempts", examId] })
        toast.error("Time is up! Your attempt has been auto-submitted.")
        navigate(`/classrooms/${classroomId}/exams/${examId}`)
      }
    },
    onSettled: (_, __, variables) => {
      setSyncingQuestions(prev => {
        const next = new Set(prev)
        next.delete(variables.questionId)
        return next
      })
    }
  })

  const submitMutation = useMutation({
    mutationFn: () => submitAttempt(attemptId!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exam-attempts", examId] }),
        queryClient.invalidateQueries({ queryKey: ["attempt-status", attemptId] }),
        queryClient.invalidateQueries({ queryKey: ["attempt-answers", attemptId] })
      ])
      toast.success("Exam submitted successfully")
      navigate(`/classrooms/${classroomId}/exams/${examId}`)
    },
  })

  const gradeMutation = useMutation({
    mutationFn: ({ questionId, score }: { questionId: string; score: number }) =>
      manualGradeQuestion(attemptId!, questionId, score),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attempt-answers", attemptId] })
      toast.success("Grade updated successfully")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const clearGradeMutation = useMutation({
    mutationFn: (questionId: string) => clearManualGrade(attemptId!, questionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attempt-answers", attemptId] })
      toast.success("Manual override cleared")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const debouncedSave = useDebouncedCallback((...args: unknown[]) => {
    const [questionId, answerData, seq] = args as [string, unknown, number]
    saveMutation.mutate({ questionId, answerData, seq })
  }, 500)

  const uploadMutation = useMutation({
    mutationFn: ({ questionId, files }: { questionId: string; files: FileList }) =>
      uploadQuestionFiles(attemptId!, questionId, files),
    onSuccess: (data, variables) => {
      setAnswers(prev => ({
        ...prev,
        [variables.questionId]: { files: data.files }
      }))
      toast.success("Files uploaded successfully")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: (_, __, variables) => {
      setSyncingQuestions(prev => {
        const next = new Set(prev)
        next.delete(variables.questionId)
        return next
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: ({ questionId, fileId }: { questionId: string; fileId: string }) =>
      deleteQuestionFile(attemptId!, questionId, fileId),
    onSuccess: (data, variables) => {
      setAnswers(prev => ({
        ...prev,
        [variables.questionId]: { files: data.files }
      }))
      toast.success("File deleted successfully")
    },
    onError: (err) => toast.error(getErrorMessage(err)),
    onSettled: (_, __, variables) => {
      setDeletingFiles(prev => {
        const next = new Set(prev)
        next.delete(variables.fileId)
        return next
      })
    }
  })

  const handleAnswerChange = useCallback((questionId: string, data: unknown) => {
    if (isReadOnly) return;

    setAnswers(prev => ({ ...prev, [questionId]: data }))
    setSyncingQuestions(prev => new Set(prev).add(questionId))

    // Find the question to know its type
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    // Transform frontend internal state to backend polymorphic DTO
    let answerData: Record<string, unknown> = { type: 'UNKNOWN' }

    if (question.type === 'SINGLE_CHOICE') {
      const d = data as { selectedOptionId?: string }
      answerData = {
        type: 'SINGLE_CHOICE',
        selectedOptionId: d.selectedOptionId ? Number(d.selectedOptionId) : null
      }
    } else if (question.type === 'MULTIPLE_CHOICE') {
      const d = data as { selectedOptionIds?: string[] }
      const ids = d.selectedOptionIds ? d.selectedOptionIds.map(Number) : []
      answerData = {
        type: 'MULTIPLE_CHOICE',
        selectedOptionIds: ids
      }
    } else if (question.type === 'ESSAY') {
      const d = data as { text: string }
      answerData = {
        type: 'ESSAY',
        answerText: d.text || ""
      }
    } else if (question.type === 'FILE') {
      const d = data as { files: FileDetails[] }
      answerData = {
        type: 'FILE',
        files: d.files || []
      }
    }

    setSequenceNumber(prev => {
      const next = prev + 1
      debouncedSave(questionId, answerData, next)
      return next
    })
  }, [debouncedSave, questions, isReadOnly])

  const handleFileUpload = useCallback((questionId: string, files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) return

    setSyncingQuestions(prev => new Set(prev).add(questionId))
    uploadMutation.mutate({ questionId, files })
  }, [uploadMutation, isReadOnly])

  const handleDeleteFile = useCallback((questionId: string, fileId: string) => {
    if (isReadOnly) return

    setDeletingFiles(prev => new Set(prev).add(fileId))
    deleteMutation.mutate({ questionId, fileId })
  }, [deleteMutation, isReadOnly])

  const handleDownloadFile = useCallback(async (fileId: string, originalFilename: string) => {
    try {
      const blob = await downloadSubmittedFile(attemptId!, fileId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = originalFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }, [attemptId])

  // Just to suppress lint for sequenceNumber since we use it inside setSequenceNumber callback above
  console.debug('Sequence number at', sequenceNumber);

  const answeredIndices = useMemo(() => new Set(
    questions.map((q, i) => answers[q.id!] !== undefined ? i : -1).filter(i => i !== -1)
  ), [questions, answers])

  const questionStatuses = useMemo(() => {
    return questions.map((q, i) => {
      const isAnswered = answeredIndices.has(i)
      if (!isReadOnly) {
        return isAnswered ? 'answered' : 'unanswered'
      }

      const ans = initialAnswers?.answers.find(a => a.questionId === q.id)
      if (!ans || !ans.graded) {
        return isAnswered ? 'ungraded-answered' : 'ungraded-unanswered'
      }

      const score = ans.score ?? 0
      if (score >= q.points) return 'correct'
      if (score > 0) return 'partial'
      return 'incorrect'
    })
  }, [questions, answeredIndices, isReadOnly, initialAnswers])

  if (isLoadingExam || isLoadingAnswers) return <div className="flex h-screen items-center justify-center"><Spinner />
  </div>

  if (errorExam || errorAnswers) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <div className="flex flex-col items-center gap-2 max-w-md">
          <AlertCircleIcon className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">
            {errorAnswers ? "Attempt Not Found" : "Exam Not Found"}
          </h1>
          <p className="text-muted-foreground">
            {getErrorMessage(errorAnswers || errorExam)}
          </p>
        </div>
        <Button
          onClick={() => navigate(classroomId && examId ? `/classrooms/${classroomId}/exams/${examId}` : "/dashboard")}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold truncate max-w-75">{exam?.title}</h2>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {initialAnswers?.gradeVisible && (
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>Score: {initialAnswers.answers.reduce((acc, a) => acc + (a.score ?? 0), 0).toFixed(3)} / {questions.reduce((acc, q) => acc + q.points, 0).toFixed(3)}</span>
                {initialAnswers.answers.some(a => !a.graded) && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase font-bold tracking-wider">
                    Provisional
                  </Badge>
                )}
              </div>
              {initialAnswers.gradeHiddenReason && (
                <span className="text-[10px] text-muted-foreground">{initialAnswers.gradeHiddenReason}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium">
            {isReadOnly ? (
              <span className="flex items-center gap-1 text-muted-foreground"><CheckCircle2Icon className="h-4 w-4" /> View Only</span>
            ) : isOffline ? (
              <span className="flex items-center gap-1 text-destructive"><CloudOffIcon
                className="h-4 w-4" /> Offline</span>
            ) : syncingQuestions.size > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground"><CloudSyncIcon
                className="h-4 w-4 animate-spin" /> Syncing...</span>
            ) : (
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2Icon className="h-4 w-4" /> All changes saved</span>
            )}
          </div>
          {attemptStatus && !isReadOnly && (
            <ExamTimer
              deadline={attemptStatus.calculatedDeadline}
              serverTime={attemptStatus.serverTime}
              onExpire={() => submitMutation.mutate()}
              examTitle={exam?.title}
            />
          )}
          {!isReadOnly && (
            <Button size="sm" onClick={confirmDialog.onOpen}>
              <SendIcon className="mr-2 h-4 w-4" /> Submit
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-12 [scrollbar-gutter:stable]">
          <div className="max-w-3xl mx-auto space-y-8">
            {currentQuestion && (
              <div className="space-y-6" key={currentQuestion.id}>
                {currentGroup?.isGroup && currentGroup.prompt && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                    <div className="px-6 py-3 border-b border-primary/10 bg-primary/10 flex items-center gap-2">
                      <span className="text-sm font-bold text-primary uppercase tracking-wider">
                        Question Group of Question{groupQuestionSpan?.isSingle ? "" : "s"} {groupQuestionSpan?.start}{groupQuestionSpan?.isSingle ? "" : ` - ${groupQuestionSpan?.end}`}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <MarkdownRenderer content={currentGroup.prompt} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div
                    className="text-sm font-semibold text-primary uppercase tracking-wider">Question {currentQuestionIndex + 1}</div>
                  <div className={promptClass}>
                    <MarkdownRenderer content={currentQuestion.prompt} />
                  </div>
                </div>

                <div className="pt-4">
                  {currentQuestion.type === 'SINGLE_CHOICE' && (
                    <SingleChoiceQuestion
                      question={currentQuestion}
                      answers={answers}
                      isReadOnly={isReadOnly}
                      getOptionStatus={getOptionStatus}
                      onChange={handleAnswerChange}
                    />
                  )}

                  {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                    <MultipleChoiceQuestion
                      question={currentQuestion}
                      answers={answers}
                      isReadOnly={isReadOnly}
                      getOptionStatus={getOptionStatus}
                      attemptAnswer={attemptAnswer}
                      isRubricVisible={isRubricVisible}
                      onChange={handleAnswerChange}
                    />
                  )}

                  {currentQuestion.type === 'ESSAY' && (
                    <EssayQuestion
                      question={currentQuestion}
                      answers={answers}
                      isReadOnly={isReadOnly}
                      onChange={handleAnswerChange}
                    />
                  )}

                  {currentQuestion.type === 'FILE' && (
                    <FileQuestion
                      question={currentQuestion}
                      answers={answers}
                      isReadOnly={isReadOnly}
                      deletingFiles={deletingFiles}
                      isUploading={uploadMutation.isPending}
                      onFileUpload={handleFileUpload}
                      onDeleteFile={handleDeleteFile}
                      onDownloadFile={handleDownloadFile}
                    />
                  )}
                </div>

                {isReadOnly && (
                  <QuestionGradingSection
                    key={`${currentQuestion.id}-${attemptAnswer?.score ?? 'null'}-${attemptAnswer?.overridden ?? 'false'}`}
                    currentQuestion={currentQuestion}
                    attemptAnswer={attemptAnswer}
                    canManageGrades={canManageGrades}
                    onGrade={(score) => gradeMutation.mutate({ questionId: currentQuestion.id!, score })}
                    onClearGrade={() => clearGradeMutation.mutate(currentQuestion.id!)}
                    isPending={gradeMutation.isPending || clearGradeMutation.isPending}
                  />
                )}
              </div>
            )}
          </div>
        </main>

        <aside className="hidden md:block w-80 border-l bg-card p-6 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-card-foreground">Navigator</h3>
            <QuestionNavigator
              totalQuestions={questions.length}
              currentIndex={currentQuestionIndex}
              onSelect={setCurrentQuestionIndex}
              questionStatuses={questionStatuses}
            />

            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Answered</span>
                <span className="font-medium text-card-foreground">{answeredIndices.size} / {questions.length}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(answeredIndices.size / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="px-6 py-4 border-t bg-card flex items-center justify-between shrink-0">
        <Button
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          <ChevronLeftIcon className="mr-2 h-4 w-4" /> Previous
        </Button>

        <div className="md:hidden text-sm font-medium text-card-foreground">
          {currentQuestionIndex + 1} / {questions.length}
        </div>

        {isLastQuestion ? (
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={confirmDialog.onOpen}
            disabled={submitMutation.isPending || isReadOnly || syncingQuestions.size > 0}
          >
            Finish Exam <SendIcon className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </footer>

      <Dialog open={confirmDialog.isOpen} onOpenChange={confirmDialog.setIsOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam attempt? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={confirmDialog.onClose} disabled={submitMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                submitMutation.mutate(undefined, {
                  onSuccess: () => {
                    confirmDialog.onClose()
                  }
                })
              }}
              disabled={submitMutation.isPending || syncingQuestions.size > 0}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface QuestionGradingSectionProps {
  currentQuestion: ExamQuestion
  attemptAnswer?: ExamAttemptAnswer
  canManageGrades: boolean
  onGrade: (score: number) => void
  onClearGrade: () => void
  isPending: boolean
}

function QuestionGradingSection({
                                  currentQuestion,
                                  attemptAnswer,
                                  canManageGrades,
                                  onGrade,
                                  onClearGrade,
                                  isPending
                                }: QuestionGradingSectionProps) {
  const [gradeInput, setGradeInput] = useState(attemptAnswer?.score?.toString() ?? "")
  const isOverridden = attemptAnswer?.overridden ?? false
  const isGraded = attemptAnswer?.graded ?? false

  return (
    <div className="mt-12 space-y-6">
      <Separator />
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-muted/30 p-6 rounded-xl border border-dashed">
        <div className="space-y-1.5">
          <h4 className="font-bold flex items-center gap-2 text-lg">
            Grading Information
            {isOverridden && (
              <Badge variant="outline" className="gap-1 font-normal text-xs text-muted-foreground bg-background">
                <PencilIcon className="h-3 w-3" /> Manually Overridden
              </Badge>
            )}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isGraded
              ? "This response has been graded and the score is finalized."
              : "Awaiting manual grading from a staff member."}
          </p>
          {isOverridden && canManageGrades && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary transition-colors"
              onClick={onClearGrade}
              disabled={isPending}
            >
              <RotateCcwIcon className="h-3 w-3 mr-1" /> Clear manual override and regrade
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-2">
            <Label
              className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-widest"
            >
              Points Awarded
            </Label>
            <div className="flex items-center gap-3">
              {canManageGrades ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      id={`points-awarded-${currentQuestion.id}`}
                      aria-label="Points Awarded"
                      className="w-28 text-right tabular-nums h-10 font-bold pr-8"
                      type="number"
                      step="0.001"
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                    />
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">PTS
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-10 px-4"
                    disabled={
                      isPending ||
                      gradeInput === "" ||
                      (gradeInput === (attemptAnswer?.score?.toString() ?? "") && isOverridden)
                    }
                    onClick={() => onGrade(Number(gradeInput))}
                  >
                    {isPending ? "..." : "Apply"}
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "text-3xl font-black tabular-nums tracking-tighter",
                  !isGraded ? "text-muted-foreground" :
                    (attemptAnswer?.score ?? 0) >= currentQuestion.points ? "text-green-600" :
                      (attemptAnswer?.score ?? 0) > 0 ? "text-yellow-600" : "text-red-600"
                )}>
                  {isGraded && attemptAnswer?.score != null ? attemptAnswer.score.toFixed(3) : "—"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-muted-foreground font-bold text-lg">/ {currentQuestion.points.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

