-- ============================================
-- 1. CHECK IF TABLES EXIST
-- ============================================
SELECT 
    schemaname,
    tablename 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename IN ('profiles', 'user_credits', 'companies')
ORDER BY 
    tablename;

-- ============================================
-- 2. CHECK PROFILES TABLE STRUCTURE
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- ============================================
-- 3. CHECK USER_CREDITS TABLE STRUCTURE
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_credits'
ORDER BY 
    ordinal_position;

-- ============================================
-- 4. CHECK RLS STATUS
-- ============================================
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'user_credits', 'companies');

-- ============================================
-- 5. CHECK EXISTING RLS POLICIES
-- ============================================
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'user_credits', 'companies')
ORDER BY 
    tablename, policyname;

-- ============================================
-- 6. CHECK EXISTING TRIGGERS
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    OR event_object_schema = 'auth';

-- ============================================
-- 7. CHECK AUTH.USERS TABLE (last 5 users)
-- ============================================
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM 
    auth.users
ORDER BY 
    created_at DESC
LIMIT 5;

-- ============================================
-- 8. CHECK IF PROFILE EXISTS FOR RECENT USERS
-- ============================================
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.created_at as profile_created
FROM 
    auth.users u
LEFT JOIN 
    public.profiles p ON u.id = p.id
ORDER BY 
    u.created_at DESC
LIMIT 5;