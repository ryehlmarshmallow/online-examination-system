import {
  useEffect,
  useState,
  useRef
} from "react"
import { ClockIcon } from "lucide-react"

interface ExamTimerProps {
  deadline: string | null
  serverTime: string
  onExpire?: () => void
  examTitle?: string
}

export function ExamTimer({ deadline, serverTime, onExpire, examTitle }: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    if (!deadline) {
      const timeoutId = setTimeout(() => {
        setTimeLeft(null)
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    const target = new Date(deadline).getTime()
    const server = new Date(serverTime).getTime()
    const skew = Date.now() - server

    let interval: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      const now = Date.now() - skew
      const diff = target - now
      if (diff <= 0) {
        setTimeLeft(0)
        if (interval) clearInterval(interval)
        onExpireRef.current?.()
      } else {
        const totalSecs = Math.floor(diff / 1000)
        setTimeLeft(totalSecs)

        // Dynamically update document title with countdown if we are taking the exam
        const h = Math.floor(totalSecs / 3600)
        const m = Math.floor((totalSecs % 3600) / 60)
        const s = totalSecs % 60
        const formattedTime = `${h > 0 ? `${h}:` : ""}${m
          .toString()
          .padStart(2, "0")}:${s.toString().padStart(2, "0")}`

        const baseTitle = examTitle ? `Taking: ${examTitle}` : "Taking Exam"
        document.title = `[${formattedTime}] ${baseTitle} | Online Examination System`
      }
    }

    // Run the first tick asynchronously to avoid synchronous setState warning and render-phase impurity
    const timeoutId = setTimeout(() => {
      tick()
      interval = setInterval(tick, 1000)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      if (interval) clearInterval(interval)
      if (examTitle) {
        document.title = `Taking: ${examTitle} | Online Examination System`
      }
    }
  }, [deadline, serverTime, examTitle])

  if (timeLeft === null) return null

  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60

  const timeString = `${hours > 0 ? `${hours}:` : ""}${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  const isLow = timeLeft < 300 // 5 minutes

  return (
    <div
      className={`flex items-center gap-2 font-mono text-xl ${isLow ? "text-destructive animate-pulse font-bold" : ""}`}>
      <ClockIcon className="h-5 w-5" />
      {timeString}
    </div>
  )
}
