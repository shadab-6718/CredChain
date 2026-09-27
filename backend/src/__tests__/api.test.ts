import request from "supertest";
import app from "../server";

describe("CredChain Backend API Integration Tests", () => {
  it("GET /health should return 200 OK and healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.platform).toBe("CredChain API");
  });

  it("POST /api/verify with unknown ID should return NOT_FOUND", async () => {
    const res = await request(app)
      .post("/api/verify")
      .send({ credentialId: "UNKNOWN-CERT-9999" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("NOT_FOUND");
    expect(res.body.isValid).toBe(false);
    expect(res.body.headline).toContain("Not found in CredChain registry");
  });

  it("POST /api/verify with valid demo credential should return VALID", async () => {
    const res = await request(app)
      .post("/api/verify")
      .send({
        credentialId: "BTECH-2026-001",
        documentHash: "0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("VALID");
    expect(res.body.isValid).toBe(true);
    expect(res.body.credential.issuerName).toBe("ABC Institute of Technology");
  });

  it("POST /api/verify with tampered hash should return DOCUMENT_INTEGRITY_FAILED", async () => {
    const res = await request(app)
      .post("/api/verify")
      .send({
        credentialId: "BTECH-2026-001",
        documentHash: "0x9999999999999999999999999999999999999999999999999999999999999999",
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("DOCUMENT_INTEGRITY_FAILED");
    expect(res.body.isValid).toBe(false);
    expect(res.body.headline).toContain("Document Integrity Failed");
  });
});
