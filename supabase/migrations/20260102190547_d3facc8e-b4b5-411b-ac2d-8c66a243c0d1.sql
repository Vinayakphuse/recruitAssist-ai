-- Add recruiter decision tracking columns to user_answers
ALTER TABLE public.user_answers 
ADD COLUMN final_decision text DEFAULT NULL,
ADD COLUMN decision_by uuid REFERENCES auth.users(id) DEFAULT NULL,
ADD COLUMN decision_at timestamp with time zone DEFAULT NULL;