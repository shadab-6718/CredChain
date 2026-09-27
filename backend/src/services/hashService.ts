import crypto from "crypto";

export class HashService {
  /**
   * Calculates a standard SHA-256 hash of a file buffer or string
   * @param buffer File buffer or string content
   * @returns "0x" prefixed 64-character hex string (32 bytes)
   */
  public static calculateSHA256(buffer: Buffer | string): string {
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    return `0x${hash}`;
  }

  /**
   * Verifies if a given buffer matches an expected hash
   */
  public static verifyHash(buffer: Buffer | string, expectedHash: string): boolean {
    const computed = this.calculateSHA256(buffer);
    const normalizedExpected = expectedHash.startsWith("0x")
      ? expectedHash.toLowerCase()
      : `0x${expectedHash.toLowerCase()}`;
    return computed.toLowerCase() === normalizedExpected;
  }
}
