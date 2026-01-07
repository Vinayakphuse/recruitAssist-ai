import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useInterviews, useDeleteInterview } from "@/hooks/useInterviews";
import { format } from "date-fns";
import { Calendar, Clock, Users, Plus, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ScheduledInterviews() {
  const { user, isLoading: authLoading } = useAuth();
  const { interviews, isLoading } = useInterviews();
  const deleteInterview = useDeleteInterview();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteInterview.mutateAsync(deleteId);
      toast.success("Interview deleted successfully");
    } catch {
      toast.error("Failed to delete interview");
    }
    setDeleteId(null);
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Filter interviews that have scheduled slots (for now, show all active interviews)
  const scheduledInterviews = interviews?.filter(interview => interview.public_link) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scheduled Interviews</h1>
            <p className="text-muted-foreground">Manage your upcoming interview sessions</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/create">
              <Plus className="w-4 h-4 mr-2" />
              Schedule New
            </Link>
          </Button>
        </div>

        {scheduledInterviews.length > 0 ? (
          <div className="grid gap-4">
            {scheduledInterviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CalendarClock className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{interview.position}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(interview.created_at), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {interview.interview_duration || 30} Min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        Open
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteId(interview.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/interview/${interview.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <CalendarClock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No scheduled interviews</h3>
              <p className="text-muted-foreground mb-4">
                Create an interview to start scheduling candidates
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this interview? This action cannot be undone and will remove all associated candidate data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}