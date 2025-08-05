import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface Medication {
  id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  child_id: string;
  child_name: string;
}

interface PRNDoseModalProps {
  open: boolean;
  onClose: () => void;
  medication: Medication | null;
  onSuccess: () => void;
}

export function PRNDoseModal({ open, onClose, medication, onSuccess }: PRNDoseModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [doseAmount, setDoseAmount] = useState('');
  const [givenDateTime, setGivenDateTime] = useState<Date>(new Date());
  const [reasonGiven, setReasonGiven] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setDoseAmount('');
    setGivenDateTime(new Date());
    setReasonGiven('');
    setIsSubmitting(false);
    onClose();
  };

  const handleSave = async () => {
    if (!medication || !user) return;

    const amount = parseFloat(doseAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid dose amount",
        description: "Please enter a valid dose amount",
        variant: "destructive",
      });
      return;
    }

    if (!reasonGiven.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for giving this PRN medication",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('dose_logs')
        .insert({
          medication_id: medication.id,
          child_id: medication.child_id,
          amount_given: amount,
          unit: medication.dose_unit,
          given_datetime: givenDateTime.toISOString(),
          recorded_by: user.id,
          was_given: true,
          is_prn: true,
          reason_given: reasonGiven.trim()
        });

      if (error) throw error;

      toast({
        title: "PRN dose recorded",
        description: `Successfully recorded ${amount} ${medication.dose_unit} of ${medication.name} for ${medication.child_name}`,
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error recording PRN dose:', error);
      toast({
        title: "Error",
        description: "Failed to record PRN dose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-full max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Record PRN Dose
          </DialogTitle>
          <div className="text-sm text-muted-foreground mt-2">
            <div className="font-medium">{medication.name}</div>
            <div>For: {medication.child_name}</div>
            <div>Standard dose: {medication.dose_amount} {medication.dose_unit}</div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="dose-amount">Dose Given</Label>
            <div className="flex gap-2">
              <Input
                id="dose-amount"
                type="number"
                placeholder={medication.dose_amount.toString()}
                value={doseAmount}
                onChange={(e) => setDoseAmount(e.target.value)}
                step="0.1"
                min="0"
                className="flex-1"
              />
              <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium min-w-0">
                {medication.dose_unit}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date & Time Given</Label>
            <DateTimePicker
              value={givenDateTime}
              onChange={setGivenDateTime}
              placeholder="Select date and time"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason Given</Label>
            <Textarea
              id="reason"
              placeholder="Why was this PRN medication given? (e.g., fever, pain, anxiety, etc.)"
              value={reasonGiven}
              onChange={(e) => setReasonGiven(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Recording..." : "Save Dose"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}