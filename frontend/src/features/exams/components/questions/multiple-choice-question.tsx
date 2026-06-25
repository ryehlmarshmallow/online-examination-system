import { cn } from "@/shared/lib/utils"
import { MarkdownRenderer } from "@/shared/components/markdown-renderer"
import { CheckIcon } from "lucide-react"
import {
  Field,
  FieldLabel,
  FieldContent
} from "@/shared/components/ui/field"
import type {
  ExamQuestion,
  ExamAttemptAnswer
} from "../../types/exam"
import type {
  MultipleChoiceContent,
  MultipleChoiceRubric
} from "@/features/questions/types/question"
import {
  statusStyles,
  StatusIndicator
} from "./status-indicator"

interface MultipleChoiceQuestionProps {
  question: ExamQuestion
  answers: Record<string, unknown>
  isReadOnly: boolean
  getOptionStatus: (optId: string | number) => string | null
  attemptAnswer?: ExamAttemptAnswer
  isRubricVisible: boolean
  onChange: (questionId: string, data: { selectedOptionIds: string[] }) => void
}

export function MultipleChoiceQuestion({
                                         question,
                                         answers,
                                         isReadOnly,
                                         getOptionStatus,
                                         attemptAnswer,
                                         isRubricVisible,
                                         onChange
                                       }: MultipleChoiceQuestionProps) {
  const content = question.content as MultipleChoiceContent
  const currentAnswer = answers[question.id!] as { selectedOptionIds?: string[] } | undefined
  const selectedOptionIds = currentAnswer?.selectedOptionIds || []

  return (
    <div className="space-y-3">
      {content.options.map((opt) => {
        const isSelected = selectedOptionIds.includes(String(opt.id))
        const status = getOptionStatus(opt.id)
        const rubric = (attemptAnswer?.rubric || question.rubric) as MultipleChoiceRubric | undefined
        const isWeighted = isRubricVisible && rubric?.graderType === 'WEIGHTED'
        const weight = isWeighted ? (rubric.optionWeights?.[opt.id] ?? rubric.optionWeights?.[Number(opt.id)] ?? 0) : null

        return (
          <Field
            key={opt.id}
            orientation="horizontal"
            className={cn(
              "flex items-center justify-between p-4 border rounded-lg transition-colors",
              !isReadOnly && "cursor-pointer hover:bg-accent",
              isSelected ? "border-primary bg-primary/5" : "",
              status && statusStyles[status]
            )}
            onClick={() => {
              if (isReadOnly) return
              const nextIds = isSelected
                ? selectedOptionIds.filter((id) => id !== String(opt.id))
                : [...selectedOptionIds, String(opt.id)]
              onChange(question.id!, { selectedOptionIds: nextIds })
            }}
          >
            <div className="flex items-center flex-1 mr-4">
              <div className={cn(
                "h-5 w-5 rounded border mr-3 flex items-center justify-center shrink-0 transition-colors",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
              )}>
                {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
              </div>
              <FieldContent className="text-left flex-1 w-full">
                <FieldLabel className="cursor-pointer text-sm font-medium leading-snug w-full block">
                  <MarkdownRenderer content={opt.text} className="w-full" />
                </FieldLabel>
              </FieldContent>
            </div>
            <StatusIndicator status={status} weight={weight} isSelected={isSelected} />
          </Field>
        )
      })}
    </div>
  )
}
