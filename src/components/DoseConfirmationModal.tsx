import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday, isTomorrow } from 'date-fns';
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
import { Pill, User, Clock, AlertTriangle } from 'lucide-react';

interface DueMedication {
  id: string;
  dose_instance_id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  child_id: string;
  child_name: string;
  due_datetime: string;
  urgency: 'due' | 'overdue' | 'upcoming';
}

interface DoseConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  medication: DueMedication;
  onConfirm: () => void;
}

export function DoseConfirmationModal({ 
  open, 
  onClose, 
  medication, 
  onConfirm 
}: DoseConfirmationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showNotGivenForm, setShowNotGivenForm] = useState(false);
  const [notGivenReason, setNotGivenReason] = useState('');

  const handleGiven = async () => {
    if (!user) return;

    try {
      setLoading(true);

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

      onConfirm();
    } catch (error) {
      console.error('Error recording dose:', error);
      toast({
        title: "Error",
        description: "Failed to record dose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotGiven = async () => {
    if (!user || !notGivenReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for not giving the medication.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

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

      onConfirm();
    } catch (error) {
      console.error('Error recording missed dose:', error);
      toast({
        title: "Error",
        description: "Failed to record missed dose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowNotGivenForm(false);
    setNotGivenReason('');
    onClose();
  };

  const getUrgencyColor = () => {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5" />
            Medication Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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

          {/* Not Given Form */}
          {showNotGivenForm && (
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
          <div className="space-y-3">
            {!showNotGivenForm ? (
              <>
                <Button 
                  onClick={handleGiven}
                  disabled={loading}
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleNotGiven}
                  disabled={loading || !notGivenReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  Record as Not Given
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}