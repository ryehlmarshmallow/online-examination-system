/* eslint-disable react-refresh/only-export-components */
import {
  CircleCheckIcon,
  CircleXIcon,
  AlertCircleIcon
} from "lucide-react"
import { cn } from "@/shared/lib/utils"

export const statusStyles: Record<string, string> = {
  'correct': "border-green-600 bg-green-50 dark:bg-green-950/20",
  'incorrect': "border-red-600 bg-red-50 dark:bg-red-950/20",
  'missed': "border-green-600/50 border-dashed bg-green-50/30 dark:bg-green-950/10",
  'weighted-positive-selected': "border-green-600 bg-green-50 dark:bg-green-950/20",
  'weighted-negative-selected': "border-red-600 bg-red-50 dark:bg-red-950/20",
  'weighted-neutral-selected': "border-primary bg-primary/5",
  'weighted-positive-unselected': "border-green-600/50 border-dashed bg-green-50/30 dark:bg-green-950/10",
  'weighted-negative-unselected': "text-foreground/60 border-border/60",
  'weighted-neutral-unselected': "",
}

interface StatusIndicatorProps {
  status: string | null
  weight?: number | null
  isSelected?: boolean
}

export function StatusIndicator({ status, weight, isSelected }: StatusIndicatorProps) {
  if (weight != null) {
    const isPositive = weight > 0
    const isNegative = weight < 0
    const sign = isPositive ? "+" : isNegative ? "-" : ""
    const displayWeight = Math.abs(weight).toFixed(3)

    return (
      <span className={cn(
        "text-sm font-bold tabular-nums",
        isPositive
          ? (isSelected ? "text-green-600 dark:text-green-500" : "text-green-600/60 dark:text-green-500/60")
          : isNegative
            ? (isSelected ? "text-red-600 dark:text-red-500" : "text-red-600/60 dark:text-red-500/60")
            : (isSelected ? "text-muted-foreground" : "text-muted-foreground/60")
      )}>
        {sign}{displayWeight}
      </span>
    )
  }

  if (status === 'correct') return <CircleCheckIcon className="h-4 w-4 text-green-600" />
  if (status === 'incorrect') return <CircleXIcon className="h-4 w-4 text-red-600" />
  if (status === 'missed') return <AlertCircleIcon className="h-4 w-4 text-green-600/70" />
  return null
}
