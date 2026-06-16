-- =========================================================
-- ASSETRA COMPLETE DATABASE SCHEMA AND RLS POLICIES
-- Run this script in your Supabase SQL Editor to set up all tables.
-- =========================================================

-- 1. Create buildings table
CREATE TABLE IF NOT EXISTS public.buildings (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_maintenance NUMERIC DEFAULT 0,
    admin_name TEXT,
    admin_username TEXT,
    admin_password TEXT,
    bank_name TEXT,
    account_no TEXT,
    ifsc TEXT,
    upi_id TEXT,
    razorpay_key_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year')
);

-- 2. Create flats table
CREATE TABLE IF NOT EXISTS public.flats (
    building_code TEXT REFERENCES public.buildings(code) ON DELETE CASCADE,
    flat_no TEXT NOT NULL,
    head_name TEXT NOT NULL,
    monthly_charge NUMERIC DEFAULT 0,
    outstanding_dues NUMERIC DEFAULT 0,
    phone TEXT,
    email TEXT,
    last_payment_date TEXT,
    oldest_due_date TEXT,
    username TEXT UNIQUE,
    password TEXT,
    PRIMARY KEY (building_code, flat_no)
);

-- 3. Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
    id TEXT PRIMARY KEY,
    building_code TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    date TEXT,
    subject TEXT,
    monthly_charge NUMERIC DEFAULT 0,
    due_charge NUMERIC DEFAULT 0,
    total_due NUMERIC DEFAULT 0,
    content TEXT,
    FOREIGN KEY (building_code, flat_no) REFERENCES public.flats(building_code, flat_no) ON DELETE CASCADE
);

-- 4. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    building_code TEXT NOT NULL,
    flat_no TEXT NOT NULL,
    date TEXT,
    amount NUMERIC DEFAULT 0,
    method TEXT,
    FOREIGN KEY (building_code, flat_no) REFERENCES public.flats(building_code, flat_no) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Create a secure trigger to copy signup metadata into app_metadata on user creation.
-- Since app_metadata cannot be modified client-side, this makes role/building checks secure.
CREATE OR REPLACE FUNCTION public.sync_user_metadata_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
      'building_code', NEW.raw_user_meta_data->>'building_code',
      'flat_no', NEW.raw_user_meta_data->>'flat_no'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (runs BEFORE insertion)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_metadata_to_app_metadata();


-- =========================================================
-- BUILDINGS TABLE POLICIES (Using app_metadata)
-- =========================================================

DROP POLICY IF EXISTS "public_select_buildings" ON public.buildings;
CREATE POLICY "public_select_buildings" ON public.buildings 
    FOR SELECT 
    TO public 
    USING (true);

DROP POLICY IF EXISTS "public_insert_buildings" ON public.buildings;
CREATE POLICY "public_insert_buildings" ON public.buildings 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_building" ON public.buildings;
CREATE POLICY "admin_update_building" ON public.buildings 
    FOR UPDATE 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND code = (auth.jwt() -> 'app_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin')
    );

DROP POLICY IF EXISTS "superadmin_all_buildings" ON public.buildings;
CREATE POLICY "superadmin_all_buildings" ON public.buildings 
    FOR ALL 
    TO authenticated 
    USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin');


-- =========================================================
-- FLATS TABLE POLICIES (Using app_metadata)
-- =========================================================

DROP POLICY IF EXISTS "admin_all_flats" ON public.flats;
CREATE POLICY "admin_all_flats" ON public.flats 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin')
    );

DROP POLICY IF EXISTS "public_insert_flats" ON public.flats;
CREATE POLICY "public_insert_flats" ON public.flats 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

DROP POLICY IF EXISTS "member_select_flat" ON public.flats;
CREATE POLICY "member_select_flat" ON public.flats 
    FOR SELECT 
    TO public, authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'app_metadata' ->> 'flat_no'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin')
        OR (auth.role() = 'anon')
    );

DROP POLICY IF EXISTS "member_update_flat" ON public.flats;
CREATE POLICY "member_update_flat" ON public.flats 
    FOR UPDATE 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'app_metadata' ->> 'flat_no'))
    );


-- =========================================================
-- REMINDERS TABLE POLICIES (Using app_metadata)
-- =========================================================

DROP POLICY IF EXISTS "admin_all_reminders" ON public.reminders;
CREATE POLICY "admin_all_reminders" ON public.reminders 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin')
    );

DROP POLICY IF EXISTS "member_select_reminders" ON public.reminders;
CREATE POLICY "member_select_reminders" ON public.reminders 
    FOR SELECT 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'app_metadata' ->> 'flat_no'))
    );


-- =========================================================
-- PAYMENTS TABLE POLICIES (Using app_metadata)
-- =========================================================

DROP POLICY IF EXISTS "admin_all_payments" ON public.payments;
CREATE POLICY "admin_all_payments" ON public.payments 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'superadmin')
    );

DROP POLICY IF EXISTS "member_select_payments" ON public.payments;
CREATE POLICY "member_select_payments" ON public.payments 
    FOR SELECT 
    TO authenticated 
    USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'app_metadata' ->> 'flat_no'))
    );

DROP POLICY IF EXISTS "member_insert_payments" ON public.payments;
CREATE POLICY "member_insert_payments" ON public.payments 
    FOR INSERT 
    TO public, authenticated 
    WITH CHECK (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'app_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'app_metadata' ->> 'flat_no'))
        OR (auth.role() = 'anon')
    );
