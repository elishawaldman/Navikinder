-- Add more test dose instances with different statuses and timeframes
INSERT INTO dose_instances (
  medication_id, 
  child_id, 
  schedule_id,
  due_datetime, 
  dose_amount, 
  dose_unit, 
  status,
  window_start,
  window_end
) VALUES 
-- Completed dose from yesterday
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '1 day',
  5,
  'ml',
  'completed',
  NOW() - INTERVAL '1 day 30 minutes',
  NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'
),
-- Skipped dose from yesterday
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '1 day 4 hours',
  5,
  'ml',
  'skipped',
  NOW() - INTERVAL '1 day 4 hours 30 minutes',
  NOW() - INTERVAL '1 day 4 hours' + INTERVAL '30 minutes'
),
-- Missed dose from 6 hours ago
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '6 hours',
  5,
  'ml',
  'missed',
  NOW() - INTERVAL '6 hours 30 minutes',
  NOW() - INTERVAL '6 hours' + INTERVAL '30 minutes'
),
-- Completed dose from this morning
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '8 hours',
  5,
  'ml',
  'completed',
  NOW() - INTERVAL '8 hours 30 minutes',
  NOW() - INTERVAL '8 hours' + INTERVAL '30 minutes'
),
-- Another completed dose from 2 days ago
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '2 days',
  5,
  'ml',
  'completed',
  NOW() - INTERVAL '2 days 30 minutes',
  NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'
);