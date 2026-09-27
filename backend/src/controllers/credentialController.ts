import { Request, Response } from "express";
import { BlockchainService } from "../services/blockchainService";
import { SupabaseService } from "../services/supabaseService";
import crypto from "crypto";

export class CredentialController {
  /**
   * Issues a new credential or progressive milestone
   */
  public static async issueCredential(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.role !== "issuer" && user.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only an authorized Issuing Authority or Platform Admin can issue credentials.",
        });
        return;
      }

      const {
        credentialId: userGivenId,
        holderId,
        holderWallet,
        credentialType,
        title,
        description,
        documentName,
        documentSizeBytes,
        pinataCid,
        documentHash,
        metadata = {},
        eventType: userEventType,
        linkedPreviousEventId: userParentId,
        parentCredentialId,
        isEncrypted,
      } = req.body;

      if (!credentialType || !documentName || !pinataCid || !documentHash) {
        res.status(400).json({
          error: "Missing required fields",
          message: "credentialType, documentName, pinataCid, and documentHash are required.",
        });
        return;
      }

      // Generate clean standard Credential ID if not provided
      const credentialId = (userGivenId && userGivenId.trim().length > 0)
        ? userGivenId.trim().toUpperCase()
        : `CRED-2026-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      // Check if already exists in DB
      const existing = await SupabaseService.getCredentialById(credentialId);
      if (existing) {
        res.status(409).json({
          error: "Duplicate Credential ID",
          message: `A credential with ID ${credentialId} already exists in the registry.`,
        });
        return;
      }

      const issuerAddress = user.wallet_address || "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619";
      const targetHolderWallet = holderWallet || "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df";
      const resolvedHolderName = (
        req.body.holderName ||
        req.body.recipientName ||
        metadata?.holderName ||
        metadata?.recipientName ||
        "Rahul Kumar"
      ).trim();

      // Determine event type & linked parent (PRD Section 3A & 10)
      const resolvedParentId = (userParentId || parentCredentialId || metadata?.linkedPreviousEventId || metadata?.parentCredentialId || "").trim();
      let eventType = userEventType || metadata?.eventType || (credentialType.toLowerCase().includes("milestone") ? "MILESTONE" : "FINAL_CERTIFICATE");

      // 1. Write proof to Polygon Amoy Blockchain
      const onChainResult = await BlockchainService.issueCredentialOnChain(
        credentialId,
        documentHash,
        targetHolderWallet,
        credentialType,
        issuerAddress,
        resolvedParentId,
        pinataCid,
        eventType
      );

      // 2. Save metadata to Supabase
      const credentialRecord = {
        credential_id: credentialId,
        holder_id: holderId || "22222222-2222-2222-2222-222222222222",
        holder_wallet: targetHolderWallet,
        holder_name: resolvedHolderName,
        recipient_name: resolvedHolderName,
        issuer_id: user.id,
        issuer_wallet: issuerAddress,
        issuer_name:
          req.body.issuerName ||
          req.body.organizationName ||
          req.body.organization ||
          metadata?.issuerName ||
          metadata?.organization ||
          user.organization ||
          user.full_name ||
          "Authorized Issuer",
        credential_type: credentialType,
        event_type: eventType,
        linked_previous_event_id: resolvedParentId || null,
        title: title || `${credentialType} — ${resolvedHolderName}`,
        description: description || "",
        document_name: documentName,
        document_size_bytes: documentSizeBytes || 0,
        pinata_cid: pinataCid,
        document_hash: documentHash,
        blockchain_tx_hash: onChainResult.txHash,
        blockchain_network: "Polygon Amoy",
        contract_address: process.env.CREDCHAIN_CONTRACT_ADDRESS || "0xCredChainRegistry",
        issued_at: new Date().toISOString(),
        status: "PENDING",
        is_encrypted: Boolean(isEncrypted || metadata?.isEncrypted),
        metadata: {
          ...metadata,
          holderName: resolvedHolderName,
          recipientName: resolvedHolderName,
          linkedPreviousEventId: resolvedParentId || undefined,
          eventType,
        },
      };

      const savedRecord = await SupabaseService.insertCredential(credentialRecord);

      // 3. Log History Event
      await SupabaseService.addHistoryEvent({
        credential_id: credentialId,
        action: resolvedParentId ? "MILESTONE_CHAINED" : "ISSUED",
        performed_by: user.id,
        performed_by_name: user.organization || user.full_name,
        performed_by_address: issuerAddress,
        timestamp: new Date().toISOString(),
        transaction_hash: onChainResult.txHash,
        is_blockchain_event: true,
        details: resolvedParentId
          ? `Milestone chained to previous proof [${resolvedParentId}] on Polygon Amoy. Awaiting holder acceptance into vault.`
          : `Credential proof permanently anchored on Polygon Amoy. Routed to holder for formal acceptance.`,
      });

      res.status(201).json({
        success: true,
        credential: savedRecord,
        blockchainTx: {
          txHash: onChainResult.txHash,
          network: "Polygon Amoy",
          explorerUrl: BlockchainService.getExplorerTxUrl(onChainResult.txHash),
          isSimulated: onChainResult.isSimulated,
        },
      });
    } catch (error: any) {
      console.error("Issue credential error:", error);
      res.status(500).json({
        error: "Issuance Failed",
        message: error.message || "Failed to anchor credential proof.",
      });
    }
  }

  /**
   * List credentials for current user
   */
  public static async listCredentials(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      let query: any = {};
      if (user.role === "issuer") {
        query.issuerId = user.id;
      } else if (user.role === "holder") {
        query.holderId = user.id;
      }

      const credentials = await SupabaseService.listCredentials(query);
      res.json({ credentials });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to list credentials", message: error.message });
    }
  }

  /**
   * Get single credential by credentialId with access authorization
   */
  public static async getCredential(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const credential = await SupabaseService.getCredentialById(credentialId);

      if (!credential) {
        res.status(404).json({
          error: "Not Found",
          message: `Credential with ID ${credentialId} was not found in the registry.`,
        });
        return;
      }

      // Check on-chain status
      const onChainStatus = await BlockchainService.verifyCredentialOnChain(
        credentialId,
        credential.document_hash
      );

      // Fetch milestone trail
      const milestoneTrail = await SupabaseService.getMilestoneTrail(credentialId);
      const onChainTrail = await BlockchainService.verifyMilestoneTrailOnChain(credentialId);

      // Access verification for sensitive off-chain document CID
      const userId = req.user?.id;
      const userRole = req.user?.role || "verifier";

      let hasFullDocumentAccess = false;
      if (userId) {
        hasFullDocumentAccess = await SupabaseService.checkAccess(credentialId, userId, userRole);
      }

      const responseData = {
        ...credential,
        name: credential.title,
        type: credential.credential_type,
        holderName: credential.holder_name || credential.recipient_name || credential.metadata?.holderName || "Rahul Kumar",
        holder_name: credential.holder_name || credential.recipient_name || credential.metadata?.holderName || "Rahul Kumar",
        recipientName: credential.recipient_name || credential.holder_name || credential.metadata?.recipientName || "Rahul Kumar",
        recipient_name: credential.recipient_name || credential.holder_name || credential.metadata?.recipientName || "Rahul Kumar",
        issuer: credential.issuer_name,
        pinata_cid: hasFullDocumentAccess ? credential.pinata_cid : undefined,
        document_url: hasFullDocumentAccess ? `https://gateway.pinata.cloud/ipfs/${credential.pinata_cid}` : undefined,
        hasDocumentAccess: hasFullDocumentAccess,
        milestoneTrail,
        isMilestoneTrailValid: onChainTrail.isTrailValid,
        trailLength: onChainTrail.trailLength,
        blockchainProof: {
          ...onChainStatus,
          explorerUrl: credential.blockchain_tx_hash
            ? BlockchainService.getExplorerTxUrl(credential.blockchain_tx_hash)
            : undefined,
        },
      };

      res.json({ credential: responseData });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to retrieve credential", message: error.message });
    }
  }

  /**
   * Get full progressive milestone trail (PRD Section 3A & 7)
   */
  public static async getMilestoneTrail(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const trimmedId = credentialId.trim().toUpperCase();

      const trail = await SupabaseService.getMilestoneTrail(trimmedId);
      const onChainTrail = await BlockchainService.verifyMilestoneTrailOnChain(trimmedId);

      res.json({
        credentialId: trimmedId,
        trail,
        isTrailValid: onChainTrail.isTrailValid,
        trailLength: onChainTrail.trailLength,
        isSimulated: onChainTrail.isSimulated,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch milestone trail", message: error.message });
    }
  }

  /**
   * Get credential history timeline
   */
  public static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const history = await SupabaseService.getHistory(credentialId);
      res.json({ credentialId, history });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch history", message: error.message });
    }
  }

  /**
   * Revoke credential
   */
  public static async revokeCredential(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.role !== "issuer" && user.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only an authorized Issuing Authority or Platform Admin can revoke credentials.",
        });
        return;
      }

      const { credentialId } = req.params;
      const { reason = "Administrative revocation by issuer" } = req.body;

      const credential = await SupabaseService.getCredentialById(credentialId);
      if (!credential) {
        res.status(404).json({ error: "Credential not found" });
        return;
      }

      if (credential.status === "REVOKED") {
        res.status(400).json({ error: "Already revoked", message: "This credential has already been revoked." });
        return;
      }

      // 1. Revoke on Polygon Amoy blockchain
      const revokeTx = await BlockchainService.revokeCredentialOnChain(credentialId, reason);

      // 2. Update Supabase
      await SupabaseService.updateCredentialStatus(credentialId, "REVOKED", reason);

      // 3. Log History
      await SupabaseService.addHistoryEvent({
        credential_id: credentialId,
        action: "REVOKED",
        performed_by: user.id,
        performed_by_name: user.organization || user.full_name,
        performed_by_address: user.wallet_address || credential.issuer_wallet,
        timestamp: new Date().toISOString(),
        transaction_hash: revokeTx.txHash,
        is_blockchain_event: true,
        details: `Revoked on-chain: ${reason}`,
      });

      res.json({
        success: true,
        message: `Credential ${credentialId} has been successfully revoked.`,
        transactionHash: revokeTx.txHash,
        explorerUrl: BlockchainService.getExplorerTxUrl(revokeTx.txHash),
      });
    } catch (error: any) {
      console.error("Revoke error:", error);
      res.status(500).json({ error: "Revocation failed", message: error.message });
    }
  }

  /**
   * Holder accepts or rejects credential offer
   */
  public static async respondCredential(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { credentialId } = req.params;
      const { action } = req.body;

      if (!action || !["ACCEPT", "REJECT"].includes(action.toUpperCase())) {
        res.status(400).json({
          error: "Invalid action",
          message: "Action must be either 'ACCEPT' or 'REJECT'.",
        });
        return;
      }

      const normalizedAction = action.toUpperCase() as "ACCEPT" | "REJECT";
      const credential = await SupabaseService.getCredentialById(credentialId);

      if (!credential) {
        res.status(404).json({
          error: "Not Found",
          message: `Credential ${credentialId} was not found in the registry.`,
        });
        return;
      }

      // Update in Supabase & memory store + add lifecycle history event
      const updated = await SupabaseService.respondToCredential(credentialId, normalizedAction, user);

      // Sync status to blockchain simulation service
      BlockchainService.updateSimulatedStatus(credentialId, normalizedAction === "ACCEPT" ? "ACTIVE" : "REJECTED");

      res.json({
        success: true,
        message: normalizedAction === "ACCEPT"
          ? `Credential ${credentialId} accepted successfully and added to active wallet vault.`
          : `Credential ${credentialId} rejected.`,
        credential: updated,
      });
    } catch (error: any) {
      console.error("Respond credential error:", error);
      res.status(500).json({ error: "Failed to respond to credential", message: error.message });
    }
  }
}
