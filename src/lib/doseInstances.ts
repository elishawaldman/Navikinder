import { supabase } from '@/integrations/supabase/client';
import { addHours, addDays, format, startOfDay } from 'date-fns';

interface MedicationWithSchedule {
  id: string;
  child_id: string;
  dose_amount: number;
  dose_unit: string;
  start_datetime: string;
  medication_schedules: {
    id: string;
    rule_type: string;
    every_x_hours?: number;
    times_per_day?: number;
    specific_times?: any; // Json type from Supabase
    active_from: string;
  }[];
}

/**
 * Generate dose instances for a medication for the next 14 days
 */
export async function generateDoseInstances(medication: MedicationWithSchedule) {
  const schedule = medication.medication_schedules[0];
  if (!schedule) return;

  const startDate = new Date(schedule.active_from);
  const endDate = addDays(new Date(), 14); // Generate for next 14 days
  const instances = [];

  if ((schedule.rule_type === 'specific_times' || schedule.rule_type === 'times_per_day') && schedule.specific_times) {
    // Parse specific_times from Json (could be array or string)
    const times = Array.isArray(schedule.specific_times) 
      ? schedule.specific_times 
      : JSON.parse(String(schedule.specific_times));
    
    // Generate instances for specific times each day
    for (let date = startOfDay(startDate); date <= endDate; date = addDays(date, 1)) {
      for (const timeStr of times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const dueTime = new Date(date);
        dueTime.setHours(hours, minutes, 0, 0);

        // Only create instances for future doses
        if (dueTime > new Date()) {
          instances.push({
            medication_id: medication.id,
            schedule_id: schedule.id,
            child_id: medication.child_id,
            due_datetime: dueTime.toISOString(),
            window_start: addHours(dueTime, -0.5).toISOString(), // 30 min before
            window_end: addHours(dueTime, 0.5).toISOString(), // 30 min after
            dose_amount: medication.dose_amount,
            dose_unit: medication.dose_unit,
            status: 'pending'
          });
        }
      }
    }
  } else if (schedule.rule_type === 'every_x_hours' && schedule.every_x_hours) {
    // Generate instances for every X hours
    let currentTime = new Date(Math.max(startDate.getTime(), new Date().getTime()));
    
    while (currentTime <= endDate) {
      instances.push({
        medication_id: medication.id,
        schedule_id: schedule.id,
        child_id: medication.child_id,
        due_datetime: currentTime.toISOString(),
        window_start: addHours(currentTime, -0.5).toISOString(), // 30 min before
        window_end: addHours(currentTime, 0.5).toISOString(), // 30 min after
        dose_amount: medication.dose_amount,
        dose_unit: medication.dose_unit,
        status: 'pending'
      });
      
      currentTime = addHours(currentTime, schedule.every_x_hours);
    }
  }

  // Insert instances into database
  if (instances.length > 0) {
    const { error } = await supabase
      .from('dose_instances')
      .insert(instances);

    if (error) {
      console.error('Error creating dose instances:', error);
      throw error;
    }
  }
}

/**
 * Update dose instances when a medication schedule changes
 */
export async function updateDoseInstancesForMedication(medicationId: string) {
  // First, remove future pending instances for this medication
  await supabase
    .from('dose_instances')
    .delete()
    .eq('medication_id', medicationId)
    .eq('status', 'pending')
    .gte('due_datetime', new Date().toISOString());

  // Get medication with schedule
  const { data: medication, error } = await supabase
    .from('medications')
    .select(`
      id,
      child_id,
      dose_amount,
      dose_unit,
      start_datetime,
      medication_schedules!inner(
        id,
        rule_type,
        every_x_hours,
        times_per_day,
        specific_times,
        active_from
      )
    `)
    .eq('id', medicationId)
    .eq('is_prn', false)
    .is('archived_at', null)
    .single();

  if (error || !medication) {
    console.error('Error fetching medication for dose instance update:', error);
    return;
  }

  // Generate new instances
  await generateDoseInstances(medication as MedicationWithSchedule);
}

// Cache for preventing repeated generation calls
const lastGenerationCheck = new Map<string, number>();
const GENERATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes

/**
 * Ensure all active medications have sufficient dose instances for the next 48 hours
 */
export async function ensureDoseInstances() {
  const now = new Date();
  const checkUntil = addHours(now, 48);
  
  // Get current user's active medications
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  // Check cache to avoid repeated calls
  const cacheKey = user.user.id;
  const lastCheck = lastGenerationCheck.get(cacheKey);
  if (lastCheck && (now.getTime() - lastCheck) < GENERATION_COOLDOWN) {
    return;
  }

  // Get all active scheduled medications for user's children
  const { data: medications, error } = await supabase
    .from('medications')
    .select(`
      id,
      child_id,
      dose_amount,
      dose_unit,
      start_datetime,
      medication_schedules!inner(
        id,
        rule_type,
        every_x_hours,
        times_per_day,
        specific_times,
        active_from
      ),
      children!inner(
        child_profiles!inner(profile_id)
      )
    `)
    .eq('is_prn', false)
    .is('archived_at', null)
    .eq('children.child_profiles.profile_id', user.user.id);

  if (error || !medications) return;

  // Check each medication for missing dose instances
  for (const medication of medications as any[]) {
    // Check if this medication has dose instances in the next 48 hours
    const { data: existingInstances } = await supabase
      .from('dose_instances')
      .select('id')
      .eq('medication_id', medication.id)
      .eq('status', 'pending')
      .gte('due_datetime', now.toISOString())
      .lte('due_datetime', checkUntil.toISOString())
      .limit(1);

    // If no instances found, generate them
    if (!existingInstances || existingInstances.length === 0) {
      try {
        await generateDoseInstances(medication as MedicationWithSchedule);
      } catch (error) {
        console.error('Error generating dose instances for medication:', medication.id, error);
      }
    }
  }

  // Update cache
  lastGenerationCheck.set(cacheKey, now.getTime());
}

/**
 * Get due medications from dose_instances table
 */
export async function getDueMedications() {
  // Ensure dose instances exist before fetching
  await ensureDoseInstances();
  
  const now = new Date();
  const oneHourFromNow = addHours(now, 1);

  const { data, error } = await supabase
    .from('dose_instances')
    .select(`
      id,
      medication_id,
      due_datetime,
      dose_amount,
      dose_unit,
      medications!inner(
        name,
        child_id,
        children!inner(first_name)
      )
    `)
    .eq('status', 'pending')
    .lte('due_datetime', oneHourFromNow.toISOString()) // Include all overdue + upcoming up to 1 hour
    .order('due_datetime');

  if (error) {
    console.error('Error fetching due medications:', error);
    throw error;
  }

  return data?.map(instance => {
    const dueTime = new Date(instance.due_datetime);
    const minutesDiff = Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60));
    
    let urgency: 'due' | 'overdue' | 'upcoming';
    if (minutesDiff <= -15) {
      urgency = 'overdue';
    } else if (minutesDiff <= 15) {
      urgency = 'due';
    } else {
      urgency = 'upcoming';
    }

    return {
      id: instance.medication_id,
      dose_instance_id: instance.id,
      name: instance.medications.name,
      dose_amount: instance.dose_amount,
      dose_unit: instance.dose_unit,
      child_id: instance.medications.child_id,
      child_name: instance.medications.children.first_name,
      due_datetime: instance.due_datetime,
      urgency,
    };
  }) || [];
}

/**
 * Mark a dose instance as completed
 */
export async function completeDoseInstance(doseInstanceId: string, wasGiven: boolean, reason?: string) {
  const { error } = await supabase
    .from('dose_instances')
    .update({
      status: wasGiven ? 'given' : 'skipped'
    })
    .eq('id', doseInstanceId);

  if (error) {
    console.error('Error updating dose instance:', error);
    throw error;
  }
}