import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, User } from 'lucide-react';
import { DoseConfirmationModal } from './DoseConfirmationModal';
import { format, isToday, isTomorrow } from 'date-fns';
import { getDueMedications } from '@/lib/doseInstances';

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

export function DueMedicationsSection() {
  const { user } = useAuth();
  const [dueMedications, setDueMedications] = useState<DueMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedication, setSelectedMedication] = useState<DueMedication | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadDueMedications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dueMeds = await getDueMedications();
      
      // Sort by urgency and time
      dueMeds.sort((a, b) => {
        const urgencyOrder = { overdue: 0, due: 1, upcoming: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return new Date(a.due_datetime).getTime() - new Date(b.due_datetime).getTime();
      });

      setDueMedications(dueMeds);
    } catch (error) {
      console.error('Error loading due medications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueMedications();
    
    // Refresh every minute to update due status
    const interval = setInterval(loadDueMedications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCardClick = (medication: DueMedication) => {
    setSelectedMedication(medication);
    setModalOpen(true);
  };

  const handleDoseConfirmed = () => {
    setModalOpen(false);
    setSelectedMedication(null);
    // Refresh the due medications list
    loadDueMedications();
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      case 'due':
        return <Badge variant="default" className="text-xs">Due Now</Badge>;
      case 'upcoming':
        return <Badge variant="outline" className="text-xs">Soon</Badge>;
      default:
        return null;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'due':
        return <Clock className="w-4 h-4 text-primary" />;
      case 'upcoming':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Due Medications</h2>
        <div className="animate-pulse">
          <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (dueMedications.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Due Medications</h2>
        <Card className="border-dashed border-2">
          <CardContent className="py-6 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No medications due right now</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Due Medications</h2>
        <div className="relative w-full overflow-hidden">
          <div 
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {dueMedications.map((medication) => {
              const dueTime = new Date(medication.due_datetime);
              const formatDateTime = (date: Date) => {
                if (isToday(date)) {
                  return `Today at ${format(date, 'HH:mm')}`;
                } else if (isTomorrow(date)) {
                  return `Tomorrow at ${format(date, 'HH:mm')}`;
                } else {
                  return format(date, 'EEE, MMM d \'at\' HH:mm');
                }
              };

              return (
                <Card 
                  key={medication.dose_instance_id}
                  className={`w-60 sm:w-64 min-h-32 flex-shrink-0 cursor-pointer transition-all hover:shadow-md ${
                    medication.urgency === 'overdue' 
                      ? 'border-destructive bg-destructive/5' 
                      : medication.urgency === 'due'
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                  onClick={() => handleCardClick(medication)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getUrgencyIcon(medication.urgency)}
                        <span className="font-medium text-foreground">{medication.name}</span>
                      </div>
                      {getUrgencyBadge(medication.urgency)}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{medication.child_name}</span>
                      </div>
                      
                      <div className="text-foreground">
                        <strong>{medication.dose_amount} {medication.dose_unit}</strong>
                      </div>
                      
                      <div className="text-muted-foreground">
                        {formatDateTime(dueTime)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {selectedMedication && (
        <DoseConfirmationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          medication={selectedMedication}
          onConfirm={handleDoseConfirmed}
        />
      )}
    </>
  );
}