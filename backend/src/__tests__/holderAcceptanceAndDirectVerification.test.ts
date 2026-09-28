import request from "supertest";
import app from "../server";

describe("Workflow: Issuer -> Holder Acceptance -> Direct Verifier Verification", () => {
  const testCredId = "TEST-CRED-WORKFLOW-001";
  const rejectCredId = "TEST-CRED-REJECT-002";

  describe("1. Issuer issues credential to holder's account", () => {
    it("should allow authorized issuer to issue a credential in PENDING status for the holder", async () => {
      const res = await request(app)
        .post("/api/credentials")
        .set("x-demo-role", "issuer")
        .set("x-demo-user-id", "11111111-1111-1111-1111-111111111111")
        .send({
          credentialId: testCredId,
          holderId: "22222222-2222-2222-2222-222222222222",
          holderName: "Rahul Kumar",
          holderEmail: "rahul.kumar.demo@gmail.com",
          credentialType: "Bachelor of Technology",
          title: "Bachelor of Technology — Rahul Kumar",
          documentName: "rahul_degree_official.pdf",
          documentSizeBytes: 245100,
          pinataCid: "QmDirectVerifyDocument1234567890abcdef",
          documentHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.credential).toBeDefined();
      expect(res.body.credential.credential_id).toBe(testCredId);
      expect(res.body.credential.status).toBe("PENDING");
      expect(res.body.credential.holder_name).toBe("Rahul Kumar");
      expect(res.body.blockchainTx).toBeDefined();
    });

    it("should ensure the issued credential is in holder's account in PENDING status", async () => {
      const res = await request(app)
        .get("/api/credentials")
        .set("x-demo-role", "holder")
        .set("x-demo-user-id", "22222222-2222-2222-2222-222222222222");

      expect(res.status).toBe(200);
      expect(res.body.credentials).toBeDefined();
      const targetCred = res.body.credentials.find(
        (c: any) => c.credential_id === testCredId
      );
      expect(targetCred).toBeDefined();
      expect(targetCred.status).toBe("PENDING");
      expect(targetCred.holder_name).toBe("Rahul Kumar");
    });
  });

  describe("2. Verification while pending acceptance", () => {
    it("should report PENDING_ACCEPTANCE if verified prior to holder acceptance", async () => {
      const res = await request(app)
        .post("/api/verify")
        .send({ credentialId: testCredId });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("PENDING_ACCEPTANCE");
      expect(res.body.headline).toContain("Pending Holder Acceptance");
    });
  });

  describe("3. Holder accepts the credential", () => {
    it("should allow holder to accept the credential and activate it in their wallet", async () => {
      const res = await request(app)
        .post(`/api/credentials/${testCredId}/accept`)
        .set("x-demo-role", "holder")
        .set("x-demo-user-id", "22222222-2222-2222-2222-222222222222")
        .send({ action: "ACCEPT" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("accepted successfully");
      expect(res.body.credential.status).toBe("ACTIVE");
    });

    it("should confirm the credential is now ACTIVE in holder's wallet", async () => {
      const res = await request(app)
        .get("/api/credentials")
        .set("x-demo-role", "holder")
        .set("x-demo-user-id", "22222222-2222-2222-2222-222222222222");

      expect(res.status).toBe(200);
      const targetCred = res.body.credentials.find(
        (c: any) => c.credential_id === testCredId
      );
      expect(targetCred).toBeDefined();
      expect(targetCred.status).toBe("ACTIVE");
    });
  });

  describe("4. Verifier directly verifies the credential (no permission required)", () => {
    it("should directly verify the accepted credential with full validity and document access without needing holder permission", async () => {
      // Verifier requests verification directly without any prior access grant from holder
      const res = await request(app)
        .post("/api/verify")
        .set("x-demo-role", "verifier")
        .set("x-demo-user-id", "33333333-3333-3333-3333-333333333333")
        .send({ credentialId: testCredId });

      expect(res.status).toBe(200);
      expect(res.body.isValid).toBe(true);
      expect(res.body.status).toBe("VALID");
      expect(res.body.permissionRequired).toBe(false);
      expect(res.body.headline).toContain("Verified Directly");

      // Verifier has direct access to inspect the document proof without holder permission
      expect(res.body.credential).toBeDefined();
      expect(res.body.credential.hasDocumentAccess).toBe(true);
      expect(res.body.credential.pinataCid).toBe("QmDirectVerifyDocument1234567890abcdef");
      expect(res.body.credential.documentUrl).toContain("QmDirectVerifyDocument1234567890abcdef");
      expect(res.body.credential.holder_name).toBe("Rahul Kumar");
    });

    it("should also allow public unauthenticated verification directly without permission", async () => {
      const res = await request(app)
        .post("/api/verify")
        .send({ credentialId: testCredId });

      expect(res.status).toBe(200);
      expect(res.body.isValid).toBe(true);
      expect(res.body.status).toBe("VALID");
      expect(res.body.credential.hasDocumentAccess).toBe(true);
      expect(res.body.credential.pinataCid).toBe("QmDirectVerifyDocument1234567890abcdef");
    });
  });

  describe("5. Rejection flow safeguard", () => {
    it("should support holder rejecting a credential offer", async () => {
      // Issue second credential
      await request(app)
        .post("/api/credentials")
        .set("x-demo-role", "issuer")
        .set("x-demo-user-id", "11111111-1111-1111-1111-111111111111")
        .send({
          credentialId: rejectCredId,
          holderId: "22222222-2222-2222-2222-222222222222",
          holderName: "Rahul Kumar",
          credentialType: "Unwanted Certificate",
          documentName: "unwanted.pdf",
          pinataCid: "QmRejectedPinataCID",
          documentHash: "0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef",
        });

      // Holder rejects it
      const res = await request(app)
        .post(`/api/credentials/${rejectCredId}/reject`)
        .set("x-demo-role", "holder")
        .set("x-demo-user-id", "22222222-2222-2222-2222-222222222222")
        .send({ action: "REJECT" });

      expect(res.status).toBe(200);
      expect(res.body.credential.status).toBe("REJECTED");

      // Verifier checks rejected credential
      const verifyRes = await request(app)
        .post("/api/verify")
        .send({ credentialId: rejectCredId });

      expect(verifyRes.body.status).toBe("REJECTED");
      expect(verifyRes.body.isValid).toBe(false);
    });
  });
});
