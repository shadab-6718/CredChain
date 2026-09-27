import request from "supertest";
import app from "../server";
import { CryptoService } from "../services/cryptoService";
import { SupabaseService } from "../services/supabaseService";
import { BlockchainService } from "../services/blockchainService";

describe("PRD PS26194 Core Differentiators & Progressive Milestones", () => {
  describe("AES-256-GCM Document Encryption (PRD Section 3B & 9)", () => {
    it("should encrypt and decrypt document buffers losslessly", () => {
      const originalText = "Encrypted Land Title and Academic Record Payload 2026";
      const originalBuffer = Buffer.from(originalText, "utf-8");

      // Encrypt
      const encrypted = CryptoService.encryptDocument(originalBuffer);
      expect(encrypted.encryptedBuffer).toBeDefined();
      expect(encrypted.encryptedBuffer.toString("utf-8")).not.toEqual(originalText);
      expect(encrypted.iv).toHaveLength(32); // 16 bytes in hex
      expect(encrypted.authTag).toHaveLength(32); // 16 bytes in hex

      // Decrypt
      const decrypted = CryptoService.decryptDocument(
        encrypted.encryptedBuffer,
        encrypted.encryptionKey,
        encrypted.iv,
        encrypted.authTag
      );

      expect(decrypted.toString("utf-8")).toEqual(originalText);
    });
  });

  describe("Progressive Milestone Trail Verification (PRD Section 3A & 12)", () => {
    it("should verify valid progressive degree and return its 3-tier milestone trail", async () => {
      const res = await request(app)
        .post("/api/verify")
        .send({ credentialId: "BTECH-2026-001" });

      expect(res.status).toBe(200);
      expect(res.body.isValid).toBe(true);
      expect(res.body.status).toBe("VALID");
      expect(res.body.milestoneTrail).toBeDefined();
      expect(res.body.milestoneTrail.length).toBe(3);
      expect(res.body.isMilestoneTrailValid).toBe(true);

      // Verify sequence: MS1 (Sem 1-4) -> MS2 (Capstone) -> Final Degree
      expect(res.body.milestoneTrail[0].credential_id).toBe("BTECH-MS-001");
      expect(res.body.milestoneTrail[1].credential_id).toBe("BTECH-MS-002");
      expect(res.body.milestoneTrail[2].credential_id).toBe("BTECH-2026-001");
    });

    it("should detect forged credential with broken milestone trail (PRD Winning Demo Moment)", async () => {
      const res = await request(app)
        .post("/api/verify")
        .send({ credentialId: "BTECH-2026-FORGED" });

      expect(res.status).toBe(200);
      expect(res.body.isValid).toBe(false);
      expect(res.body.status).toBe("FORGED_MILESTONE_TRAIL");
      expect(res.body.headline).toContain("Forged Credential");
      expect(res.body.isMilestoneTrailValid).toBe(false);
      expect(res.body.message).toContain("prerequisite coursework");
    });

    it("should return milestone trail via dedicated trail endpoint", async () => {
      const res = await request(app)
        .get("/api/credentials/BTECH-2026-001/trail");

      expect(res.status).toBe(200);
      expect(res.body.trail).toBeDefined();
      expect(res.body.trail.length).toBe(3);
      expect(res.body.isTrailValid).toBe(true);
    });
  });

  describe("Consent-Gated Access Request Handshake (PRD Section 5 & 8)", () => {
    it("should allow a verifier to request access to a credential", async () => {
      const res = await request(app)
        .post("/api/credentials/BTECH-2026-001/request-access")
        .send({
          verifierName: "Citigroup Background Check Corp",
          verifierEmail: "checks@citigroup.com",
          purpose: "Pre-hire verification",
          durationHours: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.request.status).toBe("PENDING");
      expect(res.body.request.duration_hours).toBe(24);
    });

    it("should list inbound access requests for holder review", async () => {
      const res = await request(app)
        .get("/api/access/requests")
        .set("x-demo-role", "holder")
        .set("x-demo-user-id", "22222222-2222-2222-2222-222222222222");

      expect(res.status).toBe(200);
      expect(res.body.requests).toBeDefined();
      expect(res.body.requests.length).toBeGreaterThan(0);
    });
  });
});
