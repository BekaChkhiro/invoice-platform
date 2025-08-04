-- Create profiles table trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    now(),
    now()
  );
  
  -- Also create initial credits for the user
  INSERT INTO public.user_credits (user_id, total_credits, used_credits, plan_type, created_at, updated_at)
  VALUES (
    new.id,
    5,  -- 5 free credits
    0,
    'free',
    now(),
    now()
  );
  
  RETURN new;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Enable RLS on user_credits table
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policies for user_credits table
-- Users can view their own credits
CREATE POLICY "Users can view own credits" 
  ON public.user_credits 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own credits (for future use)
CREATE POLICY "Users can update own credits" 
  ON public.user_credits 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable RLS on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
-- Users can view their own companies
CREATE POLICY "Users can view own companies" 
  ON public.companies 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies" 
  ON public.companies 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies" 
  ON public.companies 
  FOR DELETE 
  USING (auth.uid() = user_id);