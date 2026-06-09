-- ==========================================
-- ASSETRA SaaS DATABASE MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add SaaS columns to the buildings table
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year');
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT;

-- 2. Update existing buildings to have a default subscription expiry of 1 year from now
UPDATE buildings 
SET is_active = TRUE, 
    subscription_expires_at = NOW() + INTERVAL '1 year'
WHERE subscription_expires_at IS NULL;

-- 3. Enable Row-Level Security (RLS) on all tenant tables (for data isolation)
-- Note: Replace with your actual table names if different.
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies (Tenant isolation by building_code)

-- flats policies
CREATE POLICY "flats_tenant_isolation" ON flats 
    FOR ALL 
    TO public 
    USING (building_code = CURRENT_SETTING('request.jwt.claims', true)::json->>'building_code' OR CURRENT_SETTING('request.jwt.claims', true)::json->>'role' = 'service_role');

-- reminders policies
CREATE POLICY "reminders_tenant_isolation" ON reminders 
    FOR ALL 
    TO public 
    USING (building_code = CURRENT_SETTING('request.jwt.claims', true)::json->>'building_code' OR CURRENT_SETTING('request.jwt.claims', true)::json->>'role' = 'service_role');

-- payments policies
CREATE POLICY "payments_tenant_isolation" ON payments 
    FOR ALL 
    TO public 
    USING (building_code = CURRENT_SETTING('request.jwt.claims', true)::json->>'building_code' OR CURRENT_SETTING('request.jwt.claims', true)::json->>'role' = 'service_role');
