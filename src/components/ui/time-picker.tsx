import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimeEntry {
  id: string;
  time: string; // "HH:MM" format
}

interface TimePickerProps {
  value: TimeEntry[];
  onChange: (times: TimeEntry[]) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [newHour, setNewHour] = useState("");
  const [newMinute, setNewMinute] = useState("");
  const [newPeriod, setNewPeriod] = useState("");

  // Ensure value is always an array of TimeEntry objects with valid time strings
  const safeValue = React.useMemo(() => {
    if (!Array.isArray(value)) return [];
    return value.filter(entry => 
      entry && 
      typeof entry === 'object' && 
      typeof entry.id === 'string' && 
      typeof entry.time === 'string' &&
      entry.time.includes(':')
    );
  }, [value]);

  const addTime = () => {
    if (!newHour || !newMinute || !newPeriod) return;
    
    // Convert 12-hour format to 24-hour format
    let hour24 = parseInt(newHour, 10);
    if (newPeriod === "PM" && hour24 !== 12) hour24 += 12;
    if (newPeriod === "AM" && hour24 === 12) hour24 = 0;
    
    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinute}`;
    
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      time: timeString
    };
    
    onChange([...safeValue, newEntry]);
    setNewHour("");
    setNewMinute("");
    setNewPeriod("");
  };

  const removeTime = (id: string) => {
    onChange(safeValue.filter(entry => entry.id !== id));
  };

  const formatDisplayTime = (time: string) => {
    // Ensure time is a string
    if (typeof time !== 'string') {
      console.error('formatDisplayTime received non-string value:', time);
      return 'Invalid Time';
    }
    
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 < 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label>Add Time</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Select value={newHour} onValueChange={setNewHour}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {[...Array(12)].map((_, i) => {
                  const hour = i + 1;
                  return (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Select value={newMinute} onValueChange={setNewMinute}>
              <SelectTrigger className="flex-1 min-w-0">
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
            
            <Select value={newPeriod} onValueChange={setNewPeriod}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="button"
            onClick={addTime}
            disabled={!newHour || !newMinute || !newPeriod}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {safeValue.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Times</Label>
          <div className="grid gap-2">
            {safeValue.map((entry) => (
              <Card key={entry.id} className="p-3 flex items-center justify-between">
                <span className="font-medium">
                  {formatDisplayTime(entry.time)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTime(entry.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}