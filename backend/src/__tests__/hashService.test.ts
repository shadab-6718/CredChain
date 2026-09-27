import { HashService } from "../services/hashService";

describe("HashService Unit Tests", () => {
  const originalDoc = "Certificate of Completion for Rahul Kumar - CredChain 2026";
  const modifiedDoc = "Certificate of Completion for Rahul Kumar - CredChain 2026 - MODIFIED";

  it("should calculate a consistent 0x-prefixed 32-byte (66 char) SHA-256 hash", () => {
    const hash = HashService.calculateSHA256(Buffer.from(originalDoc));
    expect(hash).toMatch(/^0x[a-f0-9]{64}$/);

    const hash2 = HashService.calculateSHA256(Buffer.from(originalDoc));
    expect(hash).toEqual(hash2);
  });

  it("should produce a different hash when even 1 character changes (tamper-evident)", () => {
    const hashOriginal = HashService.calculateSHA256(Buffer.from(originalDoc));
    const hashModified = HashService.calculateSHA256(Buffer.from(modifiedDoc));

    expect(hashOriginal).not.toEqual(hashModified);
  });

  it("should verify matching hashes correctly", () => {
    const hash = HashService.calculateSHA256(Buffer.from(originalDoc));
    expect(HashService.verifyHash(Buffer.from(originalDoc), hash)).toBe(true);
    expect(HashService.verifyHash(Buffer.from(modifiedDoc), hash)).toBe(false);
  });
});
