-- First, let's get the medication and child IDs we'll need
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
-- Overdue dose (2 hours ago)
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '2 hours',
  5,
  'ml',
  'pending',
  NOW() - INTERVAL '2.5 hours',
  NOW() - INTERVAL '1.5 hours'
),
-- Due now dose
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() - INTERVAL '10 minutes',
  5,
  'ml',
  'pending',
  NOW() - INTERVAL '40 minutes',
  NOW() + INTERVAL '20 minutes'
),
-- Upcoming dose (in 30 minutes)
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() + INTERVAL '30 minutes',
  5,
  'ml',
  'pending',
  NOW(),
  NOW() + INTERVAL '60 minutes'
),
-- Another upcoming dose (in 2 hours)
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() + INTERVAL '2 hours',
  5,
  'ml',
  'pending',
  NOW() + INTERVAL '1.5 hours',
  NOW() + INTERVAL '2.5 hours'
),
-- Future dose (in 6 hours)
(
  (SELECT id FROM medications LIMIT 1),
  (SELECT child_id FROM medications LIMIT 1),
  (SELECT id FROM medication_schedules LIMIT 1),
  NOW() + INTERVAL '6 hours',
  5,
  'ml',
  'pending',
  NOW() + INTERVAL '5.5 hours',
  NOW() + INTERVAL '6.5 hours'
);