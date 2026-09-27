import { Request, Response } from "express";
import { HashService } from "../services/hashService";
import { PinataService } from "../services/pinataService";
import { CryptoService } from "../services/cryptoService";

export class FileController {
  public static async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded", message: "Please select a certificate or document file." });
        return;
      }

      const { buffer, originalname, size, mimetype } = req.file;
      const shouldEncrypt = req.query.encrypt === "true" || req.body.encrypt === "true";

      // 1. Calculate SHA-256 hash of original document for on-chain integrity
      const documentHash = HashService.calculateSHA256(buffer);

      let bufferToUpload = buffer;
      let encryptionMetadata: Record<string, any> = {};

      // 2. Client-side / Pre-upload encryption (PRD Section 3B & 9)
      if (shouldEncrypt) {
        const encrypted = CryptoService.encryptDocument(buffer);
        bufferToUpload = encrypted.encryptedBuffer;
        encryptionMetadata = {
          isEncrypted: true,
          encryptionAlgorithm: encrypted.algorithm,
          encryptionKey: encrypted.encryptionKey,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        };
      }

      // 3. Upload to Pinata IPFS
      const pinataResult = await PinataService.uploadFile(bufferToUpload, originalname, {
        uploader: req.user?.email || "anonymous",
        mimetype: shouldEncrypt ? "application/octet-stream" : mimetype,
        isEncrypted: shouldEncrypt,
      });

      res.status(200).json({
        success: true,
        documentName: originalname,
        documentSizeBytes: size,
        documentMimetype: mimetype,
        documentHash,
        pinataCid: pinataResult.cid,
        gatewayUrl: pinataResult.gatewayUrl,
        isSimulated: pinataResult.isMock,
        ...encryptionMetadata,
      });
    } catch (error: any) {
      console.error("File upload error:", error);
      res.status(500).json({
        error: "Upload Failed",
        message: error.message || "Failed to process and store document.",
      });
    }
  }

  public static async calculateHashOnly(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const documentHash = HashService.calculateSHA256(req.file.buffer);
      res.json({
        documentName: req.file.originalname,
        documentHash,
        sizeBytes: req.file.size,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Hashing failed", message: error.message });
    }
  }
}
