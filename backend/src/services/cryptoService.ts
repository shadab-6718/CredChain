import crypto from "crypto";

export interface EncryptedDocumentResult {
  encryptedBuffer: Buffer;
  iv: string;       // hex
  authTag: string;  // hex
  encryptionKey: string; // hex
  algorithm: string;
}

export class CryptoService {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * Encrypts a document buffer using AES-256-GCM
   */
  public static encryptDocument(
    buffer: Buffer,
    customKeyHex?: string
  ): EncryptedDocumentResult {
    const key = customKeyHex
      ? Buffer.from(customKeyHex, "hex")
      : crypto.randomBytes(this.KEY_LENGTH);

    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedBuffer: encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      encryptionKey: key.toString("hex"),
      algorithm: this.ALGORITHM,
    };
  }

  /**
   * Decrypts an AES-256-GCM encrypted document
   */
  public static decryptDocument(
    encryptedBuffer: Buffer,
    keyHex: string,
    ivHex: string,
    authTagHex: string
  ): Buffer {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }

  /**
   * Generates a secure random 256-bit symmetric encryption key
   */
  public static generateSymmetricKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString("hex");
  }
}
