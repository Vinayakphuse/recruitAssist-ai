import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useInterview, useInterviewCandidates, useDeleteCandidate } from "@/hooks/useInterviews";
import { CandidateReportModal } from "@/components/CandidateReportModal";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Copy,
  User,
  Filter,
  Download,
  Tag,
  Trash2,
  BadgeCheck
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function InterviewDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { interview, isLoading: interviewLoading } = useInterview(id);
  const { candidates, isLoading: candidatesLoading } = useInterviewCandidates(id);
  const deleteCandidate = useDeleteCandidate();
  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[0] | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await deleteCandidate.mutateAsync(candidateId);
      toast.success("Candidate deleted successfully");
    } catch {
      toast.error("Failed to delete candidate");
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/interview/${id}`);
    toast.success("Link copied to clipboard!");
  };

  const handleExport = () => {
    // Export candidates data as CSV
    if (!candidates || candidates.length === 0) {
      toast.error("No candidates to export");
      return;
    }

    const csvContent = [
      ["Name", "Email", "Status", "Rating", "Date"].join(","),
      ...candidates.map(c => [
        c.candidate_name,
        c.candidate_email,
        c.status || "pending",
        c.rating || "N/A",
        format(new Date(c.created_at), "yyyy-MM-dd")
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${interview?.position || "interview"}-candidates.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Candidates exported!");
  };

  if (authLoading || interviewLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Interview not found</h2>
          <p className="text-muted-foreground mb-4">
            This interview doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const questions = (interview.questions as string[]) || [];
  const interviewTypes = interview.interview_types || ["Technical"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Interview Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Job Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{interview.position}</h2>
                <p className="text-muted-foreground text-sm">{interview.tech_stack || "Company"}</p>
              </div>
              <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-8 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Duration</p>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{interview.interview_duration || 30} Minutes</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Created On</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(interview.created_at), "MMM dd, yyyy")}</span>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Type</p>
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span>{interviewTypes.join(" + ")}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Job Description */}
            <div>
              <h3 className="font-semibold mb-2">Job Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {interview.job_desc}
              </p>
            </div>

            {/* Interview Questions */}
            <div>
              <h3 className="font-semibold mb-3">Interview Questions</h3>
              <ul className="space-y-2">
                {questions.map((question, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-muted-foreground text-sm">{question}</p>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Candidates Section */}
            <div>
              <h3 className="font-semibold mb-4">Candidates ({candidates?.length || 0})</h3>
              
              {candidatesLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading candidates...
                </div>
              ) : candidates && candidates.length > 0 ? (
                <div className="space-y-3">
                  {candidates.map((candidate) => {
                    const reportExists = Boolean(candidate.feedback_summary) || candidate.rating !== null;

                    return (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {candidate.candidate_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{candidate.candidate_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.status === "completed"
                                ? `Completed on ${format(new Date(candidate.created_at), "MMM dd, yyyy")}`
                                : candidate.status === "in_progress"
                                ? "Interview in progress"
                                : `Pending - Started ${format(new Date(candidate.created_at), "MMM dd, yyyy")}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {candidate.selection_status === "selected" && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
                              <BadgeCheck className="w-4 h-4 text-success" />
                              <span className="text-xs font-medium text-success">Selected</span>
                            </div>
                          )}
                          
                          {reportExists && candidate.rating !== null ? (
                            <span className="text-primary font-bold">{candidate.rating}/10</span>
                          ) : reportExists ? (
                            <span className="text-muted-foreground font-medium">Report ready</span>
                          ) : (
                            <span className="text-warning font-medium">Pending</span>
                          )}

                          {reportExists && (
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary"
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setIsReportOpen(true);
                              }}
                            >
                              View Report
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {candidate.candidate_name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCandidate(candidate.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium mb-1">No candidates yet</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    Share the interview link with candidates to get started
                  </p>
                  <Button onClick={copyLink} size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Interview Link
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CandidateReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        candidate={selectedCandidate}
        position={interview?.position}
      />
    </DashboardLayout>
  );
}
