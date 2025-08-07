// ocr-gemini/index.ts - Edge function for Gemini-based medication image analysis
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
  geminiText?: string;
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

    console.log(`🔍 Starting Gemini analysis for ${mimeType} image`);

    // Process with Gemini
    const { medications, geminiText } = await analyzeImageWithGemini(imageBase64, mimeType);
    console.log(`🤖 Gemini processed ${medications.length} medications`);

    // Calculate overall confidence
    const overallConfidence = medications.length > 0 
      ? medications.reduce((sum, med) => sum + med.confidence, 0) / medications.length 
      : 0;

    const processingTime = Date.now() - startTime;

    const response: OCRResponse = {
      success: true,
      medications,
      confidence: overallConfidence,
      processingTime,
      geminiText
    };

    console.log(`✅ Gemini analysis completed in ${processingTime}ms with ${(overallConfidence * 100).toFixed(1)}% confidence`);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Gemini Analysis Error:", error);
    
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

async function analyzeImageWithGemini(imageBase64: string, mimeType: string): Promise<{ medications: MedicationData[], geminiText: string }> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured");
  }

  const modelId = "gemini-2.5-flash-lite";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiApiKey}`;

  const prompt = `
Analyze this medication list image and extract structured data for each medication shown.

IMPORTANT INSTRUCTIONS:
- Treat each line/row as a distinct and separate medication entry
- Even if medication names are the same, treat them as separate entries if they appear on different lines
- Prioritize dosage information from "Give..." instructions over medication label dosages
- Look for actual administration instructions, not just the medication strength

Extract the following for each medication:
1. Medication name (clean, without dosage information)  
2. Dose amount (prioritize from "Give..." text, then from medication label)
3. Dose unit (mg, ml, tablet, capsule, etc.)
4. Route of administration (Oral, Topical, Injection, etc.)
5. Whether it's PRN (as needed) or scheduled
6. Schedule type and frequency

Handle these medical abbreviations:
- "TWICE a day", BID/bid = times_per_day: 2
- "ONCE a day", "Daily", qd/QD = times_per_day: 1  
- "TID/tid" = times_per_day: 3
- "QID/qid" = times_per_day: 4
- PRN/prn = isPRN: true
- "Every X hours" or "qXh" = every_x_hours: X
- "At Night", "bedtime" = specific_times: ["22:00"]
- "In the morning", "with breakfast" = specific_times: ["08:00"]
- "Daily at lunch" = specific_times: ["12:00"]
- "At 18:00 and 23:00" = specific_times: ["18:00", "23:00"]

Return ONLY a valid JSON array with this exact structure:
[{
  "name": "medication name (clean, no dosage)",
  "doseAmount": "numeric amount from Give... instruction or label",
  "doseUnit": "mg|ml|tablet|capsule|etc.",
  "route": "Oral|Topical|Injection|etc.",
  "isPRN": boolean,
  "scheduleType": "every_x_hours|times_per_day|specific_times",
  "everyXHours": number,
  "timesPerDay": number,
  "specificTimes": ["HH:MM"],
  "notes": "special instructions or notes",
  "confidence": 0.0-1.0
}]

Do not include any explanations, markdown formatting, or text outside the JSON array.`;

  const requestBody = {
    contents: [{
      role: "user",
      parts: [
        {
          text: prompt
        },
        {
          inline_data: {
            mime_type: mimeType,
            data: imageBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4000,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.candidates || !result.candidates[0]?.content?.parts?.[0]?.text) {
    throw new Error("No valid response from Gemini");
  }

  const geminiText = result.candidates[0].content.parts[0].text;
  console.log(`📝 Gemini response:`, geminiText.substring(0, 200) + "...");

  try {
    // Clean the response (remove markdown formatting that Gemini sometimes adds)
    const cleanResponse = geminiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    const medications = JSON.parse(cleanResponse);
    
    if (!Array.isArray(medications)) {
      throw new Error("Gemini response is not an array");
    }

    // Validate and clean medications
    const validatedMedications = medications.map((med: any, index: number) => {
      // Validate required fields
      if (!med.name || !med.doseAmount || !med.doseUnit || !med.scheduleType) {
        console.warn(`⚠️ Invalid medication at index ${index}, skipping:`, med);
        return null;
      }

      // Validate scheduleType
      const validScheduleTypes = ["every_x_hours", "times_per_day", "specific_times"];
      if (!validScheduleTypes.includes(med.scheduleType)) {
        console.warn(`⚠️ Invalid scheduleType "${med.scheduleType}" at index ${index}, skipping`);
        return null;
      }

      // Set defaults for optional fields
      med.isPRN = Boolean(med.isPRN);
      med.confidence = typeof med.confidence === 'number' ? med.confidence : 0.8;
      med.notes = med.notes || "";
      med.route = med.route || "Oral";

      // Validate schedule-specific fields
      if (med.scheduleType === "times_per_day" && (!med.timesPerDay || med.timesPerDay < 1)) {
        med.timesPerDay = 2; // Default to twice daily
      }
      if (med.scheduleType === "every_x_hours" && (!med.everyXHours || med.everyXHours < 1)) {
        med.everyXHours = 8; // Default to every 8 hours
      }
      if (med.scheduleType === "specific_times" && (!med.specificTimes || !Array.isArray(med.specificTimes) || med.specificTimes.length === 0)) {
        med.specificTimes = ["08:00"]; // Default morning dose
      }

      return med;
    }).filter((med: any) => med !== null);

    console.log(`✅ Validated ${validatedMedications.length} out of ${medications.length} medications from Gemini`);
    
    return {
      medications: validatedMedications as MedicationData[],
      geminiText
    };
    
  } catch (parseError) {
    console.error("❌ Failed to parse Gemini response:", geminiText);
    throw new Error(`Failed to parse Gemini response: ${parseError.message}`);
  }
}

serve(handler);