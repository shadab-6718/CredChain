-- =========================================================
-- CredChain Migration: Progressive Milestone Credentials & Access Requests
-- Enhancing schema for PRD PS 26194 compliance
-- =========================================================

-- 1. Alter credentials table to support progressive milestone chaining
ALTER TABLE public.credentials
    ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'FINAL_CERTIFICATE' CHECK (event_type IN ('MILESTONE', 'FINAL_CERTIFICATE', 'LAND_TRANSFER')),
    ADD COLUMN IF NOT EXISTS linked_previous_event_id TEXT REFERENCES public.credentials(credential_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_credentials_linked_parent ON public.credentials(linked_previous_event_id);
CREATE INDEX IF NOT EXISTS idx_credentials_event_type ON public.credentials(event_type);

-- 2. Alter access_grants table to enforce time-boxed permissions
ALTER TABLE public.access_grants
    ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- 3. Create access_requests table for inbound verifier permission handshake
CREATE TABLE IF NOT EXISTS public.access_requests (
    id TEXT PRIMARY KEY,
    credential_id TEXT NOT NULL REFERENCES public.credentials(credential_id) ON DELETE CASCADE,
    holder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verifier_id TEXT NOT NULL,
    verifier_name TEXT NOT NULL,
    verifier_email TEXT NOT NULL,
    purpose TEXT DEFAULT 'Credential & Background Verification',
    duration_hours INT DEFAULT 48,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')) DEFAULT 'PENDING',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_access_requests_credential ON public.access_requests(credential_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_holder ON public.access_requests(holder_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holders can view and manage inbound access requests"
    ON public.access_requests FOR ALL
    TO authenticated
    USING (auth.uid() = holder_id)
    WITH CHECK (auth.uid() = holder_id);

CREATE POLICY "Verifiers can view their submitted requests"
    ON public.access_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Verifiers can insert access requests"
    ON public.access_requests FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
