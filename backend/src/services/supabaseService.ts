import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "../config/env";

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static adminClient: SupabaseClient | null = null;

  // In-memory store fallback for zero-config offline SIH demo
  private static memoryStore = {
    profiles: new Map<string, any>([
      [
        "11111111-1111-1111-1111-111111111111",
        {
          id: "11111111-1111-1111-1111-111111111111",
          full_name: "ABC Institute of Technology",
          email: "registrar@abc-university.edu",
          role: "issuer",
          wallet_address: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          organization: "ABC University",
        },
      ],
      [
        "22222222-2222-2222-2222-222222222222",
        {
          id: "22222222-2222-2222-2222-222222222222",
          full_name: "Rahul Kumar",
          email: "rahul.kumar.demo@gmail.com",
          role: "holder",
          wallet_address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          organization: "Student / Alumnus",
        },
      ],
      [
        "33333333-3333-3333-3333-333333333333",
        {
          id: "33333333-3333-3333-3333-333333333333",
          full_name: "XYZ Global Bank HR & Verifications",
          email: "verifications@xyz-bank.com",
          role: "verifier",
          wallet_address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
          organization: "XYZ Bank",
        },
      ],
    ]),
    credentials: new Map<string, any>([
      // 1. Student Rahul Kumar: Milestone 1 (Semesters 1-4)
      [
        "BTECH-MS-001",
        {
          id: "c-ms-001",
          credential_id: "BTECH-MS-001",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "ABC Institute of Technology",
          credential_type: "Semester Grade Sheet",
          event_type: "MILESTONE",
          linked_previous_event_id: null,
          title: "Semester 1–4 Cumulative Grade Sheet & Coursework",
          description: "Verified prerequisite milestone: Foundation in Algorithms, Systems & Mathematics (SGPA 9.2)",
          document_name: "rahul_kumar_sem1_4_transcript.pdf",
          document_size_bytes: 184500,
          pinata_cid: "QmSem1to4GradesheetEncryptedCIDBTech2024",
          document_hash: "0x1111a2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
          blockchain_tx_hash: "0x117601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae1111",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 720 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: true,
          metadata: { sgpa: "9.2", semesters: "1-4", completed_credits: 84 },
        },
      ],
      // 2. Student Rahul Kumar: Milestone 2 (Capstone Defense & Lab Research)
      [
        "BTECH-MS-002",
        {
          id: "c-ms-002",
          credential_id: "BTECH-MS-002",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "ABC Institute of Technology",
          credential_type: "Capstone & Defense Approval",
          event_type: "MILESTONE",
          linked_previous_event_id: "BTECH-MS-001",
          title: "Capstone Defense & Distributed Systems Lab Thesis Approval",
          description: "Verified prerequisite milestone: Capstone project 'Decentralized Identity Verification' passed with Grade A+",
          document_name: "rahul_kumar_capstone_defense.pdf",
          document_size_bytes: 215000,
          pinata_cid: "QmCapstoneDefenseApprovalEncryptedCID2026",
          document_hash: "0x2222c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
          blockchain_tx_hash: "0x227601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae2222",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 90 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: true,
          metadata: { grade: "A+", project: "Decentralized Credentialing", defense_date: "2026-05-15" },
        },
      ],
      // 3. Student Rahul Kumar: Final Degree Certificate (Linked to MS-002)
      [
        "BTECH-2026-001",
        {
          id: "c1111111-1111-1111-1111-111111111111",
          credential_id: "BTECH-2026-001",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "ABC Institute of Technology",
          credential_type: "Degree Certificate",
          event_type: "FINAL_CERTIFICATE",
          linked_previous_event_id: "BTECH-MS-002",
          title: "Bachelor of Technology in Computer Science",
          description: "Awarded First Class with Distinction (CGPA 9.4/10.0) — Backed by Verified Milestone Trail",
          document_name: "rahul_kumar_degree_cert.pdf",
          document_size_bytes: 245100,
          pinata_cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          document_hash: "0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
          blockchain_tx_hash: "0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: false,
          metadata: { cgpa: "9.4", major: "Computer Science & Engineering", graduation_year: 2026 },
        },
      ],
      // 4. Land Milestone 1: Cadastral Survey & Demarcation
      [
        "LAND-MS-001",
        {
          id: "c-land-ms1",
          credential_id: "LAND-MS-001",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "Directorate of Land Records & Surveys",
          credential_type: "Cadastral Survey & Demarcation",
          event_type: "MILESTONE",
          linked_previous_event_id: null,
          title: "Cadastral Survey & Geodetic Boundary Demarcation - Plot 402 Sector 14",
          description: "Official survey benchmark coordinates and clear encumbrance certificate",
          document_name: "cadastral_survey_plot402.pdf",
          document_size_bytes: 142000,
          pinata_cid: "QmCadastralSurveyPlot402DemarcationCID",
          document_hash: "0x6666b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf6666",
          blockchain_tx_hash: "0x33c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be93333",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 120 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: true,
          metadata: { survey_no: "SV-402-B", coordinates: "28.5355 N, 77.3910 E" },
        },
      ],
      // 5. Land Final Title Deed (Linked to LAND-MS-001)
      [
        "LAND-2026-088",
        {
          id: "c2222222-2222-2222-2222-222222222222",
          credential_id: "LAND-2026-088",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "Directorate of Land Records & Surveys",
          credential_type: "Land Title Deed",
          event_type: "FINAL_CERTIFICATE",
          linked_previous_event_id: "LAND-MS-001",
          title: "Residential Property Deed - Plot 402 Sector 14",
          description: "Certified non-encumbered freehold residential land title",
          document_name: "land_deed_plot402.pdf",
          document_size_bytes: 189400,
          pinata_cid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
          document_hash: "0x7c92b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf7b2",
          blockchain_tx_hash: "0x41c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be90234",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 40 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: false,
          metadata: { plot_number: "402", area_sqft: "2400", zone: "Residential" },
        },
      ],
      // 6. SIH Differentiator Demo Fail Case: Forged Certificate (PRD Section 12)
      [
        "BTECH-2026-FORGED",
        {
          id: "c-forged-999",
          credential_id: "BTECH-2026-FORGED",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "ABC Institute of Technology",
          credential_type: "Degree Certificate",
          event_type: "FINAL_CERTIFICATE",
          linked_previous_event_id: "NON_EXISTENT_PREREQUISITE_MILESTONE",
          title: "Bachelor of Technology in Computer Science (Forged Paperwork)",
          description: "Counterfeit degree certificate lacking verified prerequisite coursework and milestone audit trail",
          document_name: "forged_degree_sample.pdf",
          document_size_bytes: 231000,
          pinata_cid: "QmForgedUnverifiedCertificateNoPreReqsCID",
          document_hash: "0x9999c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84999",
          blockchain_tx_hash: "0x999901f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae9999",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          status: "ACTIVE",
          is_encrypted: false,
          metadata: { note: "SIH 2026 Jury Demo: Document matches on-chain hash stamp but fails verification because milestone trail is missing!" },
        },
      ],
      // 7. Student Rahul Kumar: Pending Offer for Acceptance Demo
      [
        "CERT-2026-PENDING",
        {
          id: "c-pending-777",
          credential_id: "CERT-2026-PENDING",
          holder_id: "22222222-2222-2222-2222-222222222222",
          holder_wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
          holder_name: "Rahul Kumar",
          recipient_name: "Rahul Kumar",
          issuer_id: "11111111-1111-1111-1111-111111111111",
          issuer_wallet: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
          issuer_name: "National Technology Certification Board",
          credential_type: "Specialization Certificate",
          event_type: "FINAL_CERTIFICATE",
          linked_previous_event_id: "BTECH-2026-001",
          title: "Advanced Distributed Systems & Smart Contracts Specialization",
          description: "Issued by National Technology Certification Board — Awaiting formal acceptance by holder into DID wallet.",
          document_name: "distributed_systems_specialization.pdf",
          document_size_bytes: 198000,
          pinata_cid: "QmDistributedSystemsArchitectCredentialCID2026",
          document_hash: "0x7777c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84777",
          blockchain_tx_hash: "0x777701f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae7777",
          blockchain_network: "Polygon Amoy",
          contract_address: "0x1234567890123456789012345678901234567890",
          issued_at: new Date(Date.now() - 3600000).toISOString(),
          status: "PENDING",
          is_encrypted: false,
          metadata: { holderName: "Rahul Kumar", grade: "Distinction", track: "Distributed Ledger Architecture" },
        },
      ],
    ]),
    history: new Map<string, any[]>([
      [
        "BTECH-2026-001",
        [
          {
            id: "h-ms1",
            credential_id: "BTECH-2026-001",
            action: "MILESTONE_CHAINED",
            performed_by_name: "ABC Institute of Technology",
            performed_by_address: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
            timestamp: new Date(Date.now() - 720 * 86400000).toISOString(),
            transaction_hash: "0x117601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae1111",
            is_blockchain_event: true,
            details: "Milestone 1 anchored: Semester 1–4 Cumulative Grade Sheet recorded on Polygon Amoy",
          },
          {
            id: "h-ms2",
            credential_id: "BTECH-2026-001",
            action: "MILESTONE_CHAINED",
            performed_by_name: "ABC Institute of Technology",
            performed_by_address: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
            timestamp: new Date(Date.now() - 90 * 86400000).toISOString(),
            transaction_hash: "0x227601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae2222",
            is_blockchain_event: true,
            details: "Milestone 2 anchored: Capstone Defense & Research Thesis Approval permanently chained",
          },
          {
            id: "h1",
            credential_id: "BTECH-2026-001",
            action: "ISSUED",
            performed_by_name: "ABC Institute of Technology",
            performed_by_address: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
            timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
            transaction_hash: "0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692",
            is_blockchain_event: true,
            details: "Final Degree Certificate issued and permanently chained to prerequisite milestone trail",
          },
          {
            id: "h2",
            credential_id: "BTECH-2026-001",
            action: "ACCESS_GRANTED",
            performed_by_name: "Rahul Kumar",
            performed_by_address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
            timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
            transaction_hash: null,
            is_blockchain_event: true,
            details: "Holder granted time-boxed verification & document access to XYZ Global Bank",
          },
        ],
      ],
    ]),
    accessGrants: new Map<string, any[]>([
      [
        "BTECH-2026-001",
        [
          {
            id: "g1",
            credential_id: "BTECH-2026-001",
            holder_id: "22222222-2222-2222-2222-222222222222",
            verifier_id: "33333333-3333-3333-3333-333333333333",
            verifier_name: "XYZ Global Bank HR & Verifications",
            verifier_email: "verifications@xyz-bank.com",
            granted_at: new Date(Date.now() - 5 * 86400000).toISOString(),
            expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
            status: "ACTIVE",
          },
        ],
      ],
    ]),
    accessRequests: new Map<string, any>([
      [
        "req-001",
        {
          id: "req-001",
          credential_id: "BTECH-2026-001",
          holder_id: "22222222-2222-2222-2222-222222222222",
          verifier_id: "33333333-3333-3333-3333-333333333333",
          verifier_name: "XYZ Global Bank HR & Verifications",
          verifier_email: "verifications@xyz-bank.com",
          requested_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          duration_hours: 48,
          purpose: "Pre-Employment Background Verification for Rahul Kumar",
          status: "PENDING",
        },
      ],
    ]),
  };

  public static isConfigured(): boolean {
    const url = ENV.SUPABASE_URL || "";
    const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY || "";
    if (
      !url ||
      url.includes("your-project") ||
      url.includes("placeholder") ||
      !key ||
      key.includes("your-supabase") ||
      key.includes("placeholder")
    ) {
      return false;
    }
    return true;
  }

  public static getClient(): SupabaseClient | null {
    if (!this.isConfigured()) return null;
    if (!this.client && ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
      this.client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
    }
    return this.client;
  }

  public static getAdminClient(): SupabaseClient | null {
    if (!this.isConfigured()) return null;
    if (!this.adminClient && ENV.SUPABASE_URL && (ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY)) {
      this.adminClient = createClient(
        ENV.SUPABASE_URL,
        ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY
      );
    }
    return this.adminClient;
  }

  public static async getProfile(userId: string) {
    const client = this.getAdminClient();
    if (client) {
      const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
      if (!error && data) return data;
    }
    return this.memoryStore.profiles.get(userId) || null;
  }

  public static async updateProfileRole(
    userId: string,
    role: "issuer" | "holder" | "verifier",
    organization?: string,
    fullName?: string
  ) {
    const client = this.getAdminClient();
    let updatedProfile = null;

    if (client) {
      try {
        const updateData: any = { role, updated_at: new Date().toISOString() };
        if (organization) updateData.organization = organization;
        if (fullName) updateData.full_name = fullName;

        const { data, error } = await client
          .from("profiles")
          .update(updateData)
          .eq("id", userId)
          .select()
          .single();

        if (!error && data) {
          updatedProfile = data;
        }

        // Also update auth user metadata if possible
        try {
          await client.auth.admin.updateUserById(userId, {
            user_metadata: {
              role,
              ...(organization ? { organization } : {}),
              ...(fullName ? { full_name: fullName } : {}),
            },
          });
        } catch {}
      } catch (err: any) {
        console.warn("Supabase updateProfileRole notice:", err?.message || err);
      }
    }

    // Always update in-memory cache
    const existing = this.memoryStore.profiles.get(userId) || {};
    const merged = {
      ...existing,
      id: userId,
      role,
      ...(organization ? { organization } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(updatedProfile || {}),
    };
    this.memoryStore.profiles.set(userId, merged);
    return updatedProfile || merged;
  }

  public static async getAllVerifiers() {
    const client = this.getAdminClient();
    if (client) {
      const { data, error } = await client.from("profiles").select("id, full_name, email, role, organization").eq("role", "verifier");
      if (!error && data) return data;
    }
    return Array.from(this.memoryStore.profiles.values()).filter((p) => p.role === "verifier");
  }

  public static async getCredentialById(credentialId: string) {
    const client = this.getAdminClient();
    if (client) {
      const { data, error } = await client.from("credentials").select("*").eq("credential_id", credentialId).single();
      if (!error && data) return data;
    }
    return this.memoryStore.credentials.get(credentialId) || null;
  }

  public static async listCredentials(query?: { holderId?: string; issuerId?: string; status?: string }) {
    const client = this.getAdminClient();
    if (client) {
      let dbQuery = client.from("credentials").select("*").order("issued_at", { ascending: false });
      if (query?.holderId) dbQuery = dbQuery.eq("holder_id", query.holderId);
      if (query?.issuerId) dbQuery = dbQuery.eq("issuer_id", query.issuerId);
      if (query?.status) dbQuery = dbQuery.eq("status", query.status);

      const { data, error } = await dbQuery;
      if (!error && data) return data;
    }

    let results = Array.from(this.memoryStore.credentials.values());
    if (query?.holderId) {
      results = results.filter(
        (c) =>
          c.holder_id === query.holderId ||
          c.holder_id === "22222222-2222-2222-2222-222222222222" ||
          !c.holder_id
      );
    }
    if (query?.issuerId) {
      results = results.filter(
        (c) =>
          c.issuer_id === query.issuerId ||
          c.issuer_id === "11111111-1111-1111-1111-111111111111" ||
          !c.issuer_id
      );
    }
    if (query?.status) results = results.filter((c) => c.status === query.status);
    return results;
  }

  public static async insertCredential(record: any) {
    const client = this.getAdminClient();
    let saved = record;
    if (client) {
      const { data, error } = await client.from("credentials").insert(record).select().single();
      if (!error && data) {
        saved = data;
      } else if (error) {
        console.warn("Supabase credentials table insert note:", error.message);
      }
    }
    this.memoryStore.credentials.set(record.credential_id, saved);
    return saved;
  }

  public static async updateCredentialStatus(
    credentialId: string,
    status: "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED",
    reason?: string
  ) {
    const client = this.getAdminClient();
    if (client) {
      await client
        .from("credentials")
        .update({
          status,
          revocation_reason: reason,
          revoked_at: status === "REVOKED" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("credential_id", credentialId);
    }
    const cred = this.memoryStore.credentials.get(credentialId);
    if (cred) {
      cred.status = status;
      cred.revocation_reason = reason;
      cred.revoked_at = status === "REVOKED" ? new Date().toISOString() : null;
      cred.updated_at = new Date().toISOString();
    }
  }

  /**
   * Holder acceptance or rejection of an issued credential
   */
  public static async respondToCredential(
    credentialId: string,
    action: "ACCEPT" | "REJECT",
    user: any
  ) {
    const cred = await this.getCredentialById(credentialId);
    if (!cred) {
      throw new Error(`Credential ${credentialId} not found.`);
    }

    const newStatus: "ACTIVE" | "REJECTED" = action === "ACCEPT" ? "ACTIVE" : "REJECTED";
    const client = this.getAdminClient();
    if (client) {
      await client
        .from("credentials")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("credential_id", credentialId);
    }

    const memCred = this.memoryStore.credentials.get(credentialId);
    if (memCred) {
      memCred.status = newStatus;
      memCred.updated_at = new Date().toISOString();
    }

    // Add lifecycle history event
    await this.addHistoryEvent({
      credential_id: credentialId,
      action: action === "ACCEPT" ? "ACCEPTED" : "REJECTED",
      performed_by: user?.id || null,
      performed_by_name: user?.full_name || cred.holder_name || "Credential Holder",
      performed_by_address: user?.wallet_address || cred.holder_wallet,
      timestamp: new Date().toISOString(),
      is_blockchain_event: true,
      details: action === "ACCEPT"
        ? `Holder formally accepted credential proof into digital vault.`
        : `Holder declined and rejected credential offer.`,
    });

    return memCred || cred;
  }

  /**
   * Recursively retrieves the ordered milestone trail for a credential
   */
  public static async getMilestoneTrail(credentialId: string): Promise<any[]> {
    const trail: any[] = [];
    let currentId: string | null = credentialId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cred = await this.getCredentialById(currentId);
      if (!cred) {
        // Missing parent milestone in trail (e.g. for forged fail-case)
        trail.push({
          credential_id: currentId,
          title: "Missing Prerequisite Milestone",
          status: "NOT_FOUND",
          is_valid: false,
          error: "Prerequisite milestone record not found in decentralized ledger",
        });
        break;
      }

      trail.unshift({
        credential_id: cred.credential_id,
        title: cred.title,
        credential_type: cred.credential_type,
        event_type: cred.event_type || "MILESTONE",
        issuer_name: cred.issuer_name,
        issuer_wallet: cred.issuer_wallet,
        issued_at: cred.issued_at,
        status: cred.status,
        document_hash: cred.document_hash,
        pinata_cid: cred.pinata_cid,
        is_encrypted: cred.is_encrypted || false,
        is_valid: cred.status === "ACTIVE",
      });

      currentId = cred.linked_previous_event_id || null;
    }

    return trail;
  }

  public static async addHistoryEvent(event: any) {
    const client = this.getAdminClient();
    if (client) {
      await client.from("credential_history").insert(event);
    }
    const list = this.memoryStore.history.get(event.credential_id) || [];
    list.push({ ...event, id: `h_${Date.now()}` });
    this.memoryStore.history.set(event.credential_id, list);
  }

  public static async getHistory(credentialId: string) {
    const client = this.getAdminClient();
    if (client) {
      const { data, error } = await client
        .from("credential_history")
        .select("*")
        .eq("credential_id", credentialId)
        .order("timestamp", { ascending: true });
      if (!error && data) return data;
    }
    return this.memoryStore.history.get(credentialId) || [];
  }

  public static async getAccessGrants(credentialId: string) {
    const client = this.getAdminClient();
    if (client) {
      const { data, error } = await client
        .from("access_grants")
        .select("*")
        .eq("credential_id", credentialId);
      if (!error && data) return data;
    }
    return this.memoryStore.accessGrants.get(credentialId) || [];
  }

  public static async grantAccess(grant: any) {
    const client = this.getAdminClient();
    if (client) {
      await client.from("access_grants").upsert(grant, { onConflict: "credential_id, verifier_id" });
    }
    const list = this.memoryStore.accessGrants.get(grant.credential_id) || [];
    const filtered = list.filter((g) => g.verifier_id !== grant.verifier_id);
    filtered.push({ ...grant, id: `g_${Date.now()}` });
    this.memoryStore.accessGrants.set(grant.credential_id, filtered);
  }

  public static async revokeAccess(credentialId: string, verifierId: string) {
    const client = this.getAdminClient();
    if (client) {
      await client
        .from("access_grants")
        .update({ status: "REVOKED", revoked_at: new Date().toISOString() })
        .eq("credential_id", credentialId)
        .eq("verifier_id", verifierId);
    }
    const list = this.memoryStore.accessGrants.get(credentialId) || [];
    const item = list.find((g) => g.verifier_id === verifierId);
    if (item) {
      item.status = "REVOKED";
      item.revoked_at = new Date().toISOString();
    }
  }

  public static async checkAccess(credentialId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === "issuer" || userRole === "holder") {
      const cred = await this.getCredentialById(credentialId);
      if (!cred) return false;
      return cred.issuer_id === userId || cred.holder_id === userId;
    }

    const grants = await this.getAccessGrants(credentialId);
    const now = new Date();
    return grants.some((g) => {
      if (g.verifier_id !== userId || g.status !== "ACTIVE") return false;
      if (g.expires_at && new Date(g.expires_at) < now) return false; // Time-box expired
      return true;
    });
  }

  // Access Request Workflows (PRD Section 5 & 8)
  public static async createAccessRequest(req: {
    credentialId: string;
    holderId: string;
    verifierId: string;
    verifierName: string;
    verifierEmail: string;
    purpose?: string;
    durationHours?: number;
  }) {
    const id = `req_${Date.now()}`;
    const newRequest = {
      id,
      credential_id: req.credentialId,
      holder_id: req.holderId,
      verifier_id: req.verifierId,
      verifier_name: req.verifierName,
      verifier_email: req.verifierEmail,
      purpose: req.purpose || "Verification of Credentials",
      duration_hours: req.durationHours || 24,
      requested_at: new Date().toISOString(),
      status: "PENDING",
    };

    const client = this.getAdminClient();
    if (client) {
      await client.from("access_requests").insert(newRequest);
    }
    this.memoryStore.accessRequests.set(id, newRequest);
    return newRequest;
  }

  public static async listAccessRequests(query?: { holderId?: string; verifierId?: string; credentialId?: string }) {
    const client = this.getAdminClient();
    if (client) {
      let q = client.from("access_requests").select("*").order("requested_at", { ascending: false });
      if (query?.holderId) q = q.eq("holder_id", query.holderId);
      if (query?.verifierId) q = q.eq("verifier_id", query.verifierId);
      if (query?.credentialId) q = q.eq("credential_id", query.credentialId);
      const { data, error } = await q;
      if (!error && data) return data;
    }

    let list = Array.from(this.memoryStore.accessRequests.values());
    if (query?.holderId) list = list.filter((r) => r.holder_id === query.holderId);
    if (query?.verifierId) list = list.filter((r) => r.verifier_id === query.verifierId);
    if (query?.credentialId) list = list.filter((r) => r.credential_id === query.credentialId);
    return list;
  }

  public static async updateAccessRequest(requestId: string, status: "APPROVED" | "REJECTED" | "EXPIRED") {
    const client = this.getAdminClient();
    if (client) {
      await client.from("access_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", requestId);
    }
    const req = this.memoryStore.accessRequests.get(requestId);
    if (req) {
      req.status = status;
      req.updated_at = new Date().toISOString();
    }
    return req;
  }

  public static async saveGoogleUser({
    email,
    fullName,
    role,
    organization,
    walletAddress,
  }: {
    email: string;
    fullName: string;
    role: "issuer" | "holder" | "verifier";
    organization?: string;
    walletAddress?: string;
  }) {
    const adminClient = this.getAdminClient();
    let userId = "";

    if (adminClient) {
      try {
        const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers();
        if (!listErr && usersData?.users) {
          const existing = usersData.users.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (existing) {
            userId = existing.id;
          }
        }

        if (!userId) {
          const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              role,
              organization: organization || "",
            },
          });
          if (!createErr && newUser?.user) {
            userId = newUser.user.id;
          }
        }

        if (userId) {
          const profileRecord = {
            id: userId,
            full_name: fullName,
            email,
            role,
            organization: organization || "",
            wallet_address: walletAddress || null,
            updated_at: new Date().toISOString(),
          };

          const { data: savedProfile, error: profileErr } = await adminClient
            .from("profiles")
            .upsert(profileRecord, { onConflict: "id" })
            .select()
            .single();

          if (!profileErr && savedProfile) {
            this.memoryStore.profiles.set(userId, savedProfile);
            return savedProfile;
          } else if (profileErr) {
            console.warn("Profile upsert notice:", profileErr.message);
          }
        }
      } catch (err: any) {
        console.warn("Supabase saveGoogleUser error:", err?.message || err);
      }
    }

    const fallbackId = userId || `google_${role}_${Date.now()}`;
    const fallbackProfile = {
      id: fallbackId,
      full_name: fullName,
      email,
      role,
      organization: organization || "",
      wallet_address: walletAddress || null,
    };
    this.memoryStore.profiles.set(fallbackId, fallbackProfile);
    return fallbackProfile;
  }
}
