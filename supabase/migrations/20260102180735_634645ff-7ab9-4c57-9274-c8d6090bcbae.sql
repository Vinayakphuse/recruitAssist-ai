-- Allow recruiters to delete answers for their own interviews
CREATE POLICY "Recruiters can delete answers for own interviews" 
ON public.user_answers 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM interviews 
  WHERE interviews.id = user_answers.interview_id 
  AND interviews.created_by = auth.uid()
));