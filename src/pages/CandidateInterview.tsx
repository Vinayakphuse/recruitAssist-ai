import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInterview } from "@/hooks/useInterviews";
import { useVapi } from "@/hooks/useVapi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Mic, 
  MicOff, 
  Clock, 
  Wifi, 
  Volume2,
  CheckCircle2,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "welcome" | "interview" | "complete";

export default function CandidateInterview() {
  const { id } = useParams<{ id: string }>();
  const { interview, isLoading } = useInterview(id);
  
  const [step, setStep] = useState<Step>("welcome");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userAnswerId, setUserAnswerId] = useState<string | null>(null);

  const {
    isConnected,
    isLoading: isVapiLoading,
    isSpeaking,
    volumeLevel,
    transcript,
    startCall,
    endCall,
  } = useVapi({
    onCallEnd: async () => {
      if (!userAnswerId) {
        setStep("complete");
        toast.success("Interview completed!");
        return;
      }

      // Save transcript + complete status on the backend (works even when candidate isn't logged in)
      try {
        const { error: completeError } = await supabase.functions.invoke(
          "candidate-complete-interview",
          {
            body: {
              userAnswerId,
              transcript: transcript || null,
            },
          }
        );

        if (completeError) {
          console.error("Complete interview error:", completeError);
        }
      } catch (error) {
        console.error("Error calling candidate-complete-interview:", error);
      }

      // Trigger AI feedback generation
      try {
        const response = await supabase.functions.invoke("generate-feedback", {
          body: { userAnswerId },
        });

        if (response.error) {
          console.error("Feedback generation error:", response.error);
        } else {
          console.log("Feedback generated successfully");
        }
      } catch (error) {
        console.error("Error calling generate-feedback:", error);
      }

      setStep("complete");
      toast.success("Interview completed!");
    },
    onError: (error) => {
      toast.error(`Voice connection error: ${error.message}`);
    },
  });

  // Timer for interview
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "interview" && isConnected) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleJoinInterview = async () => {
    if (!candidateName || !candidateEmail) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!id) {
      toast.error("Invalid interview link");
      return;
    }

    try {
      // Create a user_answer record to track this candidate (via backend for public access)
      const { data: startData, error: startError } = await supabase.functions.invoke(
        "candidate-start-interview",
        {
          body: {
            interviewId: id,
            candidateName,
            candidateEmail,
          },
        }
      );

      if (startError) {
        throw new Error(startError.message);
      }

      const createdUserAnswerId = (startData as any)?.userAnswerId as string | undefined;
      if (!createdUserAnswerId) {
        throw new Error("Failed to start interview session");
      }

      setUserAnswerId(createdUserAnswerId);
      setStep("interview");

      // Start Vapi voice call
      const questions = (interview?.questions as string[]) || [];
      await startCall({
        name: "AI Recruiter",
        firstMessage: `Hello ${candidateName}! Welcome to your interview for the ${interview?.position} position. I'm your AI interviewer today. Before we begin, please make sure you're in a quiet place. Are you ready to start?`,
        systemPrompt: `You are an AI recruiter conducting a job interview for the position of ${interview?.position}. 
The candidate's name is ${candidateName}.
Job Description: ${interview?.job_desc}
Required Experience: ${interview?.job_experience} years
Tech Stack: ${interview?.tech_stack}

Be professional, friendly, and encouraging. Listen carefully to the candidate's responses.`,
        questions,
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to start interview. Please try again.";
      toast.error(message);
    }
  };

  const handleEndInterview = async () => {
    endCall();
  };

  // Generate volume bars based on actual volume level
  const generateVolumeBars = () => {
    const bars = [];
    for (let i = 0; i < 12; i++) {
      const baseHeight = 8;
      const maxAdditional = 32;
      const height = isSpeaking 
        ? baseHeight + (volumeLevel * maxAdditional * (0.5 + Math.random() * 0.5))
        : baseHeight;
      bars.push(height);
    }
    return bars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading interview...</div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Interview Not Found</h2>
            <p className="text-muted-foreground">
              This interview link may have expired or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const questions = (interview.questions as string[]) || [];

  return (
    <div className="min-h-screen bg-sidebar">
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Logo variant="light" size="lg" />
          {step === "interview" && (
            <div className="flex items-center gap-4">
              {isConnected && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Connected
                </div>
              )}
              <div className="flex items-center gap-2 text-sidebar-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(elapsedTime)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {step === "welcome" && (
          <Card className="animate-fade-in">
            <CardContent className="py-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">AI-Powered Interview Platform</h1>
                <h2 className="text-xl text-primary font-semibold">{interview.position}</h2>
                <p className="text-muted-foreground mt-2">
                  Duration: {interview.interview_duration || 30} Minutes
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="name">Enter your full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="e.g., John Smith"
                      className="pl-10"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Enter your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., john@example.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-muted rounded-xl p-4 mb-8">
                <h3 className="font-semibold mb-3">Before you begin</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    Test your camera and microphone
                  </li>
                  <li className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary" />
                    Ensure you have a stable internet connection
                  </li>
                  <li className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-primary" />
                    Find a quiet place for interview
                  </li>
                </ul>
              </div>

              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleJoinInterview}
                disabled={isVapiLoading}
              >
                {isVapiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Join Interview"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "interview" && (
          <div className="space-y-6 animate-fade-in">
            <Card className="bg-sidebar-accent border-sidebar-border">
              <CardContent className="py-8 text-center">
                <h2 className="text-lg font-semibold text-sidebar-foreground mb-6">
                  AI Interview Session
                </h2>

                {/* AI Avatar */}
                <div className="relative inline-block mb-6">
                  <div 
                    className={cn(
                      "w-32 h-32 rounded-full gradient-primary flex items-center justify-center shadow-glow transition-all duration-300",
                      isSpeaking && "scale-105 shadow-glow-lg"
                    )}
                  >
                    {isVapiLoading || !isConnected ? (
                      <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                    ) : (
                      <Mic className="w-12 h-12 text-primary-foreground" />
                    )}
                  </div>
                  {isSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full gradient-primary opacity-30 animate-ping" />
                      <div className="absolute inset-0 rounded-full gradient-primary opacity-20 animate-pulse" />
                    </>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-sidebar-foreground">AI Recruiter</h3>
                  <p className="text-sm text-sidebar-foreground/70">
                    {!isConnected ? "Connecting..." : isSpeaking ? "Speaking..." : "Listening..."}
                  </p>
                </div>

                {/* Voice Waves */}
                <div className="flex justify-center gap-1 mb-8">
                  {generateVolumeBars().map((height, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full transition-all duration-100"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>

                {/* Questions Info */}
                <div className="bg-sidebar rounded-xl p-4 text-left mb-6">
                  <p className="text-xs text-sidebar-foreground/50 mb-2">
                    Interview for {interview.position}
                  </p>
                  <p className="text-sidebar-foreground text-sm">
                    {questions.length} questions prepared • Just speak naturally
                  </p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button 
                    variant="destructive" 
                    size="lg"
                    onClick={handleEndInterview}
                    disabled={!isConnected}
                  >
                    <MicOff className="w-5 h-5 mr-2" />
                    End Interview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{candidateName}</p>
                    <p className="text-sm text-muted-foreground">
                      {isConnected ? "Interview in Progress..." : "Connecting to AI..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "complete" && (
          <Card className="animate-scale-in">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
              <p className="text-muted-foreground mb-8">
                Thank you for participating in the AI-driven interview with AIcruiter
              </p>

              <div className="bg-muted rounded-xl p-6 text-left">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <p className="text-muted-foreground text-sm">
                  The recruiter will review your interview responses and will contact you 
                  regarding the next steps in the hiring process.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
