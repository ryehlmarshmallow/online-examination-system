import { Checkbox } from "@/shared/components/ui/checkbox"
import { Input } from "@/shared/components/ui/input"
import {
  Field,
  FieldLabel
} from "@/shared/components/ui/field"

interface DurationPickerProps {
  value: number | null // duration in seconds, null means unlimited
  onChange: (value: number | null) => void
  disabled?: boolean
}

export function DurationPicker({ value, onChange, disabled }: DurationPickerProps) {
  const isUnlimited = value === null

  // Deconstruct seconds into Days, Hours, Minutes, Seconds
  const getDHMSTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    const days = Math.floor(totalSeconds / (24 * 3600))
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return { days, hours, minutes, seconds }
  }

  const { days, hours, minutes, seconds } = getDHMSTime(value)

  const handleInputChange = (field: "days" | "hours" | "minutes" | "seconds", valStr: string) => {
    const numVal = parseInt(valStr, 10) || 0
    let updatedDays = days
    let updatedHours = hours
    let updatedMinutes = minutes
    let updatedSeconds = seconds

    if (field === "days") {
      updatedDays = Math.max(0, numVal)
    } else if (field === "hours") {
      updatedHours = Math.max(0, Math.min(23, numVal))
    } else if (field === "minutes") {
      updatedMinutes = Math.max(0, Math.min(59, numVal))
    } else if (field === "seconds") {
      updatedSeconds = Math.max(0, Math.min(59, numVal))
    }

    const totalSeconds =
      ((updatedDays * 24 + updatedHours) * 60 + updatedMinutes) * 60 + updatedSeconds

    onChange(totalSeconds)
  }

  const handleUnlimitedToggle = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      onChange(null)
    } else {
      onChange(0) // Default to 0 duration when turning off unlimited
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="duration-unlimited"
          aria-label="Unlimited Duration"
          disabled={disabled}
          checked={isUnlimited}
          onCheckedChange={handleUnlimitedToggle}
        />
        <label
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Unlimited Duration
        </label>
      </div>

      {!isUnlimited && (
        <div className="grid grid-cols-4 gap-2">
          <Field>
            <FieldLabel>Days</FieldLabel>
            <Input
              id="duration-days"
              aria-label="Days"
              type="number"
              min="0"
              disabled={disabled}
              value={days}
              onChange={(e) => handleInputChange("days", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Hours</FieldLabel>
            <Input
              id="duration-hours"
              aria-label="Hours"
              type="number"
              min="0"
              max="23"
              disabled={disabled}
              value={hours}
              onChange={(e) => handleInputChange("hours", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Minutes</FieldLabel>
            <Input
              id="duration-minutes"
              aria-label="Minutes"
              type="number"
              min="0"
              max="59"
              disabled={disabled}
              value={minutes}
              onChange={(e) => handleInputChange("minutes", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Seconds</FieldLabel>
            <Input
              id="duration-seconds"
              aria-label="Seconds"
              type="number"
              min="0"
              max="59"
              disabled={disabled}
              value={seconds}
              onChange={(e) => handleInputChange("seconds", e.target.value)}
            />
          </Field>
        </div>
      )}
    </div>
  )
}
