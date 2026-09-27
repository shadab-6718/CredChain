import axios from "axios";
import FormData from "form-data";
import { ENV } from "../config/env";
import crypto from "crypto";

export interface PinataUploadResult {
  cid: string;
  pinSize: number;
  timestamp: string;
  gatewayUrl: string;
  isMock?: boolean;
}

export class PinataService {
  /**
   * Uploads a file buffer to Pinata IPFS
   */
  public static async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    metadata?: Record<string, any>
  ): Promise<PinataUploadResult> {
    // If Pinata JWT or API keys are provided, upload to real IPFS
    if (ENV.PINATA_JWT || (ENV.PINATA_API_KEY && ENV.PINATA_SECRET_API_KEY)) {
      try {
        const formData = new FormData();
        formData.append("file", fileBuffer, { filename: fileName });

        const pinataMetadata = JSON.stringify({
          name: `CredChain_${fileName}_${Date.now()}`,
          keyvalues: {
            platform: "CredChain",
            ...metadata,
          },
        });
        formData.append("pinataMetadata", pinataMetadata);

        const pinataOptions = JSON.stringify({
          cidVersion: 1,
        });
        formData.append("pinataOptions", pinataOptions);

        const headers: Record<string, string> = {
          ...formData.getHeaders(),
        };

        if (ENV.PINATA_JWT) {
          headers["Authorization"] = `Bearer ${ENV.PINATA_JWT}`;
        } else {
          headers["pinata_api_key"] = ENV.PINATA_API_KEY;
          headers["pinata_secret_api_key"] = ENV.PINATA_SECRET_API_KEY;
        }

        const response = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: Infinity,
            headers,
          }
        );

        const cid = response.data.IpfsHash;
        return {
          cid,
          pinSize: response.data.PinSize || fileBuffer.length,
          timestamp: response.data.Timestamp || new Date().toISOString(),
          gatewayUrl: `${ENV.PINATA_GATEWAY_URL}${cid}`,
          isMock: false,
        };
      } catch (error: any) {
        console.error("⚠️ Pinata real upload error:", error.response?.data || error.message);
        console.warn("⚠️ Falling back to deterministic IPFS simulation for SIH prototype demo.");
      }
    }

    // Deterministic Mock IPFS CID for offline / unconfigured demo
    const mockHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const simulatedCid = `bafybeicredchain${mockHash.substring(0, 32)}`;

    return {
      cid: simulatedCid,
      pinSize: fileBuffer.length,
      timestamp: new Date().toISOString(),
      gatewayUrl: `${ENV.PINATA_GATEWAY_URL}${simulatedCid}`,
      isMock: true,
    };
  }

  /**
   * Generates gateway URL for a given CID
   */
  public static getGatewayUrl(cid: string): string {
    return `${ENV.PINATA_GATEWAY_URL}${cid}`;
  }
}
