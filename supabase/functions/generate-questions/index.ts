import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { position, jobDescription, experience, techStack, interviewTypes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are an expert recruiter. Generate exactly 10 interview questions for the following position:

Position: ${position}
Experience Required: ${experience} years
Tech Stack: ${techStack}
Interview Types: ${interviewTypes?.join(", ") || "Technical"}

Job Description:
${jobDescription}

Generate thoughtful, role-specific questions that assess both technical skills and cultural fit. Return ONLY a JSON array of 10 question strings, no other text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional recruiter assistant. Always respond with valid JSON arrays only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON from the response
    let questions: string[];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      questions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse questions:", content);
      questions = [
        "Tell me about your experience with the technologies mentioned in this role.",
        "Describe a challenging project you've worked on recently.",
        "How do you approach problem-solving when facing a new technical challenge?",
        "What interests you about this position?",
        "Where do you see yourself in 5 years?",
      ];
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
