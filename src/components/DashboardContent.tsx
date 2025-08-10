import { useState, useEffect, forwardRef } from 'react';
import { Plus, Upload, History, Calendar, Pill, MoreVertical, Filter, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DueMedicationsSection, type DueMedicationsSectionRef } from './DueMedicationsSection';
import { EditMedicationModal } from './EditMedicationModal';
import { PRNDoseModal } from './PRNDoseModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface Child {
  id: string;
  first_name: string;
}

interface Medication {
  id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  route: string;
  is_prn: boolean;
  child_id: string;
  child_name: string;
  notes?: string;
  start_datetime: string;
  schedule?: MedicationSchedule;
}

interface MedicationSchedule {
  id: string;
  medication_id: string;
  rule_type: string;
  times_per_day?: number;
  every_x_hours?: number;
  specific_times?: string[];
  active_from: string;
}

export const DashboardContent = forwardRef<DueMedicationsSectionRef>(function DashboardContent(_, ref) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [children, setChildren] = useState<Child[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | null>(null);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [prnMedication, setPrnMedication] = useState<Medication | null>(null);
  const [prnModalOpen, setPrnModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load children
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          id,
          first_name
        `)
        .order('first_name');

      if (childrenError) throw childrenError;

      // Get medications with child names and schedules
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select(`
          *,
          children!inner(first_name),
          medication_schedules(*)
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (medicationsError) throw medicationsError;

      const medicationsWithChildNames: Medication[] = medicationsData?.map(med => ({
        ...med,
        child_name: med.children.first_name,
        schedule: med.medication_schedules?.[0] ? {
          ...med.medication_schedules[0],
          specific_times: med.medication_schedules[0].specific_times 
            ? (Array.isArray(med.medication_schedules[0].specific_times) 
              ? med.medication_schedules[0].specific_times as string[]
              : typeof med.medication_schedules[0].specific_times === 'string'
                ? [med.medication_schedules[0].specific_times]
                : [])
            : undefined
        } : undefined
      })) || [];

      setChildren(childrenData || []);
      setMedications(medicationsWithChildNames);

      // Set schedules for backward compatibility
      const allSchedules = medicationsWithChildNames
        .filter(med => med.schedule)
        .map(med => ({
          ...med.schedule,
          specific_times: med.schedule.specific_times 
            ? (Array.isArray(med.schedule.specific_times) 
              ? med.schedule.specific_times as string[]
              : typeof med.schedule.specific_times === 'string'
                ? [med.schedule.specific_times]
                : [])
            : undefined
        }));
      
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load medications data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = selectedChildFilter
    ? medications.filter(med => med.child_id === selectedChildFilter)
    : medications;

  const scheduledMeds = filteredMedications.filter(med => !med.is_prn);
  const prnMeds = filteredMedications.filter(med => med.is_prn);

  const getScheduleInfo = (medication: Medication) => {
    const schedule = schedules.find(s => s.medication_id === medication.id);
    if (!schedule) return "No schedule";

    switch (schedule.rule_type) {
      case 'times_per_day':
        return `${schedule.times_per_day} times daily`;
      case 'every_x_hours':
        return `Every ${schedule.every_x_hours} hours`;
      case 'specific_times':
        return `${schedule.specific_times?.length || 0} times daily`;
      default:
        return "Custom schedule";
    }
  };

  const getNextDoseTime = async (medication: Medication) => {
    if (medication.is_prn) {
      return "As needed";
    }

    try {
      // Query the next pending dose instance directly from the database
      const { data: nextDose, error } = await supabase
        .from('dose_instances')
        .select('due_datetime')
        .eq('medication_id', medication.id)
        .eq('status', 'pending')
        .gte('due_datetime', new Date().toISOString())
        .order('due_datetime', { ascending: true })
        .limit(1)
        .single();

      if (error || !nextDose) {
        return "Not scheduled";
      }

      const dueTime = new Date(nextDose.due_datetime);
      const hours = dueTime.getHours();
      const minutes = dueTime.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      
      const now = new Date();
      const isToday = dueTime.toDateString() === now.toDateString();
      const isTomorrow = dueTime.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
      
      let timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      
      if (!isToday && isTomorrow) {
        timeString += " (tomorrow)";
      } else if (!isToday) {
        timeString += ` (${dueTime.toLocaleDateString()})`;
      }
      
      return timeString;
    } catch (error) {
      console.error('Error fetching next dose time:', error);
      return "Not scheduled";
    }
  };

  // Helper to get next dose time synchronously for rendering
  const [nextDoseTimes, setNextDoseTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadNextDoseTimes = async () => {
      const times: Record<string, string> = {};
      
      for (const med of medications) {
        if (med.is_prn) {
          times[med.id] = "As needed";
        } else {
          times[med.id] = await getNextDoseTime(med);
        }
      }
      
      setNextDoseTimes(times);
    };

    if (medications.length > 0) {
      loadNextDoseTimes();
    }
  }, [medications]);

  const handleAddNewMed = () => {
    navigate('/add-medication');
  };

  const handleUploadPhoto = () => {
    navigate('/upload-ocr');
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleEnterPRNDose = (medId: string) => {
    const medication = medications.find(med => med.id === medId);
    if (medication) {
      setPrnMedication(medication);
      setPrnModalOpen(true);
    }
  };

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setEditingMedication(null);
    loadData();
  };

  const handlePRNDoseSuccess = () => {
    setPrnModalOpen(false);
    setPrnMedication(null);
    loadData(); // Refresh to update any relevant data
  };

  const handleStopMedication = async (medicationId: string) => {
    try {
      // Archive the medication
      const { error: medicationError } = await supabase
        .from('medications')
        .update({ 
          archived_at: new Date().toISOString(),
          stopped_reason: 'Stopped by user'
        })
        .eq('id', medicationId);

      if (medicationError) throw medicationError;

      // Delete future pending dose instances for this medication
      const { error: doseInstancesError } = await supabase
        .from('dose_instances')
        .delete()
        .eq('medication_id', medicationId)
        .eq('status', 'pending')
        .gte('due_datetime', new Date().toISOString());

      if (doseInstancesError) {
        console.error('Error deleting future dose instances:', doseInstancesError);
        // Don't throw here - we still want to show success for stopping the medication
      }

      toast({
        title: "Medication stopped",
        description: "The medication has been successfully stopped.",
      });

      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error stopping medication:', error);
      toast({
        title: "Error",
        description: "Failed to stop medication. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-background max-w-full overflow-x-hidden">
      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 lg:px-6 max-w-full">
          <div className="flex items-center gap-2 lg:gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-lg font-semibold lg:text-2xl">Overview</h1>
              <p className="text-xs text-muted-foreground lg:hidden">Medication Management</p>
            </div>
          </div>
          
          {/* Mobile Action Menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="lg:hidden">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleAddNewMed}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Med
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleUploadPhoto}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewHistory}>
                  <History className="h-4 w-4 mr-2" />
                  View History
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button onClick={handleUploadPhoto} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photo
              </Button>
              <Button onClick={handleAddNewMed} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New Med
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 lg:p-6 space-y-6 max-w-full overflow-x-hidden">
        {/* Quick Actions - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95" 
            onClick={handleAddNewMed}
          >
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm lg:text-base">Add Medication</span>
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Add a new medication to your schedule
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95" 
            onClick={handleUploadPhoto}
          >
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm lg:text-base">AI Image Analysis</span>
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Upload prescription photos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-95 sm:col-span-2 lg:col-span-1" 
            onClick={handleViewHistory}
          >
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <History className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm lg:text-base">View History</span>
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Review medication history
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Due Medications Section */}
        <DueMedicationsSection ref={ref} />

        {/* Child Filter Pills */}
        {children.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filter by child:</span>
            </div>
            <Button
              variant={selectedChildFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChildFilter(null)}
              className="h-7 px-3 text-xs"
            >
              All Children
            </Button>
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChildFilter === child.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChildFilter(child.id)}
                className="h-7 px-3 text-xs"
              >
                {child.first_name}
              </Button>
            ))}
          </div>
        )}

        {/* Medications Tabs - Mobile Optimized */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="scheduled" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Calendar className="h-3 w-3 lg:h-4 lg:w-4" />
              <span className="hidden sm:inline">Scheduled ({scheduledMeds.length})</span>
              <span className="sm:hidden">Schedule ({scheduledMeds.length})</span>
            </TabsTrigger>
            <TabsTrigger value="prn" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm">
              <Pill className="h-3 w-3 lg:h-4 lg:w-4" />
              <span>PRN ({prnMeds.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Scheduled Medications */}
          <TabsContent value="scheduled" className="space-y-3 lg:space-y-4 mt-4">
            {scheduledMeds.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 lg:py-12">
                  <Calendar className="h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm lg:text-base mb-4">
                    No scheduled medications yet.
                  </p>
                  <Button onClick={handleAddNewMed} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Medication
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {scheduledMeds.map((med) => (
                  <Card key={med.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <div className="space-y-3">
                        {/* Top row - Med name and dropdown menu */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base lg:text-lg leading-tight break-words pr-2">
                              {med.name}
                            </CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50 bg-popover">
                              <DropdownMenuItem onClick={() => handleEditMedication(med)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStopMedication(med.id)}>
                                Stop Medication
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Middle row - Dose info and child badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <CardDescription className="text-xs lg:text-sm flex-1">
                            {med.dose_amount} {med.dose_unit} • {getScheduleInfo(med)}
                          </CardDescription>
                          <Badge variant="secondary" className="text-xs w-fit">
                            {med.child_name}
                          </Badge>
                        </div>
                        
                        {/* Bottom row - Next dose time */}
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs">
                            Next: {nextDoseTimes[med.id] || "Loading..."}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRN Medications */}
          <TabsContent value="prn" className="space-y-3 lg:space-y-4 mt-4">
            {prnMeds.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 lg:py-12">
                  <Pill className="h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm lg:text-base mb-4">
                    No PRN medications yet.
                  </p>
                  <Button onClick={handleAddNewMed} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First PRN Medication
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {prnMeds.map((med) => (
                  <Card key={med.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <div className="space-y-3">
                        {/* Top row - Med name and dropdown menu */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base lg:text-lg leading-tight break-words pr-2">
                              {med.name}
                            </CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-50 bg-popover">
                              <DropdownMenuItem onClick={() => handleEditMedication(med)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStopMedication(med.id)}>
                                Stop Medication
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Middle row - Dose info and child badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <CardDescription className="text-xs lg:text-sm flex-1">
                            {med.dose_amount} {med.dose_unit} • As needed
                          </CardDescription>
                          <Badge variant="secondary" className="text-xs w-fit">
                            {med.child_name}
                          </Badge>
                        </div>
                        
                        {/* Notes row - if present */}
                        {med.notes && (
                          <div className="flex items-start">
                            <p className="text-xs text-muted-foreground">
                              Notes: {med.notes}
                            </p>
                          </div>
                        )}
                        
                        {/* Bottom row - Enter dose button */}
                        <div className="flex items-center pt-1">
                          <Button 
                            size="sm" 
                            onClick={() => handleEnterPRNDose(med.id)}
                            className="w-full sm:w-auto text-xs lg:text-sm min-h-[36px] touch-manipulation"
                          >
                            Enter Dose
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Medication Modal */}
        <EditMedicationModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          medication={editingMedication}
          onSuccess={handleEditSuccess}
        />

        {/* PRN Dose Modal */}
        <PRNDoseModal
          open={prnModalOpen}
          onClose={() => setPrnModalOpen(false)}
          medication={prnMedication}
          onSuccess={handlePRNDoseSuccess}
        />
      </div>
    </div>
  );
});