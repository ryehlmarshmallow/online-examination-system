import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"

export type QuestionStatus =
  | 'answered'
  | 'unanswered'
  | 'correct'
  | 'partial'
  | 'incorrect'
  | 'ungraded-answered'
  | 'ungraded-unanswered'

interface QuestionNavigatorProps {
  totalQuestions: number
  currentIndex: number
  onSelect: (index: number) => void
  questionStatuses: QuestionStatus[]
}

export function QuestionNavigator({
                                    totalQuestions,
                                    currentIndex,
                                    onSelect,
                                    questionStatuses
                                  }: QuestionNavigatorProps) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {Array.from({ length: totalQuestions }).map((_, i) => {
        const status = questionStatuses[i]
        const isSelected = currentIndex === i

        let variant: "default" | "outline" | "secondary"
        let statusClasses = ""

        switch (status) {
          case 'answered':
          case 'ungraded-answered':
            variant = "outline"
            statusClasses = "bg-primary/25 text-primary-800 border-primary-300 hover:bg-primary-200 dark:bg-primary-950/50 dark:text-primary dark:border-primary-800 dark:hover:bg-primary-950/70"
            break
          case 'correct':
            variant = "outline"
            statusClasses = "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/70"
            break
          case 'partial':
            variant = "outline"
            statusClasses = "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-950/70"
            break
          case 'incorrect':
            variant = "outline"
            statusClasses = "bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/70"
            break
          case 'unanswered':
          case 'ungraded-unanswered':
          default:
            variant = "secondary"
            break
        }

        return (
          <Button
            key={i}
            variant={variant}
            className={cn(
              "h-10 w-10 p-0 transition-all duration-200",
              statusClasses,
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            onClick={() => onSelect(i)}
          >
            {i + 1}
          </Button>
        )
      })}
    </div>
  )
}
