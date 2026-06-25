import type { ExamQuestion } from "../../types/exam"

interface EssayQuestionProps {
  question: ExamQuestion
  answers: Record<string, unknown>
  isReadOnly: boolean
  onChange: (questionId: string, data: { text: string }) => void
}

export function EssayQuestion({
                                question,
                                answers,
                                isReadOnly,
                                onChange
                              }: EssayQuestionProps) {
  const currentAnswer = answers[question.id!] as { text?: string } | undefined
  const textValue = currentAnswer?.text || ""

  return (
    <textarea
      className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:outline-none bg-background text-foreground"
      placeholder={isReadOnly ? "No answer provided" : "Type your answer here..."}
      value={textValue}
      onChange={(e) => onChange(question.id!, { text: e.target.value })}
      readOnly={isReadOnly}
      aria-label="Essay response"
    />
  )
}
