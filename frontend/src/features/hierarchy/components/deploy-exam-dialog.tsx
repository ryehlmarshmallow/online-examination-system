import {
  type SubmitEvent,
  useMemo,
  useState
} from "react"
import {
  useQuery,
  useMutation
} from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { listMyClassrooms } from "@/features/classrooms/api/classroom-api"
import { createExam } from "@/features/exams/api/exam-api"
import {
  generateRandomExamFromPool,
  getPoolDetail
} from "@/features/questionsets/api/questionset-api"
import { getErrorMessage } from "@/shared/lib/get-error-message"
import { Spinner } from "@/shared/components/ui/spinner"
import {
  Field,
  FieldLabel
} from "@/shared/components/ui/field"
import { DatePickerTime } from "@/features/exams/components/date-picker-time"
import { DurationPicker } from "@/features/exams/components/duration-picker"
import { ScrollArea } from "@/shared/components/ui/scroll-area"

interface DeployExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceId: string
  sourceType: "TEMPLATE" | "POOL"
  sourceName: string
}

export function DeployExamDialog({
                                   open,
                                   onOpenChange,
                                   sourceId,
                                   sourceType,
                                   sourceName,
                                 }: DeployExamDialogProps) {
  const navigate = useNavigate()
  const [classroomId, setClassroomId] = useState<string>("")
  const [examTitle, setExamTitle] = useState("")
  const [startTime, setStartTime] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<Date | undefined>(undefined)
  const [hasEndTime, setHasEndTime] = useState(false)

  // Template-specific settings
  const [duration, setDuration] = useState<number | null>(null)
  const [maxAttempts, setMaxAttempts] = useState<number | null>(1)

  // Pool-specific settings
  const [isRandom, setIsRandom] = useState(false)
  const [randomCount, setRandomCount] = useState<string>("5")
  const [availableCount, setAvailableCount] = useState<number>(0)

  // Fetch classrooms
  const { data: classrooms = [], isLoading: isLoadingClassrooms } = useQuery({
    queryKey: ["my-classrooms"],
    queryFn: listMyClassrooms,
    enabled: open,
  })

  // Filter classrooms where user is OWNER or STAFF
  const manageAllClassrooms = useMemo(() => {
    return classrooms.filter((c) => c.role === "OWNER" || c.role === "STAFF")
  }, [classrooms])

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevSourceName, setPrevSourceName] = useState(sourceName)

  if (open !== prevOpen || sourceName !== prevSourceName) {
    setPrevOpen(open)
    setPrevSourceName(sourceName)
    if (open) {
      setExamTitle(sourceName)
      const now = new Date()
      now.setSeconds(0, 0)
      setStartTime(now)
      setEndTime(undefined)
      setHasEndTime(false)
      setDuration(null)
      setMaxAttempts(1)
      setIsRandom(false)
      setRandomCount("5")
      if (manageAllClassrooms.length > 0) {
        setClassroomId(manageAllClassrooms[0].id)
      }
    }
  }

  if (open && manageAllClassrooms.length > 0 && !classroomId) {
    setClassroomId(manageAllClassrooms[0].id)
  }

  // Fetch pool detail if source is POOL to get total available question groups
  const { data: poolDetail } = useQuery({
    queryKey: ["questionset-detail", sourceId],
    queryFn: () => getPoolDetail(sourceId),
    enabled: open && sourceType === "POOL",
  })

  const [prevPoolDetail, setPrevPoolDetail] = useState(poolDetail)
  if (poolDetail !== prevPoolDetail) {
    setPrevPoolDetail(poolDetail)
    if (poolDetail?.questionGroups) {
      setAvailableCount(poolDetail.questionGroups.length)
      if (poolDetail.questionGroups.length < 5) {
        setRandomCount(poolDetail.questionGroups.length.toString())
      }
    }
  }

  // Validation similar to settings sheet
  const isEndTimeValid = !hasEndTime || (endTime !== undefined && startTime !== undefined && endTime > startTime)
  const isAttemptsValid = maxAttempts === null || (Number.isInteger(maxAttempts) && maxAttempts >= 1)
  const isRandomCountValid =
    sourceType !== "POOL" ||
    !isRandom ||
    (() => {
      const count = parseInt(randomCount, 10)
      return !isNaN(count) && count >= 1 && count <= availableCount
    })()

  const isValid = examTitle.trim().length > 0 && classroomId !== "" && isEndTimeValid && isAttemptsValid && isRandomCountValid

  // Deploy Mutation
  const deployMutation = useMutation({
    mutationFn: async () => {
      const formattedStartTime = startTime ? startTime.toISOString() : new Date().toISOString()
      const formattedEndTime = hasEndTime && endTime ? endTime.toISOString() : null

      if (sourceType === "POOL") {
        const count = isRandom ? parseInt(randomCount, 10) || 5 : 0
        return generateRandomExamFromPool(sourceId, {
          classroomId,
          examTitle: examTitle.trim(),
          questionGroupCount: count,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          duration,
          maxAttempts,
        })
      } else {
        return createExam({
          templateId: sourceId,
          title: examTitle.trim(),
          classroomId,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          duration,
          maxAttempts,
        })
      }
    },
    onSuccess: () => {
      toast.success("Exam deployed successfully!")
      onOpenChange(false)
      navigate(`/classrooms/${classroomId}`)
    },
    onError: (err) => {
      toast.error(`Deployment failed: ${getErrorMessage(err)}`)
    },
  })

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault()
    if (!isValid) return
    deployMutation.mutate()
  }

  const handleMaxAttemptsToggle = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setMaxAttempts(null)
    } else {
      setMaxAttempts(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger className="hidden" />
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle>Deploy as Exam</DialogTitle>
          <DialogDescription>
            Schedule and configure an active exam for students in a classroom.
          </DialogDescription>
        </DialogHeader>

        {isLoadingClassrooms ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : manageAllClassrooms.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            You do not own or manage any classrooms to deploy exams.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 pr-1">
              <div className="space-y-5 py-2 pr-3">
                {/* Target Classroom */}
                <Field>
                  <FieldLabel>Target Classroom</FieldLabel>
                  <Select value={classroomId} onValueChange={setClassroomId}>
                    <SelectTrigger id="classroom" aria-label="Target Classroom">
                      <SelectValue placeholder="Select a classroom" />
                    </SelectTrigger>
                    <SelectContent>
                      {manageAllClassrooms.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Exam Title */}
                <Field>
                  <FieldLabel>Exam Title</FieldLabel>
                  <Input
                    id="title"
                    aria-label="Exam Title"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="e.g. Midterm Examination"
                  />
                </Field>

                {/* Randomization Selection (Pool Only) */}
                {sourceType === "POOL" && availableCount > 0 && (
                  <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="random"
                        aria-label="Pull a random subset of question groups"
                        checked={isRandom}
                        onCheckedChange={(val) => setIsRandom(!!val)}
                      />
                      <label className="text-sm font-semibold cursor-pointer">
                        Pull a random subset of question groups
                      </label>
                    </div>
                    {isRandom && (
                      <Field>
                        <FieldLabel>
                          Number of Question Groups to pull (max: {availableCount})
                        </FieldLabel>
                        <Input
                          id="random-count"
                          aria-label="Number of Question Groups to pull"
                          type="number"
                          min={1}
                          max={availableCount}
                          required
                          value={randomCount}
                          onChange={(e) => setRandomCount(e.target.value)}
                        />
                      </Field>
                    )}
                  </div>
                )}

                {/* Start Time */}
                <DatePickerTime
                  label="Start"
                  value={startTime}
                  onChange={(date) => date && setStartTime(date)}
                />

                {/* End Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="enable-end-time"
                      aria-label="Enable End Time limit"
                      checked={hasEndTime}
                      onCheckedChange={(checked) => setHasEndTime(checked === true)}
                    />
                    <label
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Enable End Time limit
                    </label>
                  </div>
                  {hasEndTime && (
                    <div className="space-y-1">
                      <DatePickerTime
                        label="End"
                        value={endTime}
                        onChange={setEndTime}
                      />
                      {!isEndTimeValid && (
                        <p className="text-xs text-destructive mt-1">
                          {endTime === undefined
                            ? "Please select an end date and time."
                            : "End time must be after the start time."}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Duration */}
                <Field>
                  <FieldLabel>Duration</FieldLabel>
                  <DurationPicker value={duration} onChange={setDuration} />
                </Field>

                {/* Max Attempts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="attempts-unlimited"
                      aria-label="Unlimited Attempts"
                      checked={maxAttempts === null}
                      onCheckedChange={handleMaxAttemptsToggle}
                    />
                    <label
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Unlimited Attempts
                    </label>
                  </div>
                  {maxAttempts !== null && (
                    <Field>
                      <FieldLabel>Maximum Attempts</FieldLabel>
                      <Input
                        id="exam-attempts"
                        aria-label="Maximum Attempts"
                        type="number"
                        min="1"
                        value={maxAttempts ?? 1}
                        onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 1)}
                      />
                      {!isAttemptsValid && (
                        <p className="text-xs text-destructive mt-1">
                          Maximum attempts must be a positive integer.
                        </p>
                      )}
                    </Field>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="bg-transparent border-t-0 px-0 pb-0 pt-4 m-0 shrink-0">
              <Button
                type="button"
                variant="outline"
                disabled={deployMutation.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={deployMutation.isPending || !isValid}>
                {deployMutation.isPending ? "Deploying..." : "Deploy"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
