import { cn } from "@/shared/lib/utils"
import { MarkdownRenderer } from "@/shared/components/markdown-renderer"
import {
  Field,
  FieldLabel,
  FieldContent
} from "@/shared/components/ui/field"
import type { ExamQuestion } from "../../types/exam"
import type { SingleChoiceContent } from "@/features/questions/types/question"
import {
  statusStyles,
  StatusIndicator
} from "./status-indicator"

interface SingleChoiceQuestionProps {
  question: ExamQuestion
  answers: Record<string, unknown>
  isReadOnly: boolean
  getOptionStatus: (optId: string | number) => string | null
  onChange: (questionId: string, data: { selectedOptionId: string }) => void
}

export function SingleChoiceQuestion({
                                       question,
                                       answers,
                                       isReadOnly,
                                       getOptionStatus,
                                       onChange
                                     }: SingleChoiceQuestionProps) {
  const content = question.content as SingleChoiceContent
  const currentAnswer = answers[question.id!] as { selectedOptionId?: string } | undefined
  const selectedOptionId = currentAnswer?.selectedOptionId

  return (
    <div className="space-y-3">
      {content.options.map((opt) => {
        const status = getOptionStatus(opt.id)
        const isSelected = selectedOptionId === String(opt.id)
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
            onClick={() => !isReadOnly && onChange(question.id!, { selectedOptionId: String(opt.id) })}
          >
            <div className="flex items-center flex-1 mr-4">
              <div className={cn(
                "h-5 w-5 rounded-full border mr-3 flex items-center justify-center shrink-0",
                isSelected ? "border-primary" : "border-muted-foreground"
              )}>
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              <FieldContent className="text-left flex-1 w-full">
                <FieldLabel className="cursor-pointer text-sm font-medium leading-snug w-full block">
                  <MarkdownRenderer content={opt.text} className="w-full" />
                </FieldLabel>
              </FieldContent>
            </div>
            <StatusIndicator status={status} isSelected={isSelected} />
          </Field>
        )
      })}
    </div>
  )
}
