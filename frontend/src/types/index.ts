export type UserRole = "issuer" | "holder" | "verifier" | "admin";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  wallet_address?: string;
  organization?: string;
  avatar_url?: string;
}

export interface Credential {
  id: string;
  credential_id: string;
  credentialId?: string;
  holder_id?: string;
  holderId?: string;
  holder_wallet?: string;
  holderWallet?: string;
  recipient_did?: string;
  issuer_id?: string;
  issuerId?: string;
  issuer_wallet: string;
  issuerWallet?: string;
  issuer_name: string;
  issuerName?: string;
  issuer_organization?: string;
  issuer?: string;
  credential_type: string;
  credentialType?: string;
  title: string;
  description?: string;
  document_name: string;
  documentName?: string;
  document_size_bytes?: number;
  pinata_cid?: string;
  pinataCid?: string;
  document_url?: string;
  documentUrl?: string;
  document_hash: string;
  documentHash?: string;
  blockchain_tx_hash?: string;
  blockchainTxHash?: string;
  explorerUrl?: string;
  blockchain_network: string;
  contract_address?: string;
  issued_at: string;
  issuedAt?: string;
  revoked_at?: string;
  revokedAt?: string;
  revocation_reason?: string;
  revocationReason?: string;
  status: "ACTIVE" | "PENDING" | "REJECTED" | "REVOKED";
  holder_name?: string;
  holderName?: string;
  name?: string;
  type?: string;
  recipient_name?: string;
  recipientName?: string;
  event_type?: "MILESTONE" | "FINAL_CERTIFICATE" | "LAND_TRANSFER";
  linked_previous_event_id?: string | null;
  is_encrypted?: boolean;
  metadata?: Record<string, any>;
  hasDocumentAccess?: boolean;
  blockchainProof?: {
    isValid: boolean;
    exists: boolean;
    isRevoked: boolean;
    hashMatches: boolean;
    issuer: string;
    holder: string;
    issueTimestamp: number;
    credentialType: string;
    explorerUrl?: string;
  };
}

export interface CredentialHistoryEvent {
  id: string;
  credential_id: string;
  action: "ISSUED" | "VERIFIED" | "ACCESS_GRANTED" | "ACCESS_REVOKED" | "REVOKED" | "ACCEPTED" | "REJECTED" | "MILESTONE_CHAINED";
  performed_by_name?: string;
  performed_by_address?: string;
  timestamp: string;
  transaction_hash?: string;
  blockchain_tx_hash?: string;
  is_blockchain_event: boolean;
  details?: string;
}

export interface AccessGrant {
  id: string;
  credential_id: string;
  holder_id: string;
  verifier_id: string;
  verifier_name?: string;
  verifier_email?: string;
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

export interface AccessRequest {
  id: string;
  credential_id: string;
  verifier_id: string;
  verifier_name: string;
  verifier_email: string;
  purpose?: string;
  duration_hours?: number;
  status: "PENDING" | "APPROVED" | "DECLINED";
  created_at: string;
  expires_at?: string;
}

export interface VerificationResponse {
  status: "VALID" | "INVALID" | "REVOKED" | "NOT_FOUND" | "DOCUMENT_INTEGRITY_FAILED" | "FORGED_MILESTONE_TRAIL" | "TAMPERED" | "PENDING_ACCEPTANCE" | "REJECTED";
  isValid: boolean;
  headline: string;
  message: string;
  credentialId?: string;
  expectedHash?: string;
  providedHash?: string;
  credential?: Credential;
  trail?: any[];
  milestoneTrail?: any[];
  isMilestoneTrailValid?: boolean;
  trailLength?: number;
  differentiatorNote?: string;
  isTrailValid?: boolean;
  milestoneVerification?: {
    isTrailValid: boolean;
    trailLength: number;
    parentVerified: boolean;
    rootMilestone: string;
  };
  blockchainTx?: {
    txHash: string;
    network: string;
    blockNumber?: number;
    confirmed?: boolean;
    explorerUrl?: string;
  };
  timestamp: string;
}
