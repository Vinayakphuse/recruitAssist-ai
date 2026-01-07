import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Send, BadgeCheck, ShieldAlert, User } from "lucide-react";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ConfirmHireModal } from "@/components/ConfirmHireModal";
import { toast } from "sonner";
import { format } from "date-fns";

interface FeedbackData {
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  experience: number;
  summary: string;
  recommendation: "hire" | "hold" | "reject";
  strengths: string[];
  improvements: string[];
}

interface CandidateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    candidate_name: string;
    candidate_email: string;
    rating: number | null;
    feedback_summary: string | null;
    status: string | null;
    selection_status?: string | null;
    final_decision?: string | null;
    decision_by?: string | null;
    decision_at?: string | null;
    ai_recommendation?: string | null;
  } | null;
  position?: string;
  onDecisionMade?: () => void;
}

export function CandidateReportModal({ 
  isOpen, 
  onClose, 
  candidate, 
  position,
  onDecisionMade 
}: CandidateReportModalProps) {
  const { user } = useAuth();
  const { canMakeHiringDecisions, isLoading: isRoleLoading } = useUserRole();
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deciderName, setDeciderName] = useState<string | null>(null);

  const rating = candidate?.rating ?? 0;
  const candidateName = candidate?.candidate_name ?? "";

  // Parse feedback data from feedback_summary JSON
  const feedbackData: FeedbackData | null = useMemo(() => {
    if (!candidate?.feedback_summary) return null;
    try {
      return JSON.parse(candidate.feedback_summary) as FeedbackData;
    } catch {
      return null;
    }
  }, [candidate?.feedback_summary]);

  // Fetch decider name if decision was made
  useMemo(() => {
    const fetchDeciderName = async () => {
      if (candidate?.decision_by) {
        const { data } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", candidate.decision_by)
          .maybeSingle();
        
        if (data) {
          setDeciderName(data.name || data.email || "Unknown");
        }
      }
    };
    fetchDeciderName();
  }, [candidate?.decision_by]);

  // Use AI-generated skills or fallback to calculated scores
  const skills = useMemo(() => {
    if (feedbackData) {
      return {
        technicalSkills: feedbackData.technicalSkills,
        communication: feedbackData.communication,
        problemSolving: feedbackData.problemSolving,
        experience: feedbackData.experience,
      };
    }

    const base = rating;
    return {
      technicalSkills: Math.min(10, Math.max(1, base + 0.5)),
      communication: Math.min(10, Math.max(1, base)),
      problemSolving: Math.min(10, Math.max(1, base - 0.5)),
      experience: Math.min(10, Math.max(1, base)),
    };
  }, [rating, feedbackData]);

  // AI recommendation (suggestion only)
  const aiRecommendation =
    candidate?.ai_recommendation ?? 
    feedbackData?.recommendation ?? 
    (rating >= 7 ? "hire" : rating < 5 ? "reject" : "hold");
  
  const isAiRecommendedHire = aiRecommendation === "hire";
  const isHired = candidate?.final_decision === "hire" || candidate?.selection_status === "selected";
  const isPendingDecision = !candidate?.final_decision && candidate?.status === "completed";

  // Minimum score threshold for hiring
  const MIN_HIRE_SCORE = 5;
  const meetsMinimumScore = rating >= MIN_HIRE_SCORE;
  
  // Score badge logic
  const getScoreBadge = () => {
    if (rating >= 7) return { label: "Strong Hire", color: "bg-success text-success-foreground" };
    if (rating >= 5) return { label: "Borderline", color: "bg-warning text-warning-foreground" };
    return { label: "Not Eligible", color: "bg-destructive text-destructive-foreground" };
  };
  const scoreBadge = getScoreBadge();

  // Determine if button should be shown (requires minimum score + role + AI recommendation or override)
  const shouldShowActionButton = 
    canMakeHiringDecisions && 
    meetsMinimumScore &&
    (isAiRecommendedHire || canMakeHiringDecisions) && // Recruiters can override AI, but not score threshold
    isPendingDecision && 
    !isHired;

  const getPerformanceSummary = () => {
    if (!candidate) return "";
    if (feedbackData?.summary) return feedbackData.summary;
    if (candidate.feedback_summary && !feedbackData) return candidate.feedback_summary;
    if (rating >= 8) {
      return `${candidate.candidate_name} demonstrated exceptional technical proficiency and problem-solving abilities.`;
    }
    if (rating >= 6) {
      return `${candidate.candidate_name} showed good technical knowledge and communication skills.`;
    }
    return `${candidate.candidate_name} demonstrated foundational knowledge but may need additional experience.`;
  };

  const handleConfirmHire = async () => {
    if (!candidate || !user) return;

    setIsSending(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.functions.invoke("send-offer-email", {
        body: {
          userAnswerId: candidate.id,
          recruiterEmail: profile?.email || user.email,
          recruiterName: profile?.name || "Hiring Team",
          recruiterId: user.id,
        },
      });

      if (error) throw error;

      toast.success(
        `🎉 ${candidate.candidate_name} has been hired! Email notification sent.`,
        { duration: 5000 }
      );
      setShowConfirmModal(false);
      onDecisionMade?.();
      onClose();
    } catch (error) {
      console.error("Error confirming hire:", error);
      toast.error("Failed to process hiring decision. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  if (!candidate) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Candidate report</h2>
            <p className="text-sm text-muted-foreground">Select a candidate to view their report.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          {/* Header with candidate info */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {candidateName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{candidateName}</h2>
                  <p className="text-sm text-muted-foreground">{position || "Position"}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div>
                  <span className="text-4xl font-bold text-primary">{rating}</span>
                  <span className="text-lg text-muted-foreground">/10</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreBadge.color}`}>
                  {scoreBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-6">
            {/* Skills Assessment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Skills Assessment</h3>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Technical Skills</span>
                    <span className="font-medium">{skills.technicalSkills}/10</span>
                  </div>
                  <Progress value={skills.technicalSkills * 10} className="h-2 bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Communication</span>
                    <span className="font-medium">{skills.communication}/10</span>
                  </div>
                  <Progress value={skills.communication * 10} className="h-2 bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Problem Solving</span>
                    <span className="font-medium">{skills.problemSolving}/10</span>
                  </div>
                  <Progress value={skills.problemSolving * 10} className="h-2 bg-muted" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-medium">{skills.experience}/10</span>
                  </div>
                  <Progress value={skills.experience * 10} className="h-2 bg-muted" />
                </div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            {feedbackData && (feedbackData.strengths?.length > 0 || feedbackData.improvements?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {feedbackData.strengths?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-green-600 dark:text-green-400">Key Strengths</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {feedbackData.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedbackData.improvements?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-amber-600 dark:text-amber-400">Areas to Improve</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {feedbackData.improvements.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 text-amber-500 mt-1 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Performance Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold text-base">Performance Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-4">
                {getPerformanceSummary()}
              </p>
            </div>

            {/* AI Recommendation Section */}
            <div
              className={
                aiRecommendation === "hire"
                  ? "rounded-lg p-4 bg-success/10"
                  : aiRecommendation === "hold"
                  ? "rounded-lg p-4 bg-warning/10"
                  : "rounded-lg p-4 bg-destructive/10"
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {aiRecommendation === "hire" ? (
                    <CheckCircle className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  ) : (
                    <XCircle
                      className={
                        aiRecommendation === "hold"
                          ? "h-5 w-5 text-warning mt-0.5 shrink-0"
                          : "h-5 w-5 text-destructive mt-0.5 shrink-0"
                      }
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={
                          aiRecommendation === "hire"
                            ? "font-semibold text-sm text-success"
                            : aiRecommendation === "hold"
                            ? "font-semibold text-sm text-warning"
                            : "font-semibold text-sm text-destructive"
                        }
                      >
                        {aiRecommendation === "hire"
                          ? "AI Recommendation: Hire"
                          : aiRecommendation === "hold"
                          ? "AI Recommendation: Hold"
                          : "AI Recommendation: Reject"}
                      </h4>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        Suggestion Only
                      </span>
                    </div>
                    <p
                      className={
                        aiRecommendation === "hire"
                          ? "text-sm text-success/80"
                          : aiRecommendation === "hold"
                          ? "text-sm text-warning/80"
                          : "text-sm text-destructive/80"
                      }
                    >
                      {aiRecommendation === "hire"
                        ? "Candidate shows strong potential. Awaiting recruiter/hiring manager confirmation."
                        : aiRecommendation === "hold"
                        ? "Consider an additional round or a focused follow-up assessment."
                        : "Candidate does not meet requirements based on this interview."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision Section */}
            {isHired ? (
              <div className="rounded-lg p-4 bg-success/20 border border-success/30">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="w-6 h-6 text-success" />
                  <div>
                    <h4 className="font-semibold text-success">Candidate Hired</h4>
                    {candidate?.decision_at && deciderName && (
                      <p className="text-sm text-success/80 flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" />
                        Decision made by {deciderName} on{" "}
                        {format(new Date(candidate.decision_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : shouldShowActionButton ? (
              <div className="space-y-3">
                <Button
                  className="w-full bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isRoleLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Confirm & Proceed to Offer
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  As a {canMakeHiringDecisions ? "recruiter/hiring manager" : "user"}, you have authority to make this hiring decision.
                </p>
              </div>
            ) : !meetsMinimumScore && isPendingDecision ? (
              <div className="rounded-lg p-4 bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive" />
                  <div>
                    <h4 className="font-medium text-sm text-destructive">Not Eligible for Hiring</h4>
                    <p className="text-sm text-destructive/80">
                      Candidate does not meet the minimum score required for hiring (≥{MIN_HIRE_SCORE}/10).
                    </p>
                  </div>
                </div>
              </div>
            ) : !canMakeHiringDecisions && user && meetsMinimumScore && isPendingDecision ? (
              <div className="rounded-lg p-4 bg-muted/50 border border-muted">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm">Awaiting Hiring Decision</h4>
                    <p className="text-sm text-muted-foreground">
                      Only recruiters or hiring managers can confirm hiring decisions.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmHireModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmHire}
        candidateName={candidateName}
        position={position || "Position"}
        isLoading={isSending}
      />
    </>
  );
}
