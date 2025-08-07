import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { TimesPerDayPicker } from "@/components/ui/times-per-day-picker";
import { ArrowLeft, Upload, FileImage, Loader2, X, Plus, ChevronDown, ChevronRight, Bug } from "lucide-react";
import { toast } from "sonner";

const doseUnits = ["mg", "ml", "tablets", "capsules", "drops", "sprays", "units", "puffs"];
const medicationRoutes = ["Oral", "Topical", "Injection", "Inhalation", "Nasal", "Eye", "Ear"];

const medicationSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  name: z.string().min(1, "Medication name is required"),
  doseAmount: z.string().min(1, "Dose amount is required"),
  doseUnit: z.string().min(1, "Dose unit is required"),
  route: z.string().min(1, "Route is required"),
  isPRN: z.boolean().default(false),
  startDate: z.date().optional(),
  startTime: z.string().optional(),
  scheduleType: z.enum(["every_x_hours", "times_per_day", "specific_times"]).optional(),
  everyXHours: z.number().optional(),
  timesPerDay: z.number().optional(),
  specificTimes: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function UploadOCR() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [debugData, setDebugData] = useState<{
    geminiText?: string;
    aiResponse?: any;
    finalMedications?: any[];
    processingTime?: number;
    confidence?: number;
  } | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medications: [{
        childId: "",
        name: "",
        doseAmount: "",
        doseUnit: "mg",
        route: "Oral",
        isPRN: false,
        scheduleType: "every_x_hours",
        everyXHours: 8,
        timesPerDay: 2,
        specificTimes: ["08:00"],
        notes: "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "medications",
  });

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setUploadedFile(imageFile);
      toast.success("Image uploaded successfully");
    } else {
      toast.error("Please upload an image file");
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file);
      toast.success("Image uploaded successfully");
    } else {
      toast.error("Please upload an image file");
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setShowResults(false);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const launchOCR = async () => {
    if (!uploadedFile) return;
    
    setIsProcessingOCR(true);
    
    try {
      // Convert file to base64
      const base64DataUrl = await fileToBase64(uploadedFile);
      const base64Content = base64DataUrl.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      
      console.log(`📷 Processing ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // Call Supabase Edge Function (Gemini-based)
      const response = await fetch(
        "https://nqrtkgxqgenflhpijpxa.supabase.co/functions/v1/ocr-gemini",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRrZ3hxZ2VuZmxocGlqcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTY4NzcsImV4cCI6MjA2OTI3Mjg3N30.YFkNt9Zz3pG8uVQj6UmsTCWuOswW7wDRSS5GGmELaXI",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            imageBase64: base64Content,
            mimeType: uploadedFile.type
          })
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }
      
      if (result.success) {
        // Store debug data for troubleshooting
        setDebugData({
          geminiText: result.geminiText || "Gemini analysis not available",
          aiResponse: result.medications,
          processingTime: result.processingTime,
          confidence: result.confidence,
          finalMedications: [] // Will be set below
        });
        // Helper function to generate times based on timesPerDay
        const generateTimesFromCount = (count: number): string[] => {
          if (count === 1) return ["08:00"];
          if (count === 2) return ["08:00", "20:00"];
          if (count === 3) return ["08:00", "14:00", "20:00"];
          if (count === 4) return ["08:00", "12:00", "16:00", "20:00"];
          
          // For other counts, distribute evenly across the day
          const times: string[] = [];
          const hoursInDay = 24;
          const interval = hoursInDay / count;
          
          for (let i = 0; i < count; i++) {
            const hour = Math.round(8 + (i * interval)) % 24;
            times.push(`${hour.toString().padStart(2, '0')}:00`);
          }
          return times;
        };

        // Map AI response to form schema
        const formattedMedications = result.medications.map((med: any) => {
          const timesPerDay = med.timesPerDay || 2;
          let specificTimes: string[];

          // Generate specificTimes based on scheduleType
          if (med.scheduleType === "times_per_day") {
            specificTimes = generateTimesFromCount(timesPerDay);
          } else if (med.scheduleType === "specific_times") {
            specificTimes = med.specificTimes || ["08:00"];
          } else {
            // For every_x_hours, just set a default start time
            specificTimes = ["08:00"];
          }

          return {
            childId: "",
            name: med.name,
            doseAmount: med.doseAmount,
            doseUnit: med.doseUnit,
            route: med.route,
            isPRN: med.isPRN,
            startDate: new Date(),
            startTime: "08:00",
            scheduleType: med.scheduleType,
            everyXHours: med.everyXHours || 8,
            timesPerDay: timesPerDay,
            specificTimes: specificTimes,
            notes: med.notes || "",
          };
        });
        
        console.log(`✅ Successfully processed ${formattedMedications.length} medications with ${(result.confidence * 100).toFixed(1)}% confidence`);
        
        // Update debug data with final medications
        setDebugData(prev => ({
          ...prev!,
          finalMedications: formattedMedications
        }));
        
        form.setValue("medications", formattedMedications);
        setShowResults(true);
        
        // Show confidence-based message
        if (result.confidence > 0.8) {
          toast.success(`Gemini analysis completed successfully! Found ${formattedMedications.length} medications with high confidence.`);
        } else if (result.confidence > 0.6) {
          toast.success(`Gemini analysis completed! Found ${formattedMedications.length} medications. Please review the extracted information.`);
        } else {
          toast.warning(`Gemini analysis completed with low confidence. Please carefully review and correct the extracted information.`);
        }
      } else {
        throw new Error(result.error || "Gemini analysis failed");
      }
    } catch (error: any) {
      console.error("❌ Gemini Analysis Error:", error);
      toast.error(`Gemini Error: ${error.message || "Failed to analyze image"}`);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const addMedication = () => {
    append({
      childId: "",
      name: "",
      doseAmount: "",
      doseUnit: "mg",
      route: "Oral",
      isPRN: false,
      scheduleType: "every_x_hours",
      everyXHours: 8,
      timesPerDay: 2,
      specificTimes: ["08:00"],
      notes: "",
    });
  };

  const onSubmit = async (data: FormData) => {
    console.log("Saving medications:", data);
    toast.success("Medications saved successfully");
    navigate("/overview");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/overview")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Upload & OCR</h1>
            <p className="text-muted-foreground">
              Upload a photo of medication labels to automatically extract information
            </p>
          </div>
        </div>

        {/* Photo Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Medication Photo</CardTitle>
          </CardHeader>
          <CardContent>
            {!uploadedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Drag and drop your image here
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to select a file
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select Image
                  </label>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                  <FileImage className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={removeUploadedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={launchOCR}
                  disabled={isProcessingOCR}
                  className="w-full"
                >
                  {isProcessingOCR ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing with Gemini...
                    </>
                  ) : (
                    "Launch Gemini Analysis"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medication Forms Section */}
        {showResults && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <MedicationCard
                    key={field.id}
                    index={index}
                    form={form}
                    onRemove={() => remove(index)}
                    canRemove={fields.length > 1}
                  />
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Medication
              </Button>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/overview")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save All Medications
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Debug Panel */}
        {debugData && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg text-amber-800">
                    Gemini Analysis Debug Information
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-amber-700 hover:text-amber-900"
                >
                  {showDebug ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {showDebug ? "Hide" : "Show"} Debug Details
                </Button>
              </div>
              <div className="text-sm text-amber-700">
                Processing time: {debugData.processingTime}ms | 
                Confidence: {((debugData.confidence || 0) * 100).toFixed(1)}% |
                Gemini found: {debugData.aiResponse?.length || 0} medications |
                Final mapped: {debugData.finalMedications?.length || 0} medications
              </div>
            </CardHeader>
            
            {showDebug && (
              <CardContent className="space-y-4">
                {/* Gemini Analysis */}
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">1. Gemini Raw Response (Gemini 2.5 Flash Lite)</h4>
                  <div className="bg-white border rounded-md p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap text-gray-700">
                      {debugData.geminiText || "No Gemini response available"}
                    </pre>
                  </div>
                </div>

                {/* Structured Medications */}
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">2. Structured Medications (Gemini Parsed)</h4>
                  <div className="bg-white border rounded-md p-3 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(debugData.aiResponse || [], null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Final Form Data */}
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">3. Final Mapped Form Data</h4>
                  <div className="bg-white border rounded-md p-3 max-h-60 overflow-y-auto">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(debugData.finalMedications || [], null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Analysis */}
                <div className="bg-amber-100 border border-amber-200 rounded-md p-3">
                  <h4 className="font-semibold text-amber-800 mb-2">🔍 Quick Analysis</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <div>• Gemini Response Length: {(debugData.geminiText || "").length} characters</div>
                    <div>• Gemini Found: {debugData.aiResponse?.length || 0} medications</div>
                    <div>• Form Mapped: {debugData.finalMedications?.length || 0} medications</div>
                    <div>• Data Loss: {((debugData.aiResponse?.length || 0) - (debugData.finalMedications?.length || 0)) !== 0 ? "⚠️ Yes" : "✅ No"}</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function MedicationCard({
  index,
  form,
  onRemove,
  canRemove,
}: {
  index: number;
  form: any;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const watchIsPRN = form.watch(`medications.${index}.isPRN`);
  const watchScheduleType = form.watch(`medications.${index}.scheduleType`);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Medication {index + 1}</CardTitle>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Child Selection */}
        <FormField
          control={form.control}
          name={`medications.${index}.childId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">Emma Johnson</SelectItem>
                  <SelectItem value="2">Liam Johnson</SelectItem>
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
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Tylenol, Amoxicillin" {...field} />
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
                <FormLabel>Dose Amount</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 250" {...field} />
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
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
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

        {/* Route */}
        <FormField
          control={form.control}
          name={`medications.${index}.route`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Route</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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
          name={`medications.${index}.isPRN`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">PRN (As Needed)</FormLabel>
                <div className="text-sm text-muted-foreground">
                  This medication is taken only when needed
                </div>
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

        {/* Schedule Section - Only show if not PRN */}
        {!watchIsPRN && (
          <>
            {/* Start Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`medications.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`medications.${index}.startTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Dose Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule Type */}
            <FormField
              control={form.control}
              name={`medications.${index}.scheduleType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="every_x_hours">Every X Hours</SelectItem>
                      <SelectItem value="times_per_day">Times Per Day</SelectItem>
                      <SelectItem value="specific_times">Specific Times</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule Details */}
            {watchScheduleType === "every_x_hours" && (
              <FormField
                control={form.control}
                name={`medications.${index}.everyXHours`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Every X Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchScheduleType === "times_per_day" && (
              <FormField
                control={form.control}
                name={`medications.${index}.specificTimes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Times Per Day</FormLabel>
                    <FormControl>
                      <TimesPerDayPicker
                        count={form.watch(`medications.${index}.timesPerDay`) || 2}
                        value={field.value?.map((time, idx) => ({ id: idx.toString(), time })) || []}
                        onChange={(times) => field.onChange(times.map(t => t.time))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchScheduleType === "specific_times" && (
              <FormField
                control={form.control}
                name={`medications.${index}.specificTimes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Times</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value?.map((time, timeIndex) => (
                          <div key={timeIndex} className="flex gap-2">
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) => {
                                const newTimes = [...(field.value || [])];
                                newTimes[timeIndex] = e.target.value;
                                field.onChange(newTimes);
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                const newTimes = field.value?.filter((_, i) => i !== timeIndex);
                                field.onChange(newTimes);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newTimes = [...(field.value || []), "08:00"];
                            field.onChange(newTimes);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Time
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name={`medications.${index}.notes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes & Special Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special instructions or notes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}