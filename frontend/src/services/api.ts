import axios from "axios";
import { Credential, CredentialHistoryEvent, AccessGrant, VerificationResponse, UserProfile, UserRole } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Supabase JWT or Demo headers automatically
export const setAuthToken = (token?: string, demoRole?: string, demoUserId?: string) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }

  if (demoRole) {
    api.defaults.headers.common["x-demo-role"] = demoRole;
  } else {
    delete api.defaults.headers.common["x-demo-role"];
  }

  if (demoUserId) {
    api.defaults.headers.common["x-demo-user-id"] = demoUserId;
  } else {
    delete api.defaults.headers.common["x-demo-user-id"];
  }
};

export const apiService = {
  // Auth
  getProfile: async (): Promise<{ profile: UserProfile }> => {
    const res = await api.get("/auth/profile");
    return res.data;
  },

  updateProfileRole: async (
    role: UserRole,
    organization?: string,
    fullName?: string
  ): Promise<{ success: boolean; profile: UserProfile }> => {
    const res = await api.post("/auth/role", { role, organization, fullName });
    return res.data;
  },

  saveGoogleUser: async (data: {
    email: string;
    fullName: string;
    role: UserRole;
    organization?: string;
    walletAddress?: string;
  }): Promise<{ success: boolean; profile: UserProfile }> => {
    const res = await api.post("/auth/google-sync", data);
    return res.data;
  },

  getVerifiers: async (): Promise<{ verifiers: UserProfile[] }> => {
    const res = await api.get("/users/verifiers");
    return res.data;
  },

  // File Upload
  uploadFile: async (file: File): Promise<{
    documentName: string;
    documentSizeBytes: number;
    documentMimetype: string;
    documentHash: string;
    pinataCid: string;
    gatewayUrl: string;
    isSimulated?: boolean;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  calculateHash: async (file: File): Promise<{ documentHash: string; documentName: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/files/hash", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Credentials
  issueCredential: async (payload: {
    credentialId?: string;
    holderId?: string;
    holderWallet?: string;
    credentialType: string;
    title: string;
    description?: string;
    documentName: string;
    documentSizeBytes?: number;
    pinataCid: string;
    documentHash: string;
    holderName?: string;
    recipientName?: string;
    issuerName?: string;
    organizationName?: string;
    eventType?: "MILESTONE" | "FINAL_CERTIFICATE" | "LAND_TRANSFER";
    linkedPreviousEventId?: string;
    isEncrypted?: boolean;
    metadata?: Record<string, any>;
  }): Promise<{ credential: Credential; blockchainTx: any }> => {
    const res = await api.post("/credentials", payload);
    return res.data;
  },

  listCredentials: async (): Promise<{ credentials: Credential[] }> => {
    const res = await api.get("/credentials");
    return res.data;
  },

  getCredential: async (credentialId: string): Promise<{ credential: Credential }> => {
    const res = await api.get(`/credentials/${credentialId}`);
    return res.data;
  },

  getMilestoneTrail: async (credentialId: string): Promise<{
    credentialId: string;
    trailLength: number;
    isValid: boolean;
    trail: any[];
  }> => {
    const res = await api.get(`/credentials/${credentialId}/trail`);
    return res.data;
  },

  getHistory: async (credentialId: string): Promise<{ credentialId: string; history: CredentialHistoryEvent[] }> => {
    const res = await api.get(`/credentials/${credentialId}/history`);
    return res.data;
  },

  revokeCredential: async (credentialId: string, reason?: string): Promise<{ success: boolean; transactionHash: string; explorerUrl: string }> => {
    const res = await api.post(`/credentials/${credentialId}/revoke`, { reason });
    return res.data;
  },

  respondCredential: async (
    credentialId: string,
    action: "ACCEPT" | "REJECT"
  ): Promise<{ success: boolean; message: string; credential: Credential }> => {
    const res = await api.post(`/credentials/${credentialId}/respond`, { action });
    return res.data;
  },

  acceptCredential: async (
    credentialId: string
  ): Promise<{ success: boolean; message: string; credential: Credential }> => {
    const res = await api.post(`/credentials/${credentialId}/accept`, { action: "ACCEPT" });
    return res.data;
  },

  rejectCredential: async (
    credentialId: string
  ): Promise<{ success: boolean; message: string; credential: Credential }> => {
    const res = await api.post(`/credentials/${credentialId}/reject`, { action: "REJECT" });
    return res.data;
  },

  // Access Grants & Consent Handshake
  getAccessGrants: async (credentialId: string): Promise<{ grants: AccessGrant[] }> => {
    const res = await api.get(`/credentials/${credentialId}/access`);
    return res.data;
  },

  grantAccess: async (
    credentialId: string,
    verifierId: string,
    verifierName?: string,
    verifierEmail?: string,
    durationHours?: number
  ): Promise<{ success: boolean; grant: AccessGrant }> => {
    const res = await api.post(`/credentials/${credentialId}/access`, {
      verifierId,
      verifierName,
      verifierEmail,
      durationHours,
    });
    return res.data;
  },

  revokeAccess: async (credentialId: string, verifierId: string): Promise<{ success: boolean }> => {
    const res = await api.delete(`/credentials/${credentialId}/access/${verifierId}`);
    return res.data;
  },

  requestAccess: async (
    credentialId: string,
    verifierName: string,
    verifierEmail: string,
    purpose?: string,
    durationHours?: number
  ): Promise<{ success: boolean; request: any }> => {
    const res = await api.post(`/credentials/${credentialId}/request-access`, {
      verifierName,
      verifierEmail,
      purpose,
      durationHours,
    });
    return res.data;
  },

  listAccessRequests: async (): Promise<{ requests: any[] }> => {
    const res = await api.get("/access/requests");
    return res.data;
  },

  respondAccessRequest: async (
    requestId: string,
    approved: boolean,
    durationHours?: number
  ): Promise<{ success: boolean; grant?: AccessGrant; message?: string }> => {
    const res = await api.post(`/access/requests/${requestId}/respond`, {
      approved,
      durationHours,
    });
    return res.data;
  },

  // Verification
  verify: async (credentialId: string, documentHash?: string, file?: File): Promise<VerificationResponse> => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("credentialId", credentialId);
      const res = await api.post("/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } else {
      const res = await api.post("/verify", { credentialId, documentHash });
      return res.data;
    }
  },
};
