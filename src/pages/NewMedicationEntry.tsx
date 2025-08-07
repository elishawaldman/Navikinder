import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Camera, KeyboardIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { TimePicker, TimeEntry } from "@/components/ui/time-picker";
import { TimesPerDayPicker } from "@/components/ui/times-per-day-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateDoseInstances } from "@/lib/doseInstances";

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

// Schema for individual medication
const medicationSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  name: z.string().min(1, "Medication name is required"),
  doseAmount: z.number().min(0.01, "Dose amount must be greater than 0"),
  doseUnit: z.string().min(1, "Please select a dose unit"),
  route: z.string().min(1, "Please select a route of administration"),
  startDateTime: z.date(),
  notes: z.string().optional(),
  isPrn: z.boolean(),
  scheduleType: z.enum(["every_x_hours", "times_per_day", "specific_times"]).optional(),
  scheduleDetail: z.string().optional(),
  timesPerDayCount: z.number().optional(),
  timesPerDayTimes: z.array(z.object({
    id: z.string(),
    time: z.string()
  })).optional(),
  specificTimes: z.array(z.object({
    id: z.string(),
    time: z.string()
  })).optional(),
}).superRefine((data, ctx) => {
  // Only validate schedule fields if not PRN
  if (!data.isPrn) {
    if (!data.scheduleType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule type is required for scheduled medications",
        path: ["scheduleType"],
      });
    }
    
    // Validate based on schedule type
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
      if (!data.timesPerDayCount || data.timesPerDayCount <= 0 || data.timesPerDayCount > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a valid number of times per day (1-5)",
          path: ["timesPerDayCount"],
        });
      }
      if (!data.timesPerDayTimes || data.timesPerDayTimes.length !== data.timesPerDayCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please set a time for each dose",
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

// Form schema with array of medications
const formSchema = z.object({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function NewMedicationEntry() {
  const [entryMethod, setEntryMethod] = useState<"manual" | "ocr">("manual");
  const [children, setChildren] = useState<Array<{id: string, first_name: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medications: [{
        childId: "",
        name: "",
        doseAmount: 0,
        doseUnit: "",
        route: "",
        startDateTime: new Date(),
        notes: "",
        isPrn: false,
        scheduleType: "every_x_hours",
        scheduleDetail: "",
        timesPerDayCount: 1,
        timesPerDayTimes: [],
        specificTimes: [],
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  // Load children on component mount
  useEffect(() => {
    const loadChildren = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('children')
          .select(`
            id,
            first_name,
            child_profiles!inner(profile_id)
          `)
          .eq('child_profiles.profile_id', user.id);

        if (error) throw error;
        setChildren(data || []);
      } catch (error) {
        console.error('Error loading children:', error);
        toast({
          title: "Error",
          description: "Failed to load children. Please try again.",
          variant: "destructive",
        });
      }
    };

    loadChildren();
  }, [user, toast]);

  const saveMedicationToDatabase = async (medicationData: any) => {
    if (!user) throw new Error('User not authenticated');

    // Insert medication
    const { data: medicationResult, error: medicationError } = await supabase
      .from('medications')
      .insert({
        child_id: medicationData.childId,
        name: medicationData.name,
        dose_amount: medicationData.doseAmount,
        dose_unit: medicationData.doseUnit,
        route: medicationData.route,
        is_prn: medicationData.isPrn,
        start_datetime: medicationData.startDateTime.toISOString(),
        notes: medicationData.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (medicationError) throw medicationError;

    // If not PRN, create schedule
    if (!medicationData.isPrn && medicationData.scheduleType) {
      const scheduleData: any = {
        medication_id: medicationResult.id,
        rule_type: medicationData.scheduleType,
        active_from: medicationData.startDateTime.toISOString(),
      };

      // Parse schedule details based on type
      if (medicationData.scheduleType === "every_x_hours") {
        scheduleData.every_x_hours = parseInt(medicationData.scheduleDetail, 10);
      } else if (medicationData.scheduleType === "times_per_day") {
        scheduleData.times_per_day = medicationData.timesPerDayCount;
        // Store the specific times for times_per_day
        if (medicationData.timesPerDayTimes && medicationData.timesPerDayTimes.length > 0) {
          scheduleData.specific_times = medicationData.timesPerDayTimes.map((entry: TimeEntry) => entry.time);
        }
      } else if (medicationData.scheduleType === "specific_times") {
        // Convert TimeEntry[] to string array for database storage
        if (medicationData.specificTimes && medicationData.specificTimes.length > 0) {
          scheduleData.specific_times = medicationData.specificTimes.map((entry: TimeEntry) => entry.time);
        }
      }

      const { data: scheduleResult, error: scheduleError } = await supabase
        .from('medication_schedules')
        .insert(scheduleData)
        .select()
        .single();

      if (scheduleError) throw scheduleError;

      // Generate dose instances for the new medication
      await generateDoseInstances({
        id: medicationResult.id,
        child_id: medicationResult.child_id,
        dose_amount: medicationResult.dose_amount,
        dose_unit: medicationResult.dose_unit,
        start_datetime: medicationResult.start_datetime,
        medication_schedules: [{
          id: scheduleResult.id,
          rule_type: scheduleResult.rule_type,
          every_x_hours: scheduleResult.every_x_hours,
          times_per_day: scheduleResult.times_per_day,
          specific_times: scheduleResult.specific_times,
          active_from: scheduleResult.active_from
        }]
      });
    }

    return medicationResult;
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add medications.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Process and save each medication
      const savePromises = data.medications.map(med => saveMedicationToDatabase(med));

      await Promise.all(savePromises);
      
      toast({
        title: "Success",
        description: `Successfully added ${data.medications.length} medication(s)`,
      });
      
      // Navigate back to overview
      navigate('/overview');
      
    } catch (error) {
      console.error('Error saving medications:', error);
      toast({
        title: "Error",
        description: "Failed to save medications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMedication = () => {
    append({
      childId: "",
      name: "",
      doseAmount: 0,
      doseUnit: "",
      route: "",
      startDateTime: new Date(),
      notes: "",
      isPrn: false,
      scheduleType: "every_x_hours",
      scheduleDetail: "",
      timesPerDayCount: 1,
      timesPerDayTimes: [],
      specificTimes: [],
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/overview')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add New Medication</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Add one or more medications to your child's medication list
          </p>
        </div>

        {/* Entry Method Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">How would you like to add medication?</CardTitle>
            <CardDescription className="text-sm">
              Choose between manual entry or scanning a medication label
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant={entryMethod === "manual" ? "default" : "outline"}
                onClick={() => setEntryMethod("manual")}
                className="w-full sm:flex-1 justify-center"
              >
                <KeyboardIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Manual Entry</span>
              </Button>
              <Button
                variant={entryMethod === "ocr" ? "default" : "outline"}
                onClick={() => setEntryMethod("ocr")}
                className="w-full sm:flex-1 justify-center"
                disabled
              >
                <Camera className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Scan Label (Coming Soon)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {fields.map((field, index) => (
              <MedicationCard
                key={field.id}
                index={index}
                form={form}
                children={children}
                onRemove={fields.length > 1 ? () => remove(index) : undefined}
              />
            ))}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                className="w-full sm:flex-1 justify-center"
              >
                <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Add Another Medication</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                type="submit" 
                className="w-full sm:flex-1 order-1 sm:order-none"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save All Medications"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto order-2 sm:order-none"
                onClick={() => navigate('/overview')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

interface MedicationCardProps {
  index: number;
  form: any;
  onRemove?: () => void;
  children: Array<{id: string, first_name: string}>;
}

function MedicationCard({ index, form, onRemove, children }: MedicationCardProps) {
  const isPrn = form.watch(`medications.${index}.isPrn`);
  const scheduleType = form.watch(`medications.${index}.scheduleType`);
  const timesPerDayCount = form.watch(`medications.${index}.timesPerDayCount`) || 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Medication {index + 1}
          </CardTitle>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Child Selector */}
        <FormField
          control={form.control}
          name={`medications.${index}.childId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a child" />
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
          name={`medications.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Amoxicillin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dose Amount and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`medications.${index}.doseAmount`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dose Amount *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`medications.${index}.doseUnit`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          name={`medications.${index}.route`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route of Administration *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select route of administration" />
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

        {/* PRN Toggle */}
        <FormField
          control={form.control}
          name={`medications.${index}.isPrn`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Is this a PRN (as-needed) medication?
                </FormLabel>
                <FormDescription>
                  PRN medications are taken only when needed, not on a regular schedule
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Schedule Fields - Only show if NOT PRN */}
        {!isPrn && (
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Medication Schedule</h3>
            
            {/* Start Date/Time */}
            <FormField
              control={form.control}
              name={`medications.${index}.startDateTime`}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date & Time *</FormLabel>
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
            
            <FormField
              control={form.control}
              name={`medications.${index}.scheduleType`}
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Schedule Type *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="every_x_hours" id={`every_x_hours_${index}`} />
                        <Label htmlFor={`every_x_hours_${index}`}>Every X hours</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="times_per_day" id={`times_per_day_${index}`} />
                        <Label htmlFor={`times_per_day_${index}`}>Times per day</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific_times" id={`specific_times_${index}`} />
                        <Label htmlFor={`specific_times_${index}`}>Specific times</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {scheduleType === "every_x_hours" && (
              <FormField
                control={form.control}
                name={`medications.${index}.scheduleDetail`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Details *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 8 (every 8 hours)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the number of hours between doses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {scheduleType === "times_per_day" && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name={`medications.${index}.timesPerDayCount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many times per day? *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const count = parseInt(value);
                          field.onChange(count);
                          // Reset times when count changes
                          form.setValue(`medications.${index}.timesPerDayTimes`, []);
                        }} 
                        defaultValue={field.value?.toString()}
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
                  name={`medications.${index}.timesPerDayTimes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Set times for each dose *</FormLabel>
                      <FormControl>
                        <TimesPerDayPicker
                          count={timesPerDayCount}
                          value={field.value || []}
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

            {scheduleType === "specific_times" && (
              <FormField
                control={form.control}
                name={`medications.${index}.specificTimes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Times *</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value || []}
                        onChange={field.onChange}
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
          name={`medications.${index}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes / Special Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special instructions or notes about this medication..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional notes about how to take this medication
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}