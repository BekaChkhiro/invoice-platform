-- ============================================
-- CLEAN DATABASE SETUP SCRIPT
-- This script safely creates tables and policies
-- ============================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CREATE TABLES (only if they don't exist)
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_credits INTEGER DEFAULT 5 NOT NULL,
    used_credits INTEGER DEFAULT 0 NOT NULL,
    plan_type TEXT DEFAULT 'free' NOT NULL,
    plan_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tax_id TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    logo_url TEXT,
    bank_name TEXT,
    bank_account TEXT,
    bank_swift TEXT,
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 0,
    invoice_notes TEXT,
    payment_terms TEXT,
    vat_rate DECIMAL(5,2) DEFAULT 18.00,
    currency TEXT DEFAULT '₾',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE POLICIES (with proper error handling)
-- ============================================

-- Profiles policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" 
            ON public.profiles 
            FOR SELECT 
            USING (auth.uid() = id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" 
            ON public.profiles 
            FOR UPDATE 
            USING (auth.uid() = id);
    END IF;
END $$;

-- User credits policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_credits' AND policyname = 'Users can view own credits') THEN
        CREATE POLICY "Users can view own credits" 
            ON public.user_credits 
            FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_credits' AND policyname = 'Users can update own credits') THEN
        CREATE POLICY "Users can update own credits" 
            ON public.user_credits 
            FOR UPDATE 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Companies policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can view own companies') THEN
        CREATE POLICY "Users can view own companies" 
            ON public.companies 
            FOR SELECT 
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can insert own companies') THEN
        CREATE POLICY "Users can insert own companies" 
            ON public.companies 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can update own companies') THEN
        CREATE POLICY "Users can update own companies" 
            ON public.companies 
            FOR UPDATE 
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can delete own companies') THEN
        CREATE POLICY "Users can delete own companies" 
            ON public.companies 
            FOR DELETE 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- ============================================
-- 4. CREATE TRIGGER FOR AUTO PROFILE CREATION
-- ============================================

-- Drop existing function and trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (
        new.id,
        new.email,
        new.created_at,
        new.created_at
    );
    
    -- Create user credits with 5 free credits
    INSERT INTO public.user_credits (user_id, total_credits, used_credits, plan_type)
    VALUES (
        new.id,
        5,
        0,
        'free'
    );
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. CREATE PROFILES FOR EXISTING USERS
-- ============================================

-- Insert profiles for users who don't have one
INSERT INTO public.profiles (id, email, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.created_at
FROM 
    auth.users u
LEFT JOIN 
    public.profiles p ON u.id = p.id
WHERE 
    p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Insert credits for users who don't have them
INSERT INTO public.user_credits (user_id, total_credits, used_credits, plan_type)
SELECT 
    p.id,
    5,
    0,
    'free'
FROM 
    public.profiles p
LEFT JOIN 
    public.user_credits c ON p.id = c.user_id
WHERE 
    c.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 6. VERIFICATION - CHECK SETUP
-- ============================================

-- Show tables created
SELECT 
    tablename as "Created Tables"
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename IN ('profiles', 'user_credits', 'companies');

-- Show policies created
SELECT 
    tablename as "Table",
    policyname as "Policy"
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'user_credits', 'companies')
ORDER BY 
    tablename, policyname;

-- Show recent users with their profiles
SELECT 
    u.email,
    CASE WHEN p.id IS NOT NULL THEN 'Yes' ELSE 'No' END as "Has Profile",
    CASE WHEN c.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as "Has Credits"
FROM 
    auth.users u
LEFT JOIN 
    public.profiles p ON u.id = p.id
LEFT JOIN 
    public.user_credits c ON p.id = c.user_id
ORDER BY 
    u.created_at DESC
LIMIT 5;