import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswerId } = await req.json();

    if (!userAnswerId) {
      throw new Error("userAnswerId is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the user answer with interview details
    const { data: userAnswer, error: fetchError } = await supabase
      .from("user_answers")
      .select(`
        *,
        interviews (
          position,
          job_desc,
          tech_stack,
          job_experience,
          questions
        )
      `)
      .eq("id", userAnswerId)
      .single();

    if (fetchError || !userAnswer) {
      throw new Error("Failed to fetch user answer: " + (fetchError?.message || "Not found"));
    }

    if (!userAnswer.transcript) {
      throw new Error("No transcript available for analysis");
    }

    const interview = userAnswer.interviews;
    const questions = Array.isArray(interview.questions) ? interview.questions : [];

    // Generate feedback using Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert HR interviewer analyzing interview transcripts. Your task is to evaluate the candidate's performance and provide detailed feedback.

You must respond with a valid JSON object containing:
- rating: A number from 1 to 10 (can include decimals like 8.5)
- technicalSkills: A number from 1 to 10 for technical ability
- communication: A number from 1 to 10 for communication skills
- problemSolving: A number from 1 to 10 for problem-solving ability
- experience: A number from 1 to 10 for relevant experience
- summary: A detailed performance summary (2-3 sentences)
- recommendation: One of "hire", "hold", "reject"
- strengths: Array of 2-3 key strengths
- improvements: Array of 2-3 areas for improvement

Be fair but thorough in your assessment.`,
          },
          {
            role: "user",
            content: `Please analyze this interview transcript and provide feedback.

Position: ${interview.position}
Job Description: ${interview.job_desc}
Required Experience: ${interview.job_experience} years
Tech Stack: ${interview.tech_stack}

Interview Questions:
${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Candidate: ${userAnswer.candidate_name}

Interview Transcript:
${userAnswer.transcript}

Provide your analysis as a JSON object.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_feedback",
              description: "Submit the interview feedback analysis",
              parameters: {
                type: "object",
                properties: {
                  rating: { type: "number", description: "Overall rating from 1-10" },
                  technicalSkills: { type: "number", description: "Technical skills score 1-10" },
                  communication: { type: "number", description: "Communication score 1-10" },
                  problemSolving: { type: "number", description: "Problem solving score 1-10" },
                  experience: { type: "number", description: "Experience relevance score 1-10" },
                  summary: { type: "string", description: "Detailed performance summary" },
                    recommendation: { type: "string", enum: ["hire", "hold", "reject"], description: "Hire recommendation" },
                  strengths: { type: "array", items: { type: "string" }, description: "Key strengths" },
                  improvements: { type: "array", items: { type: "string" }, description: "Areas for improvement" },
                },
                required: ["rating", "technicalSkills", "communication", "problemSolving", "experience", "summary", "recommendation", "strengths", "improvements"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_feedback" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to generate feedback from AI");
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract the function call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "submit_feedback") {
      throw new Error("Invalid AI response format");
    }

    const feedback = JSON.parse(toolCall.function.arguments);

    // Build the feedback summary with all details
    const feedbackSummary = JSON.stringify({
      technicalSkills: feedback.technicalSkills,
      communication: feedback.communication,
      problemSolving: feedback.problemSolving,
      experience: feedback.experience,
      summary: feedback.summary,
      recommendation: feedback.recommendation,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    });

    // Update the user answer with the feedback
    // IMPORTANT: AI only sets ai_recommendation, never final_decision
    const { error: updateError } = await supabase
      .from("user_answers")
      .update({
        rating: feedback.rating,
        feedback_summary: feedbackSummary,
        ai_recommendation: feedback.recommendation, // AI suggestion only
        status: "completed",
        // final_decision, decision_by, decision_at are NEVER set by AI
        // These require human confirmation via send-offer-email
      })
      .eq("id", userAnswerId);

    if (updateError) {
      throw new Error("Failed to save feedback: " + updateError.message);
    }

    console.log("Feedback generated and saved for user answer:", userAnswerId);

    return new Response(
      JSON.stringify({ success: true, feedback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating feedback:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
