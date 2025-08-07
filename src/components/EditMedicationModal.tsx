import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TimePicker, TimeEntry } from "@/components/ui/time-picker";
import { TimesPerDayPicker } from "@/components/ui/times-per-day-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { updateDoseInstancesForMedication } from "@/lib/doseInstances";

const doseUnits = [
  "mg", "g", "ml", "mL", "tsp", "tbsp", "drops", "puffs", "units", "tablets", "capsules", "ND", "application"
];

const medicationRoutes = [
  "Oral",
  "Via nasogastic tube", 
  "Via nasojejeunal tube",
  "Via gastric tube",
  "Sublingual",
  "Subcutaneous", 
  "Intravenous",
  "Transdermal"
];

interface Child {
  id: string;
  first_name: string;
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

interface MedicationData {
  id: string;
  name: string;
  dose_amount: number;
  dose_unit: string;
  route: string;
  is_prn: boolean;
  child_id: string;
  notes?: string;
  start_datetime: string;
  schedule?: MedicationSchedule;
}

interface EditMedicationModalProps {
  open: boolean;
  onClose: () => void;
  medication: MedicationData | null;
  onSuccess: () => void;
}

const medicationSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  name: z.string().min(1, "Medication name is required"),
  doseAmount: z.number().min(0.01, "Dose amount must be greater than 0"),
  doseUnit: z.string().min(1, "Please select a dose unit"),
  route: z.string().min(1, "Please select a route"),
  startDateTime: z.date(),
  notes: z.string().optional(),
  scheduleType: z.enum(["every_x_hours", "times_per_day", "specific_times"]).optional(),
  scheduleDetail: z.string().optional(),
  timesPerDayCount: z.number().min(1).max(5).optional(),
  timesPerDayTimes: z.array(z.object({
    id: z.string(),
    time: z.string()
  })).default([]),
  specificTimes: z.array(z.object({
    id: z.string(),
    time: z.string()
  })).default([]),
}).superRefine((data, ctx) => {
  // Validate schedule fields for scheduled medications (non-PRN)
  if (data.scheduleType) {
    if (data.scheduleType === "every_x_hours") {
      if (!data.scheduleDetail || data.scheduleDetail.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Schedule details are required for scheduled medications",
          path: ["scheduleDetail"],
        });
      } else {
        const hours = parseFloat(data.scheduleDetail.trim());
        if (isNaN(hours) || hours <= 0 || hours > 24) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter a valid number of hours (1-24)",
            path: ["scheduleDetail"],
          });
        }
      }
    } else if (data.scheduleType === "times_per_day") {
      if (!data.timesPerDayCount || data.timesPerDayCount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select how many times per day",
          path: ["timesPerDayCount"],
        });
      }
      if (!data.timesPerDayTimes || data.timesPerDayTimes.length !== data.timesPerDayCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please set times for all doses",
          path: ["timesPerDayTimes"],
        });
      }
    } else if (data.scheduleType === "specific_times") {
      if (!data.specificTimes || data.specificTimes.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please add at least one time for specific times schedule",
          path: ["specificTimes"],
        });
      }
    }
  }
});

export function EditMedicationModal({ open, onClose, medication, onSuccess }: EditMedicationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      childId: "",
      name: "",
      doseAmount: 0,
      doseUnit: "",
      route: "",
      startDateTime: new Date(),
      notes: "",
      scheduleType: undefined,
      scheduleDetail: "",
      timesPerDayCount: 1,
      timesPerDayTimes: [],
      specificTimes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "specificTimes",
  });

  const scheduleType = form.watch("scheduleType");
  const timesPerDayCount = form.watch("timesPerDayCount");

  // Load children on component mount
  useEffect(() => {
    const loadChildren = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('children')
        .select('id, first_name')
        .order('first_name');

      if (error) {
        console.error('Error loading children:', error);
        return;
      }

      setChildren(data || []);
    };

    if (open) {
      loadChildren();
    }
  }, [user, open]);

  // Populate form when medication prop changes
  useEffect(() => {
    if (medication && open) {
      const startDate = new Date(medication.start_datetime);
      
      form.reset({
        childId: medication.child_id,
        name: medication.name,
        doseAmount: medication.dose_amount,
        doseUnit: medication.dose_unit,
        route: medication.route,
        startDateTime: startDate,
        notes: medication.notes || "",
        scheduleType: medication.schedule?.rule_type as any,
        scheduleDetail: medication.schedule?.rule_type === "every_x_hours" 
          ? medication.schedule.every_x_hours?.toString() 
          : "",
        timesPerDayCount: medication.schedule?.rule_type === "times_per_day"
          ? medication.schedule.times_per_day || 1
          : 1,
        timesPerDayTimes: medication.schedule?.rule_type === "times_per_day" && medication.schedule?.specific_times
          ? medication.schedule.specific_times.map((time, index): TimeEntry => ({
            id: `time-${index}`,
            time: time
          }))
          : [],
        specificTimes: medication.schedule?.rule_type === "specific_times" && medication.schedule?.specific_times
          ? medication.schedule.specific_times.map((time, index): TimeEntry => ({
            id: `time-${index}`,
            time: time
          }))
          : [],
      });
    }
  }, [medication, open, form]);

  const onSubmit = async (values: z.infer<typeof medicationSchema>) => {
    if (!user || !medication) return;

    try {
      setLoading(true);

      // Update medication
      const { error: medicationError } = await supabase
        .from('medications')
        .update({
          name: values.name,
          dose_amount: values.doseAmount,
          dose_unit: values.doseUnit,
          route: values.route,
          child_id: values.childId,
          start_datetime: values.startDateTime.toISOString(),
          notes: values.notes || null,
        })
        .eq('id', medication.id);

      if (medicationError) throw medicationError;

      // Update schedule for non-PRN medications
      if (!medication.is_prn && values.scheduleType && medication.schedule) {
        let scheduleData: any = {
          rule_type: values.scheduleType,
          specific_times: null,
          every_x_hours: null,
          times_per_day: null,
          active_from: values.startDateTime.toISOString(),
        };

        if (values.scheduleType === "every_x_hours" && values.scheduleDetail) {
          scheduleData.every_x_hours = parseInt(values.scheduleDetail, 10);
        } else if (values.scheduleType === "times_per_day" && values.timesPerDayTimes) {
          scheduleData.times_per_day = values.timesPerDayCount;
          scheduleData.specific_times = values.timesPerDayTimes.map(item => item.time);
        } else if (values.scheduleType === "specific_times" && values.specificTimes) {
          scheduleData.specific_times = values.specificTimes.map(item => item.time);
        }

        const { error: scheduleError } = await supabase
          .from('medication_schedules')
          .update(scheduleData)
          .eq('id', medication.schedule.id);

        if (scheduleError) throw scheduleError;

        // Update dose instances for the medication
        await updateDoseInstancesForMedication(medication.id);
      }

      toast({
        title: "Medication updated",
        description: `${values.name} has been successfully updated.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        title: "Error",
        description: "Failed to update medication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = () => {
    append({
      id: `time-${Date.now()}`,
      time: "09:00"
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!medication) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Child Selection */}
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Child</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select child" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.first_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Medication Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tylenol" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dose Amount */}
              <FormField
                control={form.control}
                name="doseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dose Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dose Unit */}
              <FormField
                control={form.control}
                name="doseUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dose Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doseUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Route of Administration */}
            <FormField
              control={form.control}
              name="route"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Route of Administration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {medicationRoutes.map((route) => (
                        <SelectItem key={route} value={route}>
                          {route}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date/Time */}
            <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date & Time</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pick a date and time"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule Section for non-PRN medications */}
            {!medication.is_prn && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Schedule</h3>
                
                <FormField
                  control={form.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Schedule Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="every_x_hours" id="every_x_hours" />
                            <Label htmlFor="every_x_hours">Every X hours</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="times_per_day" id="times_per_day" />
                            <Label htmlFor="times_per_day">X times per day</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific_times" id="specific_times" />
                            <Label htmlFor="specific_times">Specific times</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Schedule Detail Input for every_x_hours */}
                {scheduleType === "every_x_hours" && (
                  <FormField
                    control={form.control}
                    name="scheduleDetail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours between doses</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 8"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the number of hours between each dose (1-24)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Times Per Day Section */}
                {scheduleType === "times_per_day" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="timesPerDayCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How many times per day?</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const count = parseInt(value);
                              field.onChange(count);
                              // Reset times when count changes
                              form.setValue("timesPerDayTimes", []);
                            }} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select number of times" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} time{num > 1 ? 's' : ''} per day
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timesPerDayTimes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Set times for each dose</FormLabel>
                          <FormControl>
                            <TimesPerDayPicker
                              count={timesPerDayCount || 1}
                              value={(field.value || []).filter((t): t is TimeEntry => 
                                Boolean(t.id && t.time)
                              )}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Set the specific time for each dose
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Specific Times */}
                {scheduleType === "specific_times" && (
                  <FormField
                    control={form.control}
                    name="specificTimes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Times</FormLabel>
                        <FormControl>
                          <TimePicker
                            value={(field.value || []) as TimeEntry[]}
                            onChange={(times: TimeEntry[]) => field.onChange(times)}
                          />
                        </FormControl>
                        <FormDescription>
                          Add specific times when this medication should be taken
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this medication..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Medication"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}