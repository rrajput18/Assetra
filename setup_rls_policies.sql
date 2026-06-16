-- =========================================================
-- ASSETRA ROW-LEVEL SECURITY (RLS) POLICIES
-- Run this script in your Supabase SQL Editor to secure the database.
-- =========================================================

-- 1. Enable RLS on all tables
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "public_select_buildings" ON buildings;
DROP POLICY IF EXISTS "public_insert_buildings" ON buildings;
DROP POLICY IF EXISTS "admin_update_building" ON buildings;
DROP POLICY IF EXISTS "superadmin_all_buildings" ON buildings;

DROP POLICY IF EXISTS "admin_all_flats" ON flats;
DROP POLICY IF EXISTS "member_select_flat" ON flats;
DROP POLICY IF EXISTS "member_update_flat" ON flats;
DROP POLICY IF EXISTS "public_insert_flats" ON flats;

DROP POLICY IF EXISTS "admin_all_reminders" ON reminders;
DROP POLICY IF EXISTS "member_select_reminders" ON reminders;

DROP POLICY IF EXISTS "admin_all_payments" ON payments;
DROP POLICY IF EXISTS "member_select_payments" ON payments;
DROP POLICY IF EXISTS "member_insert_payments" ON payments;


-- =========================================================
-- BUILDINGS TABLE POLICIES
-- =========================================================

-- Allow anyone to read buildings (needed for public validation & logins)
CREATE POLICY "public_select_buildings" ON buildings 
    FOR SELECT 
    TO public 
    USING (true);

-- Allow anyone to register a new building
CREATE POLICY "public_insert_buildings" ON buildings 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Allow admins to update their own building details
CREATE POLICY "admin_update_building" ON buildings 
    FOR UPDATE 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' AND code = (auth.jwt() -> 'user_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin')
    );

-- Allow superadmins complete access to buildings
CREATE POLICY "superadmin_all_buildings" ON buildings 
    FOR ALL 
    TO authenticated 
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin');


-- =========================================================
-- FLATS TABLE POLICIES
-- =========================================================

-- Allow admins full access to flats in their own building, and superadmins full access
CREATE POLICY "admin_all_flats" ON flats 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin')
    );

-- Allow public inserts to flats (for registration before signing in) and admin inserts
CREATE POLICY "public_insert_flats" ON flats 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Allow members to read their own flat, admins to read all flats in their building, and public login checks
CREATE POLICY "member_select_flat" ON flats 
    FOR SELECT 
    TO public, authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'user_metadata' ->> 'flat_no'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin')
        OR (auth.role() = 'anon') -- Allow public queries for code + flat number checks during login/setup
    );

-- Allow members to update their own flat password/username
CREATE POLICY "member_update_flat" ON flats 
    FOR UPDATE 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'user_metadata' ->> 'flat_no'))
    );


-- =========================================================
-- REMINDERS TABLE POLICIES
-- =========================================================

-- Allow admins to manage reminders in their own building, and superadmins full access
CREATE POLICY "admin_all_reminders" ON reminders 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin')
    );

-- Allow members to view reminders sent to their flat
CREATE POLICY "member_select_reminders" ON reminders 
    FOR SELECT 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'user_metadata' ->> 'flat_no'))
    );


-- =========================================================
-- PAYMENTS TABLE POLICIES
-- =========================================================

-- Allow admins to view payments in their own building, and superadmins full access
CREATE POLICY "admin_all_payments" ON payments 
    FOR ALL 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code'))
        OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'superadmin')
    );

-- Allow members to view their own payments
CREATE POLICY "member_select_payments" ON payments 
    FOR SELECT 
    TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'user_metadata' ->> 'flat_no'))
    );

-- Allow members to record payments under their flat, or public checkout callback
CREATE POLICY "member_insert_payments" ON payments 
    FOR INSERT 
    TO public, authenticated 
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role' = 'member' AND building_code = (auth.jwt() -> 'user_metadata' ->> 'building_code') AND flat_no = (auth.jwt() -> 'user_metadata' ->> 'flat_no'))
        OR (auth.role() = 'anon') -- Allow simulated or real payment records before auth state binds
    );
