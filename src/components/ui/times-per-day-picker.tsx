import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface TimeEntry {
  id: string;
  time: string; // "HH:MM" format
}

interface TimesPerDayPickerProps {
  count: number;
  value: TimeEntry[];
  onChange: (times: TimeEntry[]) => void;
  className?: string;
}

export function TimesPerDayPicker({ count, value, onChange, className }: TimesPerDayPickerProps) {
  // Create time slots based on count
  const createTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < count; i++) {
      const existingTime = value[i];
      slots.push(
        <div key={i} className="grid grid-cols-3 gap-2 items-center">
          <Label className="text-sm">Dose {i + 1}:</Label>
          
          <div className="flex gap-1">
            <Select
              value={existingTime ? getHour12(existingTime.time) : ""}
              onValueChange={(hour) => updateTime(i, hour, 'hour')}
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Hr" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {Array.from({ length: 12 }, (_, idx) => {
                  const hour = idx + 1;
                  return (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Select
              value={existingTime ? getMinutes(existingTime.time) : ""}
              onValueChange={(minute) => updateTime(i, minute, 'minute')}
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {["00", "15", "30", "45"].map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={existingTime ? getPeriod(existingTime.time) : ""}
              onValueChange={(period) => updateTime(i, period, 'period')}
            >
              <SelectTrigger className="w-16">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    return slots;
  };

  const getHour12 = (time24: string) => {
    const [hours] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    return hour12.toString();
  };

  const getMinutes = (time24: string) => {
    const [, minutes] = time24.split(':');
    return minutes;
  };

  const getPeriod = (time24: string) => {
    const [hours] = time24.split(':');
    const hour24 = parseInt(hours, 10);
    return hour24 < 12 ? 'AM' : 'PM';
  };

  const updateTime = (slotIndex: number, newValue: string, type: 'hour' | 'minute' | 'period') => {
    const updatedTimes = [...value];
    
    // Ensure we have enough slots
    while (updatedTimes.length <= slotIndex) {
      updatedTimes.push({
        id: crypto.randomUUID(),
        time: "12:00" // default time in 24h format
      });
    }

    const existingTime = updatedTimes[slotIndex];
    const currentTime = existingTime.time;
    const [currentHours, currentMinutes] = currentTime.split(':');
    
    let newHour24 = parseInt(currentHours, 10);
    let newMinute = currentMinutes;
    
    if (type === 'hour') {
      const hour12 = parseInt(newValue, 10);
      const currentPeriod = newHour24 < 12 ? 'AM' : 'PM';
      newHour24 = currentPeriod === "PM" && hour12 !== 12 
        ? hour12 + 12 
        : currentPeriod === "AM" && hour12 === 12 
        ? 0 
        : hour12;
    } else if (type === 'minute') {
      newMinute = newValue;
    } else if (type === 'period') {
      const currentHour12 = newHour24 === 0 ? 12 : newHour24 > 12 ? newHour24 - 12 : newHour24;
      newHour24 = newValue === "PM" && currentHour12 !== 12 
        ? currentHour12 + 12 
        : newValue === "AM" && currentHour12 === 12 
        ? 0 
        : newValue === "PM" && currentHour12 === 12
        ? 12
        : currentHour12;
    }

    const newTime24 = `${newHour24.toString().padStart(2, '0')}:${newMinute}`;
    
    updatedTimes[slotIndex] = {
      ...existingTime,
      time: newTime24
    };

    onChange(updatedTimes);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {createTimeSlots()}
    </div>
  );
}