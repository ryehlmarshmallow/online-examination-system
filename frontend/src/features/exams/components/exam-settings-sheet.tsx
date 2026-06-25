import {
  type SubmitEvent,
  useMemo,
  useState
} from "react"
import { EditIcon } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import {
  Field,
  FieldLabel
} from "@/shared/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { VISIBILITY_OPTIONS } from "../lib/constants"
import { DatePickerTime } from "./date-picker-time"
import { DurationPicker } from "./duration-picker"
import type {
  Exam,
  ExamGroup,
  StudentGradeVisibilityMode,
  StudentAnswerVisibilityMode,
  UpdateExamPayload,
} from "../types/exam"

interface ExamSettingsSheetProps {
  exam: Exam
  groups: ExamGroup[]
  onSave: (payload: UpdateExamPayload) => Promise<void>
  isSaving: boolean
}

export function ExamSettingsSheet({ exam, groups, onSave, isSaving }: ExamSettingsSheetProps) {
  const [open, setOpen] = useState(false)

  // Form State
  const [title, setTitle] = useState(exam.title)
  const [startTime, setStartTime] = useState<Date>(new Date(exam.startTime))
  const [hasEndTime, setHasEndTime] = useState(exam.endTime !== null)
  const [endTime, setEndTime] = useState<Date | undefined>(
    exam.endTime ? new Date(exam.endTime) : undefined
  )
  const [duration, setDuration] = useState<number | null>(exam.duration)
  const [maxAttempts, setMaxAttempts] = useState<number | null>(exam.maxAttempts)
  const [groupId, setGroupId] = useState<string | null>(exam.groupId)
  const [studentGradeVisibilityMode, setStudentGradeVisibilityMode] = useState<StudentGradeVisibilityMode>(
    exam.studentGradeVisibilityMode
  )
  const [studentAnswerVisibilityMode, setStudentAnswerVisibilityMode] = useState<StudentAnswerVisibilityMode>(
    exam.studentAnswerVisibilityMode
  )

  // Lock start time if the exam has already started
  const isStarted = useMemo(() => {
    return new Date(exam.startTime) <= new Date()
  }, [exam.startTime])

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevExam, setPrevExam] = useState(exam)

  if (open !== prevOpen || exam !== prevExam) {
    setPrevOpen(open)
    setPrevExam(exam)
    if (open) {
      setTitle(exam.title)
      setStartTime(new Date(exam.startTime))
      setHasEndTime(exam.endTime !== null)
      setEndTime(exam.endTime ? new Date(exam.endTime) : undefined)
      setDuration(exam.duration)
      setMaxAttempts(exam.maxAttempts)
      setGroupId(exam.groupId)
      setStudentGradeVisibilityMode(exam.studentGradeVisibilityMode)
      setStudentAnswerVisibilityMode(exam.studentAnswerVisibilityMode)
    }
  }

  // Inline Validation
  const isTitleValid = title.trim().length > 0
  const isEndTimeValid = !hasEndTime || (endTime !== undefined && endTime > startTime)
  const isAttemptsValid = maxAttempts === null || (Number.isInteger(maxAttempts) && maxAttempts >= 1)

  const isValid = isTitleValid && isEndTimeValid && isAttemptsValid

  const handleSave = async (e: SubmitEvent) => {
    e.preventDefault()
    if (!isValid) return

    const payload: UpdateExamPayload = {
      title: title.trim(),
      startTime: startTime.toISOString(),
      endTime: hasEndTime && endTime ? endTime.toISOString() : null,
      duration,
      maxAttempts,
      groupId,
      studentGradeVisibilityMode,
      studentAnswerVisibilityMode,
    }

    try {
      await onSave(payload)
      setOpen(false)
    } catch {
      // Error handled by mutation toast
    }
  }

  const handleMaxAttemptsToggle = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setMaxAttempts(null)
    } else {
      setMaxAttempts(1)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <EditIcon className="mr-2 h-4 w-4" /> Edit Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="p-6 border-b shrink-0">
          <SheetTitle>Exam Settings</SheetTitle>
          <SheetDescription>
            Update the metadata and access controls for this exam.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Exam Title */}
              <Field>
                <FieldLabel>Exam Title</FieldLabel>
                <Input
                  id="exam-title"
                  aria-label="Exam Title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter exam title"
                />
                {!isTitleValid && (
                  <p className="text-xs text-destructive mt-1">Title cannot be empty</p>
                )}
              </Field>

              {/* Start Time */}
              <DatePickerTime
                label="Start"
                value={startTime}
                onChange={(date) => date && setStartTime(date)}
                disabled={isStarted}
              />
              {isStarted && (
                <p className="text-xs text-muted-foreground mt-1">
                  Start time cannot be edited because the exam has already started.
                </p>
              )}

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
                      value={maxAttempts}
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

              {/* Group */}
              <Field>
                <FieldLabel>Group</FieldLabel>
                <Select
                  value={groupId ?? "none"}
                  onValueChange={(val) => setGroupId(val === "none" ? null : val)}
                  disabled={groups.length === 0}
                >
                  <SelectTrigger id="exam-group" aria-label="Group"
                                 className="w-full **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="truncate block max-w-[280px]">No Group</span>
                    </SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        <span className="truncate block max-w-[280px]">{group.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {groups.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    No groups available in classroom.
                  </p>
                )}
              </Field>

              {/* Grade Visibility Mode */}
              <Field>
                <FieldLabel>Grade Visibility</FieldLabel>
                <Select
                  value={studentGradeVisibilityMode}
                  onValueChange={(val) => setStudentGradeVisibilityMode(val as StudentGradeVisibilityMode)}
                >
                  <SelectTrigger id="grade-visibility" aria-label="Grade Visibility" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Answer Visibility Mode */}
              <Field>
                <FieldLabel>Answer Visibility</FieldLabel>
                <Select
                  value={studentAnswerVisibilityMode}
                  onValueChange={(val) => setStudentAnswerVisibilityMode(val as StudentAnswerVisibilityMode)}
                >
                  <SelectTrigger id="answer-visibility" aria-label="Answer Visibility" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </ScrollArea>

          <SheetFooter className="p-6 border-t shrink-0 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
