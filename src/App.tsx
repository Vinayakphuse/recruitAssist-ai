import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CreateInterview from "./pages/CreateInterview";
import InterviewDetails from "./pages/InterviewDetails";
import CandidateInterview from "./pages/CandidateInterview";
import ScheduledInterviews from "./pages/ScheduledInterviews";
import AllInterviews from "./pages/AllInterviews";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/create" element={<CreateInterview />} />
            <Route path="/dashboard/interview/:id" element={<InterviewDetails />} />
            <Route path="/dashboard/scheduled" element={<ScheduledInterviews />} />
            <Route path="/dashboard/interviews" element={<AllInterviews />} />
            <Route path="/dashboard/billing" element={<Billing />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/interview/:id" element={<CandidateInterview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
