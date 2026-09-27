-- =========================================================
-- CredChain — Demo Seed Data (SIH 2026 Presentation)
-- Fulfilling PRD PS26194 Differentiator Scenarios
-- =========================================================

DO $$
DECLARE
    issuer_uuid UUID := '11111111-1111-1111-1111-111111111111';
    holder_uuid UUID := '22222222-2222-2222-2222-222222222222';
    verifier_uuid UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- 1. Insert Demo Profiles
    INSERT INTO public.profiles (id, full_name, email, role, wallet_address, organization)
    VALUES
        (issuer_uuid, 'ABC Institute of Technology', 'registrar@abc-university.edu', 'issuer', '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619', 'ABC University'),
        (holder_uuid, 'Rahul Kumar', 'rahul.kumar.demo@gmail.com', 'holder', '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df', 'Student / Alumnus'),
        (verifier_uuid, 'XYZ Global Bank HR & Verifications', 'verifications@xyz-bank.com', 'verifier', '0x976EA74026E726554dB657fA54763abd0C3a0aa9', 'XYZ Bank')
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        wallet_address = EXCLUDED.wallet_address;

    -- 2. Insert Demo Progressive Credentials (PRD Section 3A & 6)
    INSERT INTO public.credentials (
        credential_id,
        holder_id,
        holder_wallet,
        issuer_id,
        issuer_wallet,
        issuer_name,
        credential_type,
        event_type,
        linked_previous_event_id,
        title,
        description,
        document_name,
        document_size_bytes,
        pinata_cid,
        document_hash,
        blockchain_tx_hash,
        blockchain_network,
        contract_address,
        issued_at,
        status,
        is_encrypted,
        metadata
    )
    VALUES
        -- Milestone 1: Semesters 1-4
        (
            'BTECH-MS-001',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'ABC Institute of Technology',
            'Semester Grade Sheet',
            'MILESTONE',
            NULL,
            'Semester 1–4 Cumulative Grade Sheet & Coursework',
            'Verified prerequisite milestone: Foundation in Algorithms, Systems & Mathematics (SGPA 9.2)',
            'rahul_kumar_sem1_4_transcript.pdf',
            184500,
            'QmSem1to4GradesheetEncryptedCIDBTech2024',
            '0x1111a2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b',
            '0x117601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae1111',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '720 days',
            'ACTIVE',
            true,
            '{"sgpa": "9.2", "semesters": "1-4", "completed_credits": 84}'::jsonb
        ),
        -- Milestone 2: Capstone Defense (Chained to MS-001)
        (
            'BTECH-MS-002',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'ABC Institute of Technology',
            'Capstone & Defense Approval',
            'MILESTONE',
            'BTECH-MS-001',
            'Capstone Defense & Distributed Systems Lab Thesis Approval',
            'Verified prerequisite milestone: Capstone project passed with Grade A+',
            'rahul_kumar_capstone_defense.pdf',
            215000,
            'QmCapstoneDefenseApprovalEncryptedCID2026',
            '0x2222c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b',
            '0x227601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae2222',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '90 days',
            'ACTIVE',
            true,
            '{"grade": "A+", "project": "Decentralized Credentialing"}'::jsonb
        ),
        -- Final Degree Certificate (Chained to MS-002)
        (
            'BTECH-2026-001',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'ABC Institute of Technology',
            'Degree Certificate',
            'FINAL_CERTIFICATE',
            'BTECH-MS-002',
            'Bachelor of Technology in Computer Science',
            'Awarded First Class with Distinction (CGPA 9.4/10.0) — Backed by Verified Milestone Trail',
            'rahul_kumar_degree_cert.pdf',
            245100,
            'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
            '0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b',
            '0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '15 days',
            'ACTIVE',
            false,
            '{"cgpa": "9.4", "major": "Computer Science & Engineering", "graduation_year": 2026}'::jsonb
        ),
        -- Land Milestone 1: Cadastral Survey
        (
            'LAND-MS-001',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'Directorate of Land Records & Surveys',
            'Cadastral Survey & Demarcation',
            'MILESTONE',
            NULL,
            'Cadastral Survey & Geodetic Boundary Demarcation - Plot 402 Sector 14',
            'Official survey benchmark coordinates and clear encumbrance certificate',
            'cadastral_survey_plot402.pdf',
            142000,
            'QmCadastralSurveyPlot402DemarcationCID',
            '0x6666b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf6666',
            '0x33c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be93333',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '120 days',
            'ACTIVE',
            true,
            '{"survey_no": "SV-402-B", "coordinates": "28.5355 N, 77.3910 E"}'::jsonb
        ),
        -- Land Final Title Deed (Chained to LAND-MS-001)
        (
            'LAND-2026-088',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'Directorate of Land Records & Surveys',
            'Land Title Deed',
            'FINAL_CERTIFICATE',
            'LAND-MS-001',
            'Residential Property Deed - Plot 402 Sector 14',
            'Certified non-encumbered freehold residential land title',
            'land_deed_plot402.pdf',
            189400,
            'QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx',
            '0x7c92b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf7b2',
            '0x41c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be90234',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '40 days',
            'ACTIVE',
            false,
            '{"plot_number": "402", "area_sqft": "2400", "zone": "Residential"}'::jsonb
        ),
        -- SIH Differentiator Demo Fail Case: Forged Certificate (PRD Section 12)
        (
            'BTECH-2026-FORGED',
            holder_uuid,
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            issuer_uuid,
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            'ABC Institute of Technology',
            'Degree Certificate',
            'FINAL_CERTIFICATE',
            'NON_EXISTENT_PREREQUISITE_MILESTONE',
            'Bachelor of Technology in Computer Science (Forged Paperwork)',
            'Counterfeit degree certificate lacking verified prerequisite coursework and milestone audit trail',
            'forged_degree_sample.pdf',
            231000,
            'QmForgedUnverifiedCertificateNoPreReqsCID',
            '0x9999c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84999',
            '0x999901f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae9999',
            'Polygon Amoy',
            '0x1234567890123456789012345678901234567890',
            NOW() - INTERVAL '1 days',
            'ACTIVE',
            false,
            '{"note": "SIH 2026 Jury Demo: Document matches on-chain hash stamp but fails verification because milestone trail is missing!"}'::jsonb
        )
    ON CONFLICT (credential_id) DO NOTHING;

    -- 3. Insert Credential History
    INSERT INTO public.credential_history (
        credential_id,
        action,
        performed_by,
        performed_by_name,
        performed_by_address,
        timestamp,
        transaction_hash,
        is_blockchain_event,
        details
    )
    VALUES
        (
            'BTECH-2026-001',
            'ISSUED',
            issuer_uuid,
            'ABC Institute of Technology',
            '0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619',
            NOW() - INTERVAL '15 days',
            '0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692',
            true,
            'Credential proof permanently anchored to Polygon Amoy blockchain'
        ),
        (
            'BTECH-2026-001',
            'ACCESS_GRANTED',
            holder_uuid,
            'Rahul Kumar',
            '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
            NOW() - INTERVAL '5 days',
            NULL,
            true,
            'Holder granted verification and document access to XYZ Global Bank'
        ),
        (
            'BTECH-2026-001',
            'VERIFIED',
            verifier_uuid,
            'XYZ Global Bank HR & Verifications',
            '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
            NOW() - INTERVAL '2 days',
            NULL,
            false,
            'Document hash and progressive milestone trail verified against Polygon Amoy on-chain proof'
        );

    -- 4. Insert Access Grant
    INSERT INTO public.access_grants (
        credential_id,
        holder_id,
        verifier_id,
        verifier_name,
        verifier_email,
        granted_at,
        expires_at,
        status
    )
    VALUES
        (
            'BTECH-2026-001',
            holder_uuid,
            verifier_uuid,
            'XYZ Global Bank HR & Verifications',
            'verifications@xyz-bank.com',
            NOW() - INTERVAL '5 days',
            NOW() + INTERVAL '25 days',
            'ACTIVE'
        )
    ON CONFLICT (credential_id, verifier_id) DO NOTHING;

END $$;
