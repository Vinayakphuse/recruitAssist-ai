import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCreateInterview } from "@/hooks/useInterviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Sparkles, 
  Copy, 
  ArrowLeft, 
  Plus, 
  Mail, 
  MessageSquare, 
  Share2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const interviewTypes = [
  "Technical",
  "Behavioral",
  "Experience",
  "Problem Solving",
  "Leadership",
];

type Step = "form" | "generating" | "success";

export default function CreateInterview() {
  const { user, isLoading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const createInterview = useCreateInterview();

  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState({
    position: "",
    job_desc: "",
    job_experience: 0,
    tech_stack: "",
    interview_duration: 30,
    interview_types: ["Technical"] as string[],
  });
  const [questions, setQuestions] = useState<string[]>([]);
  const [createdInterviewId, setCreatedInterviewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const toggleInterviewType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      interview_types: prev.interview_types.includes(type)
        ? prev.interview_types.filter((t) => t !== type)
        : [...prev.interview_types, type],
    }));
  };

  const generateQuestions = async () => {
    if (!formData.position || !formData.job_desc) {
      toast.error("Please fill in the job position and description");
      return;
    }

    if ((profile?.credits ?? 0) < 1) {
      toast.error("You don't have enough credits. Please upgrade your plan.");
      return;
    }

    setStep("generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: {
          position: formData.position,
          jobDescription: formData.job_desc,
          experience: formData.job_experience,
          techStack: formData.tech_stack,
          interviewTypes: formData.interview_types,
        },
      });

      if (error) throw error;
      
      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        
        // Create the interview
        const interview = await createInterview.mutateAsync({
          ...formData,
          questions: data.questions,
        });

        setCreatedInterviewId(interview.id);
        setStep("success");
        toast.success("Interview created successfully!");
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Failed to generate questions. Please try again.");
      setStep("form");
    }
  };

  const copyLink = () => {
    if (createdInterviewId) {
      navigator.clipboard.writeText(`${window.location.origin}/interview/${createdInterviewId}`);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {step === "form" && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Interview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="position">Job Position</Label>
                <Input
                  id="position"
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, position: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_desc">Job Description</Label>
                <Textarea
                  id="job_desc"
                  placeholder="Enter detailed job description..."
                  rows={5}
                  value={formData.job_desc}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, job_desc: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={formData.job_experience}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        job_experience: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Interview Duration</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    step={15}
                    placeholder="30"
                    value={formData.interview_duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        interview_duration: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tech_stack">Tech Stack</Label>
                <Input
                  id="tech_stack"
                  placeholder="e.g. React, Node.js, TypeScript"
                  value={formData.tech_stack}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tech_stack: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Interview Types</Label>
                <div className="flex flex-wrap gap-2">
                  {interviewTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={
                        formData.interview_types.includes(type) ? "default" : "outline"
                      }
                      className={cn(
                        "cursor-pointer transition-all",
                        formData.interview_types.includes(type)
                          ? "gradient-primary border-0"
                          : "hover:bg-secondary"
                      )}
                      onClick={() => toggleInterviewType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
                <Button onClick={generateQuestions} className="flex-1">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "generating" && (
          <Card className="animate-scale-in">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow animate-pulse">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Generating Interview Questions</h2>
              <p className="text-muted-foreground mb-8">
                Our AI is crafting personalized questions based on your requirements...
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">This may take a moment</span>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="animate-scale-in">
            <CardContent className="py-12">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 shadow-glow">
                  <Check className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your AI Interview is Ready!</h2>
                <p className="text-muted-foreground">
                  Share this link with your candidates to start the interview process
                </p>
              </div>

              <div className="bg-muted rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Interview Link</span>
                  <Badge variant="secondary">Valid for 30 Days</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/interview/${createdInterviewId}`}
                    className="bg-background"
                  />
                  <Button onClick={copyLink} variant="outline">
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm text-muted-foreground mb-8">
                <div>
                  <p className="font-semibold text-foreground">{formData.interview_duration} Min</p>
                  <p>Duration</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{questions.length} Questions</p>
                  <p>Total</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{formData.interview_types.join(", ")}</p>
                  <p>Type</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-sm font-medium text-center">Share Via</p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" size="icon">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button onClick={() => {
                  setStep("form");
                  setFormData({
                    position: "",
                    job_desc: "",
                    job_experience: 0,
                    tech_stack: "",
                    interview_duration: 30,
                    interview_types: ["Technical"],
                  });
                  setQuestions([]);
                  setCreatedInterviewId(null);
                }} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
