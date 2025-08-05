import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DateTimePicker({ value, onChange, placeholder = "Pick a date and time", className }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [timeValue, setTimeValue] = React.useState({
    hour: value ? (value.getHours() % 12 || 12).toString() : "12",
    minute: value ? value.getMinutes().toString().padStart(2, "0") : "00",
    period: value ? (value.getHours() >= 12 ? "PM" : "AM") : "AM"
  })

  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setTimeValue({
        hour: (value.getHours() % 12 || 12).toString(),
        minute: value.getMinutes().toString().padStart(2, "0"),
        period: value.getHours() >= 12 ? "PM" : "AM"
      })
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange?.(undefined)
      return
    }

    setSelectedDate(date)
    
    // Apply current time to the selected date
    const newDateTime = new Date(date)
    const hour24 = timeValue.period === "PM" && timeValue.hour !== "12" 
      ? parseInt(timeValue.hour) + 12 
      : timeValue.period === "AM" && timeValue.hour === "12" 
      ? 0 
      : parseInt(timeValue.hour)
    
    newDateTime.setHours(hour24, parseInt(timeValue.minute), 0, 0)
    onChange?.(newDateTime)
  }

  const handleTimeChange = (field: "hour" | "minute" | "period", newValue: string) => {
    const newTimeValue = { ...timeValue, [field]: newValue }
    setTimeValue(newTimeValue)

    if (selectedDate) {
      const newDateTime = new Date(selectedDate)
      const hour24 = newTimeValue.period === "PM" && newTimeValue.hour !== "12" 
        ? parseInt(newTimeValue.hour) + 12 
        : newTimeValue.period === "AM" && newTimeValue.hour === "12" 
        ? 0 
        : parseInt(newTimeValue.hour)
      
      newDateTime.setHours(hour24, parseInt(newTimeValue.minute), 0, 0)
      onChange?.(newDateTime)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "PPP 'at' h:mm a")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
          />
          
          <div className="mt-3 border-t pt-3">
            <Label className="text-sm font-medium">Time</Label>
            <div className="flex items-center space-x-2 mt-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              
              {/* Hour */}
              <Select value={timeValue.hour} onValueChange={(value) => handleTimeChange("hour", value)}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-muted-foreground">:</span>
              
              {/* Minute */}
              <Select value={timeValue.minute} onValueChange={(value) => handleTimeChange("minute", value)}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 60 }, (_, i) => (
                    <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* AM/PM */}
              <Select value={timeValue.period} onValueChange={(value) => handleTimeChange("period", value)}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}