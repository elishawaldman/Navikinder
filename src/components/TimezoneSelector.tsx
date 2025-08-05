/**
 * TimezoneSelector Component
 * 
 * Allows users to select their timezone preference for medication reminders.
 * Uses Intl.supportedValuesOf to get list of supported timezones.
 * Located in: /components/TimezoneSelector.tsx
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface TimezoneSelectorProps {
  onTimezoneChange?: (timezone: string) => void
}

export function TimezoneSelector({ onTimezoneChange }: TimezoneSelectorProps) {
  const { user } = useAuth()
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC')
  const [loading, setLoading] = useState(false)
  const [timezones, setTimezones] = useState<string[]>([])

  // Get user's current timezone as default
  useEffect(() => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    setSelectedTimezone(userTimezone)
    
    // Get list of supported timezones
    try {
      const supportedTimezones = Intl.supportedValuesOf('timeZone')
      setTimezones(supportedTimezones.sort())
    } catch {
      // Fallback list of common timezones
      setTimezones([
        'UTC',
        'America/New_York',
        'America/Chicago', 
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Dubai',
        'Asia/Kolkata',
        'Australia/Sydney',
        'Pacific/Auckland'
      ])
    }
  }, [])

  // Load user's saved timezone
  useEffect(() => {
    const loadUserTimezone = async () => {
      if (!user) return
      
      const { data, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()
      
      if (!error && data?.timezone) {
        setSelectedTimezone(data.timezone)
      }
    }
    
    loadUserTimezone()
  }, [user])

  const handleTimezoneChange = async (timezone: string) => {
    if (!user) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ timezone })
        .eq('id', user.id)
      
      if (error) throw error
      
      setSelectedTimezone(timezone)
      onTimezoneChange?.(timezone)
    } catch (error) {
      console.error('Error updating timezone:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text font-medium">Timezone</span>
        <span className="label-text-alt text-gray-500">For medication reminders</span>
      </label>
      <select 
        className="select select-bordered w-full"
        value={selectedTimezone}
        onChange={(e) => handleTimezoneChange(e.target.value)}
        disabled={loading}
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, ' ')} ({new Date().toLocaleTimeString('en-US', { 
              timeZone: tz, 
              hour12: false,
              hour: '2-digit',
              minute: '2-digit'
            })})
          </option>
        ))}
      </select>
      {loading && (
        <label className="label">
          <span className="label-text-alt text-blue-600">Saving timezone...</span>
        </label>
      )}
    </div>
  )
}