-- Add selection_status to user_answers table
ALTER TABLE public.user_answers 
ADD COLUMN IF NOT EXISTS selection_status text DEFAULT 'pending';

-- Create offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.user_answers(id) ON DELETE CASCADE,
  interview_id uuid NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for offers table
CREATE POLICY "Recruiters can view offers for own interviews"
ON public.offers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM interviews
  WHERE interviews.id = offers.interview_id
  AND interviews.created_by = auth.uid()
));

CREATE POLICY "Recruiters can create offers for own interviews"
ON public.offers
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM interviews
  WHERE interviews.id = offers.interview_id
  AND interviews.created_by = auth.uid()
));

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'selection',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert notifications (for edge function)
CREATE POLICY "Anyone can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can view their own notifications by email
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (true);