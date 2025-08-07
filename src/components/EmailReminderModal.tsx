/**
 * EmailReminderModal - Modal for confirming medication doses from email reminders
 * 
 * This component handles medication dose confirmation when users click
 * reminder links from emails. It fetches medication data by dose instance ID
 * and provides the same functionality as DoseConfirmationModal but with
 * email-specific messaging and error handling.
 * 
 * Location: /src/components/EmailReminderModal.tsx
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, User, Clock, AlertTriangle, Mail, CheckCircle, XCircle } from 'lucide-react';

interface EmailReminderMedication {
  id: string;
  dose_instance_id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  child_id: string;
  child_name: string;
  due_datetime: string;
  urgency: 'due' | 'overdue' | 'upcoming';
  status: 'pending' | 'given' | 'skipped';
}

interface EmailReminderModalProps {
  open: boolean;
  onClose: () => void;
  doseInstanceId: string;
  onConfirm?: () => void;
}

export function EmailReminderModal({ 
  open, 
  onClose, 
  doseInstanceId,
  onConfirm 
}: EmailReminderModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [medication, setMedication] = useState<EmailReminderMedication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotGivenForm, setShowNotGivenForm] = useState(false);
  const [notGivenReason, setNotGivenReason] = useState('');

  // Fetch medication data by dose instance ID
  useEffect(() => {
    if (open && doseInstanceId) {
      fetchMedicationData();
    }
  }, [open, doseInstanceId]);

  const fetchMedicationData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('dose_instances')
        .select(`
          id,
          medication_id,
          due_datetime,
          dose_amount,
          dose_unit,
          status,
          medications!inner(
            name,
            child_id,
            children!inner(first_name)
          )
        `)
        .eq('id', doseInstanceId)
        .single();

      if (fetchError) {
        setError('Medication reminder not found.');
        return;
      }

      if (!data) {
        setError('Medication reminder not found.');
        return;
      }

      // Check if this medication belongs to the user's children
      const { data: childProfile } = await supabase
        .from('child_profiles')
        .select('profile_id')
        .eq('child_id', data.medications.child_id)
        .eq('profile_id', user.id)
        .single();

      if (!childProfile) {
        setError('You do not have permission to view this medication reminder.');
        return;
      }

      const now = new Date();
      const dueTime = new Date(data.due_datetime);
      const minutesDiff = Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60));
      
      let urgency: 'due' | 'overdue' | 'upcoming';
      if (minutesDiff <= -15) {
        urgency = 'overdue';
      } else if (minutesDiff <= 15) {
        urgency = 'due';
      } else {
        urgency = 'upcoming';
      }

      setMedication({
        id: data.medication_id,
        dose_instance_id: data.id,
        name: data.medications.name,
        dose_amount: data.dose_amount,
        dose_unit: data.dose_unit,
        child_id: data.medications.child_id,
        child_name: data.medications.children.first_name,
        due_datetime: data.due_datetime,
        urgency,
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching medication data:', error);
      setError('Failed to load medication information.');
    } finally {
      setLoading(false);
    }
  };

  const handleGiven = async () => {
    if (!user || !medication) return;

    try {
      setActionLoading(true);

      // Record the dose in dose_logs
      const { error: logError } = await supabase
        .from('dose_logs')
        .insert({
          medication_id: medication.id,
          child_id: medication.child_id,
          is_prn: false,
          amount_given: medication.dose_amount,
          unit: medication.dose_unit,
          given_datetime: new Date().toISOString(),
          recorded_by: user.id,
          was_given: true,
          dose_instance_id: medication.dose_instance_id,
        });

      if (logError) throw logError;

      // Update the dose instance status
      const { error: instanceError } = await supabase
        .from('dose_instances')
        .update({ status: 'given' })
        .eq('id', medication.dose_instance_id);

      if (instanceError) throw instanceError;

      toast({
        title: "Dose recorded",
        description: `${medication.name} for ${medication.child_name} marked as given.`,
      });

      onConfirm?.();
      handleClose();
    } catch (error) {
      console.error('Error recording dose:', error);
      toast({
        title: "Error",
        description: "Failed to record dose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotGiven = async () => {
    if (!user || !medication || !notGivenReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for not giving the medication.",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      // Record the dose in dose_logs
      const { error: logError } = await supabase
        .from('dose_logs')
        .insert({
          medication_id: medication.id,
          child_id: medication.child_id,
          is_prn: false,
          amount_given: 0,
          unit: medication.dose_unit,
          given_datetime: new Date().toISOString(),
          recorded_by: user.id,
          was_given: false,
          reason_not_given: notGivenReason.trim(),
          dose_instance_id: medication.dose_instance_id,
        });

      if (logError) throw logError;

      // Update the dose instance status
      const { error: instanceError } = await supabase
        .from('dose_instances')
        .update({ status: 'skipped' })
        .eq('id', medication.dose_instance_id);

      if (instanceError) throw instanceError;

      toast({
        title: "Dose recorded",
        description: `${medication.name} for ${medication.child_name} marked as not given.`,
      });

      onConfirm?.();
      handleClose();
    } catch (error) {
      console.error('Error recording missed dose:', error);
      toast({
        title: "Error",
        description: "Failed to record missed dose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    setShowNotGivenForm(false);
    setNotGivenReason('');
    onClose();
  };

  const getUrgencyColor = () => {
    if (!medication) return 'text-foreground';
    switch (medication.urgency) {
      case 'overdue':
        return 'text-destructive';
      case 'due':
        return 'text-primary';
      case 'upcoming':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getUrgencyText = () => {
    if (!medication) return '';
    switch (medication.urgency) {
      case 'overdue':
        return 'Overdue';
      case 'due':
        return 'Due now';
      case 'upcoming':
        return 'Due soon';
      default:
        return '';
    }
  };

  const getStatusDisplay = () => {
    if (!medication) return null;
    
    if (medication.status === 'given') {
      return (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Medication Already Recorded</p>
            <p className="text-sm text-green-600">This dose has already been marked as given.</p>
          </div>
        </div>
      );
    }
    
    if (medication.status === 'skipped') {
      return (
        <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <XCircle className="w-5 h-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-800">Medication Already Recorded</p>
            <p className="text-sm text-orange-600">This dose has already been marked as not given.</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {medication && (
            <>
              {/* Medication Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-foreground">{medication.name}</h3>
                  <span className={`text-sm font-medium ${getUrgencyColor()}`}>
                    {getUrgencyText()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{medication.child_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {format(new Date(medication.due_datetime), 'HH:mm')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-foreground">
                    <strong>Dose:</strong> {medication.dose_amount} {medication.dose_unit}
                  </div>
                  <div className="text-muted-foreground text-sm mt-1">
                    Due: {format(new Date(medication.due_datetime), 'PPP \'at\' HH:mm')}
                  </div>
                </div>
              </div>

              {/* Status Display */}
              {getStatusDisplay()}

              {/* Not Given Form */}
              {showNotGivenForm && medication.status === 'pending' && (
                <div className="space-y-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Why wasn't the medication given?</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (required)</Label>
                    <Textarea
                      id="reason"
                      placeholder="e.g., Child refused, medication not available, sleeping..."
                      value={notGivenReason}
                      onChange={(e) => setNotGivenReason(e.target.value)}
                      className="min-h-20"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {medication.status === 'pending' && (
                <div className="space-y-3">
                  {!showNotGivenForm ? (
                    <>
                      <Button 
                        onClick={handleGiven}
                        disabled={actionLoading}
                        className="w-full h-12 text-base"
                        size="lg"
                      >
                        ✓ GIVEN
                      </Button>
                      
                      <Button 
                        onClick={() => setShowNotGivenForm(true)}
                        variant="outline"
                        className="w-full h-12 text-base border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        size="lg"
                      >
                        ✗ NOT GIVEN
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowNotGivenForm(false)}
                        variant="outline"
                        className="flex-1"
                        disabled={actionLoading}
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        onClick={handleNotGiven}
                        disabled={actionLoading || !notGivenReason.trim()}
                        variant="destructive"
                        className="flex-1"
                      >
                        Record as Not Given
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Close button for already processed medications */}
              {medication.status !== 'pending' && (
                <Button 
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}