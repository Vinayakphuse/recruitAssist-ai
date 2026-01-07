-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  image_url text,
  credits integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, image_url)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create interviews table
CREATE TABLE public.interviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  position text NOT NULL,
  job_desc text NOT NULL,
  job_experience numeric NOT NULL DEFAULT 0,
  tech_stack text NOT NULL,
  interview_duration integer DEFAULT 30,
  interview_types text[] DEFAULT ARRAY['Technical'],
  questions jsonb,
  public_link text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Policies for interviews
CREATE POLICY "Users can view own interviews" 
  ON public.interviews FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create interviews" 
  ON public.interviews FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own interviews" 
  ON public.interviews FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own interviews" 
  ON public.interviews FOR DELETE 
  USING (auth.uid() = created_by);

-- Public policy for candidates to view interview via public link
CREATE POLICY "Anyone can view interviews via public link" 
  ON public.interviews FOR SELECT 
  USING (public_link IS NOT NULL);

-- Create user_answers table for candidate responses
CREATE TABLE public.user_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id uuid REFERENCES public.interviews(id) ON DELETE CASCADE NOT NULL,
  candidate_name text NOT NULL,
  candidate_email text NOT NULL,
  transcript text,
  rating numeric,
  feedback_summary text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS for user_answers
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

-- Recruiters can view answers for their interviews
CREATE POLICY "Recruiters can view answers for own interviews" 
  ON public.user_answers FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = user_answers.interview_id 
      AND interviews.created_by = auth.uid()
    )
  );

-- Anyone can insert answers (candidates don't need auth)
CREATE POLICY "Anyone can submit interview answers" 
  ON public.user_answers FOR INSERT 
  WITH CHECK (true);

-- Recruiters can update answers for their interviews
CREATE POLICY "Recruiters can update answers for own interviews" 
  ON public.user_answers FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.interviews 
      WHERE interviews.id = user_answers.interview_id 
      AND interviews.created_by = auth.uid()
    )
  );