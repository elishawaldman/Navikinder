// process-medication-ocr/index.ts - Edge function for OCR + AI medication parsing
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OCRRequest {
  imageBase64: string;
  mimeType: string;
}

interface MedicationData {
  name: string;
  doseAmount: string;
  doseUnit: string;
  route: string;
  isPRN: boolean;
  scheduleType: "every_x_hours" | "times_per_day" | "specific_times";
  everyXHours?: number;
  timesPerDay?: number;
  specificTimes?: string[];
  notes?: string;
  confidence: number;
}

interface OCRResponse {
  success: boolean;
  medications: MedicationData[];
  confidence: number;
  processingTime: number;
  ocrText?: string;
  errors?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse request body
    const { imageBase64, mimeType }: OCRRequest = await req.json();
    
    // Validate input
    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 or mimeType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate image type
    if (!mimeType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Only images are allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Starting OCR processing for ${mimeType} image`);

    // Step 1: Extract text using Google Cloud Vision OCR
    const ocrText = await extractTextFromImage(imageBase64);
    console.log(`📝 OCR extracted text (${ocrText.length} chars):`, ocrText.substring(0, 200) + "...");

    if (!ocrText || ocrText.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: "No text detected in image. Please ensure the image is clear and contains medication information." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Process with OpenAI to structure the data
    const structuredData = await processWithAI(ocrText);
    console.log(`🤖 AI processed ${structuredData.length} medications`);

    // Step 3: Calculate overall confidence
    const overallConfidence = structuredData.length > 0 
      ? structuredData.reduce((sum, med) => sum + med.confidence, 0) / structuredData.length 
      : 0;

    const processingTime = Date.now() - startTime;

    const response: OCRResponse = {
      success: true,
      medications: structuredData,
      confidence: overallConfidence,
      processingTime,
      ocrText: ocrText
    };

    console.log(`✅ OCR processing completed in ${processingTime}ms with ${(overallConfidence * 100).toFixed(1)}% confidence`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ OCR Processing Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        processingTime 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

async function extractTextFromImage(imageBase64: string): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
  
  if (!apiKey) {
    throw new Error("Google Cloud Vision API key not configured");
  }

  const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  
  const requestBody = {
    requests: [{
      image: { 
        content: imageBase64 
      },
      features: [
        { 
          type: "DOCUMENT_TEXT_DETECTION"
        }
      ]
    }]
  };

  const response = await fetch(visionUrl, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Cloud Vision API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (result.responses[0]?.error) {
    throw new Error(`Vision API error: ${result.responses[0].error.message}`);
  }

  // Extract text from document structure (DOCUMENT_TEXT_DETECTION)
  const documentAnnotation = result.responses[0]?.fullTextAnnotation;
  
  if (!documentAnnotation?.text) {
    throw new Error("No text detected in the image");
  }

  return documentAnnotation.text;
}

async function processWithAI(ocrText: string): Promise<MedicationData[]> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
Parse the following medication list text, where each line represents one medication.
IMPORTANT: Treat each line as a distinct and separate medication entry, even if the medication name is the same as on a previous line.

For each medication, extract structured data.
- The most important instruction is in the "Give..." column. **Prioritize the dosage from the "Give..." text for the doseAmount.**
- If the "Give..." text is missing, use the dosage listed next to the medication name.

Handle these abbreviations and phrases:
- "TWICE a day", BID/bid = { "scheduleType": "times_per_day", "timesPerDay": 2 }
- "ONCE a day", "Daily", qd/QD = { "scheduleType": "times_per_day", "timesPerDay": 1 }
- "TID/tid" = { "scheduleType": "times_per_day", "timesPerDay": 3 }
- "QID/qid" = { "scheduleType": "times_per_day", "timesPerDay": 4 }
- PRN/prn = { "isPRN": true }
- "Every X hours" or "qXh" = { "scheduleType": "every_x_hours", "everyXHours": X }
- "At Night", "bedtime" = { "scheduleType": "specific_times", "specificTimes": ["22:00"] }
- "In the morning", "with breakfast" = { "scheduleType": "specific_times", "specificTimes": ["08:00"] }
- "Daily at lunch" = { "scheduleType": "specific_times", "specificTimes": ["12:00"] }
- "At ... and ...": Extract the specific times. Example: "At 18:00 and 23:00" = { "scheduleType": "specific_times", "specificTimes": ["18:00", "23:00"] }

Return a JSON array with this EXACT schema. Do NOT merge medications.
[{
  "name": "medication name (clean, no dosage)",
  "doseAmount": "numeric amount from the 'Give...' text",
  "doseUnit": "mg|ml|tablet|capsule|etc.",
  "route": "Oral|Topical|etc.",
  "isPRN": boolean,
  "scheduleType": "every_x_hours|times_per_day|specific_times",
  "everyXHours": number,
  "timesPerDay": number,
  "specificTimes": ["HH:MM"],
  "notes": "any extra instructions like '(Patient not taking...)'",
  "confidence": 0.0-1.0
}]

Text to parse:
${ocrText}

Return ONLY the JSON array. Do not add explanations or markdown.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ 
        role: "user", 
        content: prompt 
      }],
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  try {
    // Clean the response (remove any markdown formatting)
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsedMeds = JSON.parse(cleanContent);
    
    // Validate the response is an array
    if (!Array.isArray(parsedMeds)) {
      throw new Error("AI response is not an array");
    }

    // Stricter validation for essential fields - filter out invalid entries
    const validatedMedications = parsedMeds.map((med: any, index: number) => {
      // Stricter validation for essential fields
      if (!med.name || !med.doseAmount || !med.doseUnit || !med.scheduleType) {
        console.warn(`⚠️ Invalid medication object at index ${index} missing required fields. Skipping.`, med);
        return null; // Mark as invalid
      }

      // Validate scheduleType values
      const validScheduleTypes = ["every_x_hours", "times_per_day", "specific_times"];
      if (!validScheduleTypes.includes(med.scheduleType)) {
        console.warn(`⚠️ Invalid scheduleType "${med.scheduleType}" at index ${index}. Skipping.`, med);
        return null;
      }

      // Validate schedule-specific fields
      if (med.scheduleType === "every_x_hours" && (!med.everyXHours || med.everyXHours < 1)) {
        console.warn(`⚠️ Invalid everyXHours for medication at index ${index}. Skipping.`, med);
        return null;
      }
      if (med.scheduleType === "times_per_day" && (!med.timesPerDay || med.timesPerDay < 1)) {
        console.warn(`⚠️ Invalid timesPerDay for medication at index ${index}. Skipping.`, med);
        return null;
      }
      if (med.scheduleType === "specific_times" && (!med.specificTimes || !Array.isArray(med.specificTimes) || med.specificTimes.length === 0)) {
        console.warn(`⚠️ Invalid specificTimes for medication at index ${index}. Skipping.`, med);
        return null;
      }

      // Set defaults only for non-critical or derivable fields
      med.isPRN = Boolean(med.isPRN);
      med.confidence = typeof med.confidence === 'number' ? med.confidence : 0.7;
      med.notes = med.notes || "";
      med.route = med.route || "Oral";

      // Set schedule defaults only if valid scheduleType but missing optional fields
      if (med.scheduleType === "times_per_day" && !med.timesPerDay) {
        med.timesPerDay = 2;
      }
      if (med.scheduleType === "every_x_hours" && !med.everyXHours) {
        med.everyXHours = 8;
      }
      if (med.scheduleType === "specific_times" && (!med.specificTimes || med.specificTimes.length === 0)) {
        med.specificTimes = ["08:00"];
      }

      return med;
    }).filter((med: any) => med !== null); // Remove invalid entries

    console.log(`✅ Validated ${validatedMedications.length} out of ${parsedMeds.length} medications from AI response`);
    
    return validatedMedications as MedicationData[];
    
  } catch (parseError) {
    console.error("❌ Failed to parse AI response:", content);
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

serve(handler);