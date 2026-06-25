import {
  type ChangeEvent,
  useState,
  useId
} from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Calendar } from "@/shared/components/ui/calendar"
import {
  Field,
  FieldLabel
} from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { cn } from "@/shared/lib/utils"

interface DatePickerTimeProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  label: string
}

export function DatePickerTime({ value, onChange, disabled, label }: DatePickerTimeProps) {
  const [open, setOpen] = useState(false)
  const dateInputId = useId()
  const timeInputId = useId()

  // Split date and time representation
  const dateValue = value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : undefined

  // Format as HH:mm:ss for the time input
  const timeValue = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}:${String(
      value.getSeconds()
    ).padStart(2, "0")}`
    : "00:00:00"

  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      onChange(undefined)
      return
    }
    // Maintain the existing time if any
    const hours = value ? value.getHours() : 0
    const minutes = value ? value.getMinutes() : 0
    const seconds = value ? value.getSeconds() : 0
    const combined = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      hours,
      minutes,
      seconds
    )
    onChange(combined)
    setOpen(false)
  }

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const timeStr = e.target.value // e.g. "14:30" or "14:30:00"
    if (!timeStr) return

    const [hoursStr, minutesStr, secondsStr] = timeStr.split(":")
    const hours = parseInt(hoursStr, 10) || 0
    const minutes = parseInt(minutesStr, 10) || 0
    const seconds = parseInt(secondsStr, 10) || 0

    const baseDate = value || new Date()
    const combined = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      seconds
    )
    onChange(combined)
  }

  return (
    <div className="flex flex-row gap-3 items-end w-full">
      <Field className="flex-1">
        <FieldLabel>{label} Date</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={dateInputId}
              aria-label={`${label} Date`}
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </Field>
      <Field className="w-32">
        <FieldLabel>{label} Time</FieldLabel>
        <Input
          id={timeInputId}
          aria-label={`${label} Time`}
          type="time"
          step="1"
          disabled={disabled}
          value={timeValue}
          onChange={handleTimeChange}
          className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </Field>
    </div>
  )
}
