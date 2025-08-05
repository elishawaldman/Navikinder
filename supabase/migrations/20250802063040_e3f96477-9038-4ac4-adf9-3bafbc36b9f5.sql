-- Clean up orphaned dose instances for stopped medication
DELETE FROM dose_instances 
WHERE medication_id = '169aca29-3c28-4fc3-a939-2e15d9de57ee' 
  AND status = 'pending' 
  AND due_datetime > '2025-08-02 06:28:07.155+00';