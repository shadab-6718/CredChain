-- CredChain Migration: Holder Acceptance Workflow & Recipient Details
-- Date: 2026-09-27

-- 1. Update status check constraint on credentials table
ALTER TABLE IF EXISTS public.credentials DROP CONSTRAINT IF EXISTS credentials_status_check;
ALTER TABLE IF EXISTS public.credentials ADD CONSTRAINT credentials_status_check 
  CHECK (status IN ('ACTIVE', 'PENDING', 'REJECTED', 'REVOKED'));

-- 2. Update action check constraint on credential_history table
ALTER TABLE IF EXISTS public.credential_history DROP CONSTRAINT IF EXISTS credential_history_action_check;
ALTER TABLE IF EXISTS public.credential_history ADD CONSTRAINT credential_history_action_check 
  CHECK (action IN ('ISSUED', 'MILESTONE_CHAINED', 'VERIFIED', 'ACCESS_GRANTED', 'ACCESS_REVOKED', 'REVOKED', 'ACCEPTED', 'REJECTED'));

-- 3. Add explicit holder_name and recipient_name columns to credentials table
ALTER TABLE IF EXISTS public.credentials ADD COLUMN IF NOT EXISTS holder_name TEXT;
ALTER TABLE IF EXISTS public.credentials ADD COLUMN IF NOT EXISTS recipient_name TEXT;
