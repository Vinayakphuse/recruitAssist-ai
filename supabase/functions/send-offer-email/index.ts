import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOfferRequest {
  userAnswerId: string;
  recruiterEmail: string;
  recruiterName: string;
  recruiterId: string; // ID of the recruiter making the decision
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AIcruiter <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userAnswerId, recruiterEmail, recruiterName, recruiterId }: SendOfferRequest = await req.json();

    if (!userAnswerId) {
      throw new Error("userAnswerId is required");
    }

    if (!recruiterId) {
      throw new Error("recruiterId is required - human decision maker must be identified");
    }

    // SECURITY: Verify the recruiter has permission to make hiring decisions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify recruiter role using security definer function
    const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
      _user_id: recruiterId,
      _role: "recruiter",
    });

    const { data: hasHMRole } = await supabase.rpc("has_role", {
      _user_id: recruiterId,
      _role: "hiring_manager",
    });

    const { data: hasAdminRole } = await supabase.rpc("has_role", {
      _user_id: recruiterId,
      _role: "admin",
    });

    const canMakeDecision = hasRole || hasHMRole || hasAdminRole;

    if (roleError) {
      console.error("Error checking user role:", roleError);
      // Allow for backwards compatibility if roles not set up
      console.log("Role check failed, proceeding with decision (backwards compatibility)");
    } else if (!canMakeDecision) {
      console.error(`User ${recruiterId} attempted to make hiring decision without proper role`);
      throw new Error("Unauthorized: Only recruiters, hiring managers, or admins can confirm hiring decisions");
    }

    console.log(`AUDIT: User ${recruiterId} initiating hiring decision for candidate ${userAnswerId}`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // SECURITY: Fetch candidate to verify minimum score threshold BEFORE proceeding
    const { data: candidateCheck, error: candidateCheckError } = await supabase
      .from("user_answers")
      .select("rating, final_decision")
      .eq("id", userAnswerId)
      .single();

    if (candidateCheckError || !candidateCheck) {
      throw new Error("Failed to verify candidate: " + (candidateCheckError?.message || "Not found"));
    }

    const MIN_HIRE_SCORE = 5;
    const candidateRating = candidateCheck.rating ?? 0;

    if (candidateRating < MIN_HIRE_SCORE) {
      console.error(`SECURITY BLOCK: Attempted to hire candidate ${userAnswerId} with rating ${candidateRating} (below minimum ${MIN_HIRE_SCORE})`);
      throw new Error(`Candidate does not meet minimum score threshold (${candidateRating}/10 < ${MIN_HIRE_SCORE}/10). Hiring blocked.`);
    }

    if (candidateCheck.final_decision) {
      console.error(`SECURITY BLOCK: Attempted to modify already-decided candidate ${userAnswerId}`);
      throw new Error("This candidate already has a final decision recorded. Cannot modify.");
    }

    console.log(`AUDIT: Candidate ${userAnswerId} passed score threshold check (${candidateRating}/10 >= ${MIN_HIRE_SCORE}/10)`);

    // Fetch the user answer with interview details
    const { data: userAnswer, error: fetchError } = await supabase
      .from("user_answers")
      .select(`
        *,
        interviews (
          id,
          position,
          job_desc
        )
      `)
      .eq("id", userAnswerId)
      .single();

    if (fetchError || !userAnswer) {
      throw new Error("Failed to fetch candidate details: " + (fetchError?.message || "Not found"));
    }

    const interview = userAnswer.interviews;
    let feedbackData: any = {};
    
    try {
      if (userAnswer.feedback_summary) {
        feedbackData = JSON.parse(userAnswer.feedback_summary);
      }
    } catch {
      feedbackData = { summary: userAnswer.feedback_summary };
    }

    // 1. Update candidate with recruiter's final decision
    const { error: updateCandidateError } = await supabase
      .from("user_answers")
      .update({ 
        selection_status: "selected",
        final_decision: "hire",
        decision_by: recruiterId,
        decision_at: new Date().toISOString(),
      })
      .eq("id", userAnswerId);

    if (updateCandidateError) {
      console.error("Error updating candidate status:", updateCandidateError);
      throw new Error("Failed to update candidate status");
    }
    console.log(`Recruiter ${recruiterId} confirmed hire decision for candidate ${userAnswerId}`);

    // 2. Create offer record
    const { error: offerError } = await supabase
      .from("offers")
      .insert({
        candidate_id: userAnswerId,
        interview_id: interview.id,
        status: "sent",
      });

    if (offerError) {
      console.error("Error creating offer record:", offerError);
      throw new Error("Failed to create offer record");
    }
    console.log("Created offer record");

    // 3. Create in-app notification for candidate
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_email: userAnswer.candidate_email,
        title: "🎉 You're Selected!",
        message: `Congratulations! You have been selected for the ${interview.position} position. Our team will contact you soon with next steps.`,
        type: "selection",
        is_read: false,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Don't throw here, notification is not critical
    } else {
      console.log("Created in-app notification for candidate");
    }

    // 4. Send email to candidate
    const candidateEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .highlight { background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations! You've Been Selected</h1>
          </div>
          <div class="content">
            <p>Hi ${userAnswer.candidate_name},</p>
            
            <p>We're happy to inform you that you've been selected for the <strong>${interview.position}</strong> position.</p>
            
            <div class="highlight">
              <strong>Your interview score: ${userAnswer.rating}/10</strong>
            </div>
            
            <p>Your interview performance impressed our team, and we believe you're a strong fit for the role.</p>
            
            ${feedbackData.summary ? `<p>${feedbackData.summary}</p>` : ''}
            
            <p>You'll receive further details regarding the offer and next steps shortly.</p>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Our HR team will reach out to you within the next 2-3 business days</li>
              <li>We'll discuss the offer details and compensation package</li>
              <li>Please keep an eye on your email for further communications</li>
            </ul>
            
            <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            ${recruiterName || 'The Hiring Team'}</p>
          </div>
          <div class="footer">
            <p>This email was sent via AIcruiter - AI-Powered Interview Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      userAnswer.candidate_email,
      `🎉 Congratulations! You've Been Selected for ${interview.position}`,
      candidateEmailHtml
    );

    console.log("Offer email sent to candidate:", userAnswer.candidate_email);

    // 5. Also notify the recruiter
    if (recruiterEmail) {
      const recruiterEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B5CF6, #A78BFA); padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 20px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10B981; }
            .success-badge { background: #10B981; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Candidate Selected Successfully</h1>
            </div>
            <div class="content">
              <p>This is a confirmation that you have selected the following candidate and an offer email has been sent:</p>
              
              <div class="info-box">
                <p><strong>Candidate:</strong> ${userAnswer.candidate_name}</p>
                <p><strong>Email:</strong> ${userAnswer.candidate_email}</p>
                <p><strong>Position:</strong> ${interview.position}</p>
                <p><strong>Interview Score:</strong> ${userAnswer.rating}/10</p>
                <p><strong>Status:</strong> <span class="success-badge">Selected</span></p>
              </div>
              
              <p>The candidate has been notified via email and has received an in-app notification.</p>
              
              <p>Please follow up with the candidate within the next few business days to discuss the offer details.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        recruiterEmail,
        `✅ Candidate Selected: ${userAnswer.candidate_name} for ${interview.position}`,
        recruiterEmailHtml
      );
      console.log("Confirmation email sent to recruiter:", recruiterEmail);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Candidate selected and notifications sent successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-offer-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process selection" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
