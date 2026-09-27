-- =========================================================
-- CredChain — Tamper-Evident Credential Registry Schema
-- Polygon Amoy + Supabase + IPFS + RLS Architecture
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Linked directly to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('issuer', 'holder', 'verifier')) DEFAULT 'holder',
    wallet_address TEXT,
    organization TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by wallet address & role
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL UNIQUE,
    holder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    holder_wallet TEXT,
    issuer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issuer_wallet TEXT NOT NULL,
    issuer_name TEXT NOT NULL,
    credential_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_name TEXT NOT NULL,
    document_size_bytes BIGINT,
    pinata_cid TEXT NOT NULL,
    document_hash TEXT NOT NULL, -- SHA-256 hash (hex string)
    blockchain_tx_hash TEXT,
    blockchain_network TEXT NOT NULL DEFAULT 'Polygon Amoy',
    contract_address TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')) DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_credentials_id ON public.credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_credentials_holder ON public.credentials(holder_id);
CREATE INDEX IF NOT EXISTS idx_credentials_issuer ON public.credentials(issuer_id);
CREATE INDEX IF NOT EXISTS idx_credentials_hash ON public.credentials(document_hash);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON public.credentials(status);

-- 3. CREDENTIAL HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.credential_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL REFERENCES public.credentials(credential_id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('ISSUED', 'VERIFIED', 'ACCESS_GRANTED', 'ACCESS_REVOKED', 'REVOKED')),
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    performed_by_name TEXT,
    performed_by_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    transaction_hash TEXT,
    is_blockchain_event BOOLEAN NOT NULL DEFAULT false,
    details TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_history_credential_id ON public.credential_history(credential_id);
CREATE INDEX IF NOT EXISTS idx_history_timestamp ON public.credential_history(timestamp DESC);

-- 4. ACCESS GRANTS TABLE
-- Manages off-chain and fine-grained authorization for verifiers
CREATE TABLE IF NOT EXISTS public.access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id TEXT NOT NULL REFERENCES public.credentials(credential_id) ON DELETE CASCADE,
    holder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verifier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verifier_name TEXT,
    verifier_email TEXT,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_active_grant UNIQUE (credential_id, verifier_id)
);

CREATE INDEX IF NOT EXISTS idx_grants_credential ON public.access_grants(credential_id);
CREATE INDEX IF NOT EXISTS idx_grants_holder ON public.access_grants(holder_id);
CREATE INDEX IF NOT EXISTS idx_grants_verifier ON public.access_grants(verifier_id);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by all authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- CREDENTIALS POLICIES
-- 1. Issuers can see credentials they issued
CREATE POLICY "Issuers can view their issued credentials"
    ON public.credentials FOR SELECT
    TO authenticated
    USING (auth.uid() = issuer_id);

-- 2. Holders can see credentials assigned to them
CREATE POLICY "Holders can view their credentials"
    ON public.credentials FOR SELECT
    TO authenticated
    USING (auth.uid() = holder_id);

-- 3. Verifiers with an ACTIVE access grant can view credential details
CREATE POLICY "Authorized verifiers can view credentials"
    ON public.credentials FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.access_grants
            WHERE access_grants.credential_id = credentials.credential_id
            AND access_grants.verifier_id = auth.uid()
            AND access_grants.status = 'ACTIVE'
        )
    );

-- 4. Public verification: anyone (including anon) can query non-sensitive proof metadata by credential_id
CREATE POLICY "Anyone can query credential proof verification"
    ON public.credentials FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5. Only issuers can insert new credentials
CREATE POLICY "Issuers can insert credentials"
    ON public.credentials FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = issuer_id AND
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'issuer'
        )
    );

-- 6. Only issuers can update status to REVOKED
CREATE POLICY "Issuers can revoke their credentials"
    ON public.credentials FOR UPDATE
    TO authenticated
    USING (auth.uid() = issuer_id)
    WITH CHECK (auth.uid() = issuer_id);

-- ACCESS GRANTS POLICIES
CREATE POLICY "Holders can manage access grants"
    ON public.access_grants FOR ALL
    TO authenticated
    USING (auth.uid() = holder_id)
    WITH CHECK (auth.uid() = holder_id);

CREATE POLICY "Verifiers can view their grants"
    ON public.access_grants FOR SELECT
    TO authenticated
    USING (auth.uid() = verifier_id);

-- CREDENTIAL HISTORY POLICIES
CREATE POLICY "Stakeholders can view credential history"
    ON public.credential_history FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated users can log credential history"
    ON public.credential_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =========================================================
-- AUTH TRIGGERS & AUTO PROFILE CREATION
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'holder'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
