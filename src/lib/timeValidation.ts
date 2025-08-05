// Time validation utilities for medication scheduling

export interface ParsedTime {
  hour: number;
  minute: number;
  formatted: string; // 24-hour format like "08:00"
}

export function parseTimeString(timeStr: string): ParsedTime | null {
  const cleanTime = timeStr.trim();
  
  // 12-hour format with AM/PM (e.g., "8:00 AM", "2:30 PM")
  const ampmMatch = cleanTime.match(/^(\d{1,2}):?(\d{0,2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    const [, hourStr, minuteStr = "00", ampm] = ampmMatch;
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || "0", 10);
    
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }
    
    // Convert to 24-hour format
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return {
      hour,
      minute,
      formatted: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  }
  
  // 24-hour format (e.g., "14:30", "08:00")
  const militaryMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (militaryMatch) {
    const [, hourStr, minuteStr] = militaryMatch;
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
    
    return {
      hour,
      minute,
      formatted: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    };
  }
  
  // Simple hour format (e.g., "8", "14")
  const hourMatch = cleanTime.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1], 10);
    if (hour >= 0 && hour <= 23) {
      return {
        hour,
        minute: 0,
        formatted: `${hour.toString().padStart(2, '0')}:00`
      };
    }
  }
  
  return null;
}

export function validateSpecificTimes(timesString: string): { isValid: boolean; times: ParsedTime[]; error?: string } {
  if (!timesString || timesString.trim() === '') {
    return { isValid: false, times: [], error: 'Please enter at least one time' };
  }
  
  const timeStrings = timesString.split(',').map(t => t.trim()).filter(t => t.length > 0);
  
  if (timeStrings.length === 0) {
    return { isValid: false, times: [], error: 'Please enter at least one time' };
  }
  
  const parsedTimes: ParsedTime[] = [];
  const invalidTimes: string[] = [];
  
  for (const timeStr of timeStrings) {
    const parsed = parseTimeString(timeStr);
    if (parsed) {
      parsedTimes.push(parsed);
    } else {
      invalidTimes.push(timeStr);
    }
  }
  
  if (invalidTimes.length > 0) {
    return {
      isValid: false,
      times: [],
      error: `Invalid time format(s): ${invalidTimes.join(', ')}. Use formats like '8:00 AM', '14:30', or '8'`
    };
  }
  
  // Sort times by hour and minute
  parsedTimes.sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });
  
  // Check for duplicates
  const uniqueTimes = new Set(parsedTimes.map(t => t.formatted));
  if (uniqueTimes.size !== parsedTimes.length) {
    return {
      isValid: false,
      times: [],
      error: 'Duplicate times detected. Please enter unique times only.'
    };
  }
  
  return { isValid: true, times: parsedTimes };
}

export function formatTimesForDisplay(times: ParsedTime[]): string {
  return times.map(t => {
    const hour12 = t.hour === 0 ? 12 : t.hour > 12 ? t.hour - 12 : t.hour;
    const ampm = t.hour < 12 ? 'AM' : 'PM';
    const minute = t.minute.toString().padStart(2, '0');
    return `${hour12}:${minute} ${ampm}`;
  }).join(', ');
}

export function formatTimesForDatabase(times: ParsedTime[]): string {
  return JSON.stringify(times.map(t => t.formatted));
}