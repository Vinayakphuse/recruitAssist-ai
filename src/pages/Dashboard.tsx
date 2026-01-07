import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews } from "@/hooks/useInterviews";
import { Plus, Calendar, Clock, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { interviews, isLoading: interviewsLoading } = useInterviews();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
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
      <div className="space-y-8">
        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-colors cursor-pointer group">
            <Link to="/dashboard/create" className="block p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
                  <Plus className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Create New Interview</h3>
                  <p className="text-sm text-muted-foreground">
                    Create AI interviews and schedule them with candidates
                  </p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors cursor-pointer group opacity-50">
            <div className="block p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                  <Clock className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Create Phone Screening Call</h3>
                  <p className="text-sm text-muted-foreground">
                    Coming soon...
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Previous Interviews */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Previously Created Interviews</h2>
          
          {interviewsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                  <CardFooter>
                    <div className="h-9 bg-muted rounded w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : interviews && interviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviews.map((interview, index) => (
                <Card 
                  key={interview.id} 
                  className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(interview.created_at), "MMM dd, yyyy")}
                    </div>
                    <CardTitle className="text-lg">{interview.position}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {interview.interview_duration || 30} Min
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyLink(`${window.location.origin}/interview/${interview.id}`)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                    >
                      <Link to={`/dashboard/interview/${interview.id}`}>
                        <Link2 className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No interviews yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first AI-powered interview to get started
                </p>
                <Button asChild>
                  <Link to="/dashboard/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
