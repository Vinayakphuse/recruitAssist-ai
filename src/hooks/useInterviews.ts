import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Interview {
  id: string;
  position: string;
  job_desc: string;
  job_experience: number;
  tech_stack: string;
  interview_duration: number | null;
  interview_types: string[] | null;
  questions: string[] | null;
  public_link: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateInterviewInput {
  position: string;
  job_desc: string;
  job_experience: number;
  tech_stack: string;
  interview_duration: number;
  interview_types: string[];
  questions: string[];
}

export function useInterviews() {
  const { user } = useAuth();

  const { data: interviews, isLoading, error } = useQuery({
    queryKey: ["interviews", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Interview[];
    },
    enabled: !!user,
  });

  return { interviews, isLoading, error };
}

export function useInterview(id: string | undefined) {
  const { data: interview, isLoading, error } = useQuery({
    queryKey: ["interview", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Interview | null;
    },
    enabled: !!id,
  });

  return { interview, isLoading, error };
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateInterviewInput) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("interviews")
        .insert({
          ...input,
          created_by: user.id,
          public_link: crypto.randomUUID(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as Interview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
    },
  });
}

export function useInterviewCandidates(interviewId: string | undefined) {
  const { data: candidates, isLoading, error, refetch } = useQuery({
    queryKey: ["interview-candidates", interviewId],
    queryFn: async () => {
      if (!interviewId) return [];
      const { data, error } = await supabase
        .from("user_answers")
        .select("id, interview_id, candidate_name, candidate_email, rating, feedback_summary, status, selection_status, final_decision, decision_by, decision_at, ai_recommendation, transcript, created_at")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!interviewId,
    // Poll to auto-refresh status/ratings as the candidate finishes + AI feedback is generated
    refetchInterval: 5000,
  });

  return { candidates, isLoading, error, refetch };
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from("user_answers")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interview-candidates"] });
    },
  });
}
