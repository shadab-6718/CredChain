import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware";
import { AuthController } from "../controllers/authController";
import { FileController } from "../controllers/fileController";
import { CredentialController } from "../controllers/credentialController";
import { AccessController } from "../controllers/accessController";
import { VerifyController } from "../controllers/verifyController";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    platform: "CredChain API",
    version: "2.0.0",
    network: "Polygon Amoy (80002)",
    features: ["Progressive Milestone Chaining", "Two-Zone Privacy Architecture", "Time-Boxed Access Grants"],
    timestamp: new Date().toISOString(),
  });
});

// 1. Auth & Profiles
router.get("/auth/profile", authMiddleware, AuthController.getProfile);
router.post("/auth/role", authMiddleware, AuthController.updateRole);
router.put("/auth/role", authMiddleware, AuthController.updateRole);
router.post("/auth/google-sync", AuthController.saveGoogleUser);
router.get("/users/verifiers", authMiddleware, AuthController.listVerifiers);
router.get("/users/holders", authMiddleware, AuthController.listHolders);

// 2. File Upload & SHA-256 Hashing (Protected)
router.post("/files/upload", authMiddleware, upload.single("file"), FileController.uploadFile);
router.post("/files/hash", upload.single("file"), FileController.calculateHashOnly);

// 3. Credentials & Progressive Milestone Trails
router.post("/credentials", authMiddleware, CredentialController.issueCredential);
router.get("/credentials", authMiddleware, CredentialController.listCredentials);
router.get("/credentials/:credentialId", CredentialController.getCredential);
router.get("/credentials/:credentialId/trail", CredentialController.getMilestoneTrail);
router.get("/credentials/:credentialId/history", CredentialController.getHistory);
router.post("/credentials/:credentialId/revoke", authMiddleware, CredentialController.revokeCredential);
router.post("/credentials/:credentialId/respond", authMiddleware, CredentialController.respondCredential);
router.post("/credentials/:credentialId/accept", authMiddleware, CredentialController.respondCredential);
router.post("/credentials/:credentialId/reject", authMiddleware, CredentialController.respondCredential);

// 4. Access Control & Consent Handshake
router.get("/credentials/:credentialId/access", authMiddleware, AccessController.getAccessGrants);
router.post("/credentials/:credentialId/access", authMiddleware, AccessController.grantAccess);
router.delete("/credentials/:credentialId/access/:verifierId", authMiddleware, AccessController.revokeAccess);
router.post("/credentials/:credentialId/request-access", AccessController.requestAccess);
router.get("/access/requests", authMiddleware, AccessController.listAccessRequests);
router.post("/access/requests/:requestId/respond", authMiddleware, AccessController.respondAccessRequest);

// 5. Verification (Public & Authenticated)
router.post("/verify", upload.single("file"), VerifyController.verifyCredential);

export default router;
