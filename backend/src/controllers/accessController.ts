import { Request, Response } from "express";
import { SupabaseService } from "../services/supabaseService";
import { BlockchainService } from "../services/blockchainService";

export class AccessController {
  /**
   * List access grants for a credential
   */
  public static async getAccessGrants(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const grants = await SupabaseService.getAccessGrants(credentialId);
      res.json({ credentialId, grants });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch access grants", message: error.message });
    }
  }

  /**
   * Grant access to a verifier with optional time-box duration & on-chain proof
   */
  public static async grantAccess(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.role !== "holder" && user.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only the Credential Holder or Admin can grant access.",
        });
        return;
      }

      const { credentialId } = req.params;
      const { verifierId, verifierName, verifierEmail, expiresAt, durationHours, verifierWallet } = req.body;

      if (!verifierId) {
        res.status(400).json({ error: "Verifier ID required" });
        return;
      }

      const credential = await SupabaseService.getCredentialById(credentialId);
      if (!credential) {
        res.status(404).json({ error: "Credential not found" });
        return;
      }

      // Calculate expiration timestamp (PRD Section 7 item 5: time-boxed access)
      const hours = durationHours || 48; // default 48h
      const computedExpiresAt = expiresAt || new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const durationSeconds = Math.floor(hours * 3600);

      // Broadcast on-chain access grant to Polygon Amoy
      const onChainTx = await BlockchainService.grantAccessOnChain(
        credentialId,
        verifierWallet || "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        durationSeconds
      );

      const grantRecord = {
        credential_id: credentialId,
        holder_id: user.id,
        verifier_id: verifierId,
        verifier_name: verifierName || "Verifier",
        verifier_email: verifierEmail || "",
        granted_at: new Date().toISOString(),
        expires_at: computedExpiresAt,
        status: "ACTIVE",
        transaction_hash: onChainTx.txHash,
      };

      await SupabaseService.grantAccess(grantRecord);

      // Log to history with on-chain proof
      await SupabaseService.addHistoryEvent({
        credential_id: credentialId,
        action: "ACCESS_GRANTED",
        performed_by: user.id,
        performed_by_name: user.full_name,
        performed_by_address: user.wallet_address || credential.holder_wallet,
        timestamp: new Date().toISOString(),
        transaction_hash: onChainTx.txHash,
        is_blockchain_event: true,
        details: `Holder granted time-boxed access (${hours}h) to ${verifierName || verifierEmail || verifierId} (Expires: ${new Date(computedExpiresAt).toLocaleString()})`,
      });

      res.status(201).json({
        success: true,
        message: `Time-boxed access granted successfully for ${hours} hours.`,
        grant: grantRecord,
        blockchainTx: {
          txHash: onChainTx.txHash,
          isSimulated: onChainTx.isSimulated,
          explorerUrl: BlockchainService.getExplorerTxUrl(onChainTx.txHash),
        },
      });
    } catch (error: any) {
      console.error("Grant access error:", error);
      res.status(500).json({ error: "Failed to grant access", message: error.message });
    }
  }

  /**
   * Request access to a credential as a verifier (PRD Section 8)
   */
  public static async requestAccess(req: Request, res: Response): Promise<void> {
    try {
      const { credentialId } = req.params;
      const { verifierName, verifierEmail, purpose, durationHours } = req.body;
      const user = req.user;

      const credential = await SupabaseService.getCredentialById(credentialId);
      if (!credential) {
        res.status(404).json({ error: "Credential not found" });
        return;
      }

      const requestRecord = await SupabaseService.createAccessRequest({
        credentialId,
        holderId: credential.holder_id,
        verifierId: user?.id || `anon_verifier_${Date.now()}`,
        verifierName: verifierName || user?.full_name || user?.organization || "Accredited Verifier",
        verifierEmail: verifierEmail || user?.email || "verifier@organization.com",
        purpose: purpose || "Employment & Credential Verification",
        durationHours: durationHours || 48,
      });

      res.status(201).json({
        success: true,
        message: "Authorization request dispatched to credential owner's wallet.",
        request: requestRecord,
      });
    } catch (error: any) {
      console.error("Request access error:", error);
      res.status(500).json({ error: "Failed to request access", message: error.message });
    }
  }

  /**
   * List access requests (for holder to review)
   */
  public static async listAccessRequests(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const query: any = {};
      if (user?.role === "holder") {
        query.holderId = user.id;
      } else if (user?.role === "verifier") {
        query.verifierId = user.id;
      }

      const requests = await SupabaseService.listAccessRequests(query);
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to list requests", message: error.message });
    }
  }

  /**
   * Respond to an access request (Approve or Reject)
   */
  public static async respondAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.role !== "holder" && user.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only the Credential Holder or Admin can respond to access requests.",
        });
        return;
      }

      const { requestId } = req.params;
      const { action, durationHours = 48 } = req.body; // action: "APPROVE" | "REJECT"

      const requests = await SupabaseService.listAccessRequests();
      const targetReq = requests.find((r: any) => r.id === requestId);

      if (!targetReq) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      if (action === "APPROVE") {
        await SupabaseService.updateAccessRequest(requestId, "APPROVED");

        // Grant time-boxed access
        const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
        await SupabaseService.grantAccess({
          credential_id: targetReq.credential_id,
          holder_id: targetReq.holder_id,
          verifier_id: targetReq.verifier_id,
          verifier_name: targetReq.verifier_name,
          verifier_email: targetReq.verifier_email,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt,
          status: "ACTIVE",
        });

        res.json({
          success: true,
          message: "Request approved and time-boxed access grant activated.",
          status: "APPROVED",
        });
      } else {
        await SupabaseService.updateAccessRequest(requestId, "REJECTED");
        res.json({
          success: true,
          message: "Request declined.",
          status: "REJECTED",
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: "Failed to respond to request", message: error.message });
    }
  }

  /**
   * Revoke access from a verifier
   */
  public static async revokeAccess(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      if (user.role !== "holder" && user.role !== "admin") {
        res.status(403).json({
          error: "Forbidden",
          message: "Only the Credential Holder or Admin can revoke access.",
        });
        return;
      }

      const { credentialId, verifierId } = req.params;

      await SupabaseService.revokeAccess(credentialId, verifierId);

      // Log to history
      await SupabaseService.addHistoryEvent({
        credential_id: credentialId,
        action: "ACCESS_REVOKED",
        performed_by: user.id,
        performed_by_name: user.full_name,
        performed_by_address: user.wallet_address,
        timestamp: new Date().toISOString(),
        is_blockchain_event: false,
        details: `Access revoked for verifier ${verifierId}`,
      });

      res.json({
        success: true,
        message: "Access revoked successfully.",
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to revoke access", message: error.message });
    }
  }
}
