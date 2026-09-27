import { ethers } from "ethers";
import { ENV } from "../config/env";
import { SupabaseService } from "./supabaseService";

// Full ABI for upgraded CredChain.sol
const CREDCHAIN_ABI = [
  "function issueCredential(string credentialId, bytes32 documentHash, address holder, string credentialType) external",
  "function issueProgressiveCredential(string credentialId, bytes32 documentHash, string ipfsCid, address holder, string credentialType, string eventType, string linkedPreviousEventId) external",
  "function verifyCredential(string credentialId, bytes32 documentHash) external view returns (bool isValid, bool exists, bool isRevoked, bool hashMatches, address issuer, address holder, uint256 issueTimestamp, string credentialType)",
  "function verifyMilestoneTrail(string credentialId) external view returns (bool isTrailValid, uint256 trailLength, string[] memory trailIds)",
  "function revokeCredential(string credentialId, string reason) external",
  "function grantAccess(string credentialId, address verifier) external",
  "function grantTimeboxedAccess(string credentialId, address verifier, uint256 durationSeconds) external",
  "function revokeAccess(string credentialId, address verifier) external",
  "function hasAccess(string credentialId, address verifier) external view returns (bool)",
  "function getCredentialProof(string credentialId) external view returns (tuple(string credentialId, bytes32 documentHash, address issuer, address holder, uint256 issueTimestamp, uint256 revocationTimestamp, string credentialType, uint8 status, string revocationReason, string eventType, string linkedPreviousEventId, string ipfsCid))",
  "function getTotalCredentials() external view returns (uint256)",
  "event CredentialIssued(string indexed credentialId, bytes32 indexed documentHash, address indexed issuer, address holder, string credentialType, uint256 timestamp)",
  "event MilestoneChained(string indexed credentialId, string indexed linkedPreviousEventId, address indexed issuer, string eventType, uint256 timestamp)",
  "event CredentialRevoked(string indexed credentialId, address indexed issuer, uint256 timestamp, string reason)",
  "event AccessGranted(string indexed credentialId, address indexed holder, address indexed verifier, uint256 timestamp)",
  "event TimeboxedAccessGranted(string indexed credentialId, address indexed holder, address indexed verifier, uint256 timestamp, uint256 expiresAt)",
  "event AccessRevoked(string indexed credentialId, address indexed holder, address indexed verifier, uint256 timestamp)",
];

export interface VerificationResult {
  isValid: boolean;
  exists: boolean;
  isRevoked: boolean;
  isPending?: boolean;
  isRejected?: boolean;
  status?: string;
  hashMatches: boolean;
  issuer: string;
  holder: string;
  issueTimestamp: number;
  credentialType: string;
  blockchainNetwork: string;
  contractAddress: string;
  isSimulated?: boolean;
}

export interface MilestoneTrailResult {
  isTrailValid: boolean;
  trailLength: number;
  trailIds: string[];
  isSimulated?: boolean;
}

interface SimulatedRecord {
  credentialId: string;
  documentHash: string;
  issuer: string;
  holder: string;
  issueTimestamp: number;
  credentialType: string;
  eventType: string;
  linkedPreviousEventId: string;
  ipfsCid: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED";
  txHash: string;
}

export class BlockchainService {
  private static provider: ethers.JsonRpcProvider | null = null;
  private static signer: ethers.Wallet | null = null;
  private static contract: ethers.Contract | null = null;

  // In-memory simulation registry with pre-seeded SIH 2026 progressive trails & forged fail-case
  private static simulatedRegistry = new Map<string, SimulatedRecord>([
    // Student Rahul Kumar: Milestone 1 (Semesters 1-4)
    [
      "BTECH-MS-001",
      {
        credentialId: "BTECH-MS-001",
        documentHash: "0x1111a2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 720 * 86400000) / 1000),
        credentialType: "Semester 1–4 Cumulative Grade Sheet",
        eventType: "MILESTONE",
        linkedPreviousEventId: "",
        ipfsCid: "QmSem1to4GradesheetEncryptedCIDBTech2024",
        status: "ACTIVE",
        txHash: "0x117601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae1111",
      },
    ],
    // Student Rahul Kumar: Milestone 2 (Capstone Defense & Lab Thesis)
    [
      "BTECH-MS-002",
      {
        credentialId: "BTECH-MS-002",
        documentHash: "0x2222c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 90 * 86400000) / 1000),
        credentialType: "Capstone Defense & Lab Research Approval",
        eventType: "MILESTONE",
        linkedPreviousEventId: "BTECH-MS-001",
        ipfsCid: "QmCapstoneDefenseApprovalEncryptedCID2026",
        status: "ACTIVE",
        txHash: "0x227601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae2222",
      },
    ],
    // Student Rahul Kumar: Final Degree (Chained to MS-002)
    [
      "BTECH-2026-001",
      {
        credentialId: "BTECH-2026-001",
        documentHash: "0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 15 * 86400000) / 1000),
        credentialType: "Degree Certificate",
        eventType: "FINAL_CERTIFICATE",
        linkedPreviousEventId: "BTECH-MS-002",
        ipfsCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
        status: "ACTIVE",
        txHash: "0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692",
      },
    ],
    // Land Record: Milestone 1 (Cadastral Survey & Demarcation)
    [
      "LAND-MS-001",
      {
        credentialId: "LAND-MS-001",
        documentHash: "0x6666b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf6666",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 120 * 86400000) / 1000),
        credentialType: "Cadastral Survey & Plot Boundary Demarcation",
        eventType: "MILESTONE",
        linkedPreviousEventId: "",
        ipfsCid: "QmCadastralSurveyPlot402DemarcationCID",
        status: "ACTIVE",
        txHash: "0x33c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be93333",
      },
    ],
    // Land Record: Final Title Deed (Chained to LAND-MS-001)
    [
      "LAND-2026-088",
      {
        credentialId: "LAND-2026-088",
        documentHash: "0x7c92b3a2416d84f29a0614ebbb13970b8a32b69cb84a696ee103e33f37bcf7b2",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 40 * 86400000) / 1000),
        credentialType: "Land Title Deed",
        eventType: "FINAL_CERTIFICATE",
        linkedPreviousEventId: "LAND-MS-001",
        ipfsCid: "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx",
        status: "ACTIVE",
        txHash: "0x41c9f4561280be3e9d892305882319ef121111fdbccaa192801456199be90234",
      },
    ],
    // SIH 2026 Core Differentiator Demo: FORGED CREDENTIAL (Missing Milestone Trail)
    [
      "BTECH-2026-FORGED",
      {
        credentialId: "BTECH-2026-FORGED",
        documentHash: "0x9999c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84999",
        issuer: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
        holder: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
        issueTimestamp: Math.floor((Date.now() - 1 * 86400000) / 1000),
        credentialType: "Degree Certificate (Altered Paperwork)",
        eventType: "FINAL_CERTIFICATE",
        linkedPreviousEventId: "NON_EXISTENT_PREREQUISITE_MILESTONE",
        ipfsCid: "QmForgedUnverifiedCertificateNoPreReqsCID",
        status: "ACTIVE",
        txHash: "0x999901f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae9999",
      },
    ],
  ]);

  private static init() {
    if (this.provider) return;

    try {
      if (ENV.POLYGON_AMOY_RPC_URL) {
        this.provider = new ethers.JsonRpcProvider(ENV.POLYGON_AMOY_RPC_URL, 80002, {
          staticNetwork: true,
        });
      }

      const formattedKey = ENV.DEPLOYER_PRIVATE_KEY
        ? (ENV.DEPLOYER_PRIVATE_KEY.startsWith("0x")
            ? ENV.DEPLOYER_PRIVATE_KEY
            : `0x${ENV.DEPLOYER_PRIVATE_KEY}`)
        : null;

      if (formattedKey && formattedKey.length === 66 && this.provider) {
        this.signer = new ethers.Wallet(formattedKey, this.provider);
      }

      if (ENV.CREDCHAIN_CONTRACT_ADDRESS && this.provider) {
        this.contract = new ethers.Contract(
          ENV.CREDCHAIN_CONTRACT_ADDRESS,
          CREDCHAIN_ABI,
          this.signer || this.provider
        );
      }
    } catch (err: any) {
      console.warn("⚠️ Blockchain initialization note:", err.message);
    }
  }

  /**
   * Issues credential or milestone on Polygon Amoy testnet
   */
  public static async issueCredentialOnChain(
    credentialId: string,
    documentHash: string,
    holderAddress: string,
    credentialType: string,
    issuerAddress?: string,
    linkedPreviousEventId: string = "",
    ipfsCid: string = "",
    eventType: string = "FINAL_CERTIFICATE"
  ): Promise<{ txHash: string; blockNumber?: number; isSimulated?: boolean }> {
    this.init();

    const formattedHash = documentHash.startsWith("0x")
      ? documentHash
      : `0x${documentHash}`;

    const validHolder = ethers.isAddress(holderAddress)
      ? holderAddress
      : "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df";

    if (this.contract && this.signer) {
      try {
        console.log(`📡 Broadcasting Polygon Amoy proof for ${credentialId}...`);
        const contractWithSigner = this.contract.connect(this.signer) as any;
        const tx = await contractWithSigner.issueProgressiveCredential(
          credentialId,
          formattedHash,
          ipfsCid,
          validHolder,
          credentialType,
          eventType,
          linkedPreviousEventId
        );

        console.log(`⏳ Awaiting block confirmation: ${tx.hash}`);
        const receipt = await tx.wait(1);

        return {
          txHash: tx.hash,
          blockNumber: receipt?.blockNumber,
          isSimulated: false,
        };
      } catch (error: any) {
        console.error("⚠️ Polygon Amoy issue transaction note:", error.message);
        console.warn("⚠️ Utilizing deterministic proof simulation for SIH demonstration.");
      }
    }

    // Deterministic simulation fallback
    const simulatedTx = "0x" + ethers.keccak256(ethers.toUtf8Bytes(`${credentialId}_${Date.now()}`)).substring(2);
    this.simulatedRegistry.set(credentialId, {
      credentialId,
      documentHash: formattedHash.toLowerCase(),
      issuer: issuerAddress || this.signer?.address || "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
      holder: validHolder,
      issueTimestamp: Math.floor(Date.now() / 1000),
      credentialType,
      eventType,
      linkedPreviousEventId,
      ipfsCid,
      status: "PENDING",
      txHash: simulatedTx,
    });

    return {
      txHash: simulatedTx,
      blockNumber: 15420987,
      isSimulated: true,
    };
  }

  /**
   * Updates simulated credential status in memory registry
   */
  public static updateSimulatedStatus(credentialId: string, status: "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED") {
    const record = this.simulatedRegistry.get(credentialId);
    if (record) {
      record.status = status;
    }
  }

  /**
   * Verifies credential on-chain
   */
  public static async verifyCredentialOnChain(
    credentialId: string,
    documentHash: string
  ): Promise<VerificationResult> {
    this.init();

    const formattedHash = documentHash.startsWith("0x")
      ? documentHash
      : `0x${documentHash}`;

    if (this.contract && this.provider) {
      try {
        const result = await this.contract.verifyCredential(credentialId, formattedHash);
        return {
          isValid: Boolean(result[0]),
          exists: Boolean(result[1]),
          isRevoked: Boolean(result[2]),
          hashMatches: Boolean(result[3]),
          issuer: result[4],
          holder: result[5],
          issueTimestamp: Number(result[6]),
          credentialType: result[7],
          blockchainNetwork: "Polygon Amoy",
          contractAddress: ENV.CREDCHAIN_CONTRACT_ADDRESS || "0xCredChainRegistry",
          isSimulated: false,
        };
      } catch (err: any) {
        console.warn("⚠️ On-chain verify call note:", err.message);
      }
    }

    // Check simulation registry
    let simulated = this.simulatedRegistry.get(credentialId);
    if (!simulated) {
      try {
        const dbCred = await SupabaseService.getCredentialById(credentialId);
        if (dbCred) {
          simulated = {
            credentialId: dbCred.credential_id,
            documentHash: (dbCred.document_hash || "").toLowerCase(),
            issuer: dbCred.issuer_wallet || "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
            holder: dbCred.holder_wallet || "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
            issueTimestamp: Math.floor(new Date(dbCred.issued_at || Date.now()).getTime() / 1000),
            credentialType: dbCred.credential_type || "Credential",
            eventType: dbCred.event_type || "FINAL_CERTIFICATE",
            linkedPreviousEventId: dbCred.linked_previous_event_id || "",
            ipfsCid: dbCred.pinata_cid || "",
            status: dbCred.status || "PENDING",
            txHash: dbCred.blockchain_tx_hash || "0xsimulated",
          };
          this.simulatedRegistry.set(credentialId, simulated);
        }
      } catch {}
    }

    if (simulated) {
      const hashMatches = simulated.documentHash.toLowerCase() === formattedHash.toLowerCase();
      const isRevoked = simulated.status === "REVOKED";
      const isRejected = simulated.status === "REJECTED";
      const isPending = simulated.status === "PENDING";
      const isValid = hashMatches && !isRevoked && !isRejected;

      return {
        isValid,
        exists: true,
        isRevoked,
        isPending,
        isRejected,
        status: simulated.status,
        hashMatches,
        issuer: simulated.issuer,
        holder: simulated.holder,
        issueTimestamp: simulated.issueTimestamp,
        credentialType: simulated.credentialType,
        blockchainNetwork: "Polygon Amoy",
        contractAddress: ENV.CREDCHAIN_CONTRACT_ADDRESS || "0xCredChainRegistry",
        isSimulated: true,
      };
    }

    return {
      isValid: false,
      exists: false,
      isRevoked: false,
      hashMatches: false,
      issuer: ethers.ZeroAddress,
      holder: ethers.ZeroAddress,
      issueTimestamp: 0,
      credentialType: "",
      blockchainNetwork: "Polygon Amoy",
      contractAddress: ENV.CREDCHAIN_CONTRACT_ADDRESS || "0xCredChainRegistry",
      isSimulated: true,
    };
  }

  /**
   * Verifies the progressive milestone trail on-chain (PRD Section 3A & 12)
   */
  public static async verifyMilestoneTrailOnChain(
    credentialId: string
  ): Promise<MilestoneTrailResult> {
    this.init();

    if (this.contract && this.provider) {
      try {
        const res = await this.contract.verifyMilestoneTrail(credentialId);
        return {
          isTrailValid: Boolean(res[0]),
          trailLength: Number(res[1]),
          trailIds: Array.from(res[2]),
          isSimulated: false,
        };
      } catch (err: any) {
        console.warn("⚠️ On-chain trail verify note:", err.message);
      }
    }

    // Simulation traversal
    const current = this.simulatedRegistry.get(credentialId);
    if (!current || current.status === "REVOKED") {
      return { isTrailValid: false, trailLength: 0, trailIds: [], isSimulated: true };
    }

    const trailIds: string[] = [credentialId];
    let nextId = current.linkedPreviousEventId;
    let isTrailValid = true;

    while (nextId && nextId.trim().length > 0) {
      const parent = this.simulatedRegistry.get(nextId);
      if (!parent || parent.status === "REVOKED") {
        isTrailValid = false;
        trailIds.push(nextId); // broken link
        break;
      }
      trailIds.push(nextId);
      nextId = parent.linkedPreviousEventId;
    }

    return {
      isTrailValid,
      trailLength: trailIds.length,
      trailIds,
      isSimulated: true,
    };
  }

  /**
   * Revokes credential on-chain
   */
  public static async revokeCredentialOnChain(
    credentialId: string,
    reason: string
  ): Promise<{ txHash: string; isSimulated?: boolean }> {
    this.init();

    if (this.contract && this.signer) {
      try {
        const contractWithSigner = this.contract.connect(this.signer) as any;
        const tx = await contractWithSigner.revokeCredential(credentialId, reason);
        await tx.wait(1);
        return { txHash: tx.hash, isSimulated: false };
      } catch (err: any) {
        console.error("⚠️ Polygon Amoy revoke transaction error:", err.message);
      }
    }

    const simulated = this.simulatedRegistry.get(credentialId);
    if (simulated) {
      simulated.status = "REVOKED";
    }

    const simulatedTx = "0x" + ethers.keccak256(ethers.toUtf8Bytes(`REVOKE_${credentialId}_${Date.now()}`)).substring(2);
    return { txHash: simulatedTx, isSimulated: true };
  }

  /**
   * Records access grant on-chain with optional time-box duration
   */
  public static async grantAccessOnChain(
    credentialId: string,
    verifierAddress: string,
    durationSeconds: number = 0
  ): Promise<{ txHash: string; isSimulated?: boolean }> {
    this.init();

    const validVerifier = ethers.isAddress(verifierAddress)
      ? verifierAddress
      : "0x976EA74026E726554dB657fA54763abd0C3a0aa9";

    if (this.contract && this.signer) {
      try {
        const contractWithSigner = this.contract.connect(this.signer) as any;
        const tx = await contractWithSigner.grantTimeboxedAccess(credentialId, validVerifier, durationSeconds);
        await tx.wait(1);
        return { txHash: tx.hash, isSimulated: false };
      } catch (err: any) {
        console.warn("⚠️ On-chain access grant note:", err.message);
      }
    }

    const simulatedTx = "0x" + ethers.keccak256(ethers.toUtf8Bytes(`GRANT_${credentialId}_${Date.now()}`)).substring(2);
    return { txHash: simulatedTx, isSimulated: true };
  }

  public static getExplorerTxUrl(txHash: string): string {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }

  public static getExplorerAddressUrl(address: string): string {
    return `https://amoy.polygonscan.com/address/${address}`;
  }
}
