# CredChain — Tamper-Evident Decentralized Credential Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/tests-29%2F29%20passed-success.svg)]()
[![Network](https://img.shields.io/badge/Blockchain-Polygon%20Amoy%20(80002)-8A2BE2.svg)]()
[![Storage](https://img.shields.io/badge/Decentralized%20Storage-IPFS%20(Pinata)-blue.svg)]()
[![Security](https://img.shields.io/badge/Security-AES--256--GCM-orange.svg)]()

> **Smart India Hackathon (SIH 2026) — PS 26194**  
> **Category:** Software | **Theme:** Blockchain & Cybersecurity | **Organization:** AICTE / MIC  
> **Core Architecture:** Polygon Amoy Smart Contracts + IPFS Decentralized Storage + AES-256 Client/Server Encryption + Two-Zone Privacy Architecture.

---

## 🌟 Key Differentiators (PRD PS26194 Alignment)

Standard blockchain credential systems simply anchor a static certificate hash on-chain, which only answers whether a final document was stamped. **CredChain introduces two fundamental architectural breakthroughs:**

1. **Progressive Milestone Trail Validation (PRD Section 3A & 12):**
   * Instead of binary end-state verification, CredChain anchors an unbroken chain of prerequisite events (e.g., semester results, project milestones, land deed transfers).
   * **Live Forged Certificate Fail-Case (`BTECH-2026-FORGED`):** Demonstrates that a counterfeit certificate with a forged stamp is immediately flagged as `FORGED_MILESTONE_TRAIL` because it lacks verified prerequisite coursework.
2. **Decentralized Storage & AES-256 Encryption (PRD Section 3B):**
   * Eliminates the single point of failure of centralized institutional databases.
   * Personal documents (PDFs, transcripts, land records) are encrypted at rest with **AES-256-GCM** before being pinned to **IPFS** via Pinata.
   * Only 32-byte cryptographic SHA-256 hashes and content CIDs are anchored on-chain.
3. **Holder Acceptance & Consent-Gated Access (PRD Section 5 & 8):**
   * **Holder Acceptance Flow:** Newly issued credentials route directly to the holder's wallet in a `PENDING` state. The holder reviews and formally **Accepts** or **Rejects** the credential.
   * **Time-Boxed Access Handshake:** Holders grant time-boxed decryption access (1 hr, 24 hr, 7 days) to verifiers, permanently audited on-chain.
4. **Structured Verification Presentation:**
   * Instant verification explicitly presents: **Credential Type**, **Credential Name**, **Issuer Name**, and **Holder Name** alongside cryptographic SHA-256 proofs and ledger transactions.

---

## 🏛️ Platform Architecture

```
                                +-----------------------------------+
                                |     CredChain Web Client (Vite)   |
                                |     (Issuer / Holder / Verifier)  |
                                +-----------------+-----------------+
                                                  |
                        +-------------------------+-------------------------+
                        |                                                   |
             [REST API / File Upload]                            [Web3 Wallet / Auth]
                        |                                                   |
                        v                                                   v
         +-----------------------------+                     +-----------------------------+
         |   Express + TS API Server   |                     |   Supabase Auth & OAuth     |
         +--------------+--------------+                     +--------------+--------------+
                        |                                                   |
          +-------------+-------------+                                     |
          |                           |                                     |
          v                           v                                     v
+------------------+       +-------------------+                 +-------------------+
|   Pinata IPFS    |       |   Polygon Amoy    |                 |    PostgreSQL     |
| (Encrypted Docs) |       |  (Proof Registry) |                 | (RLS & History)   |
+------------------+       +-------------------+                 +-------------------+
```

### Two-Zone Privacy Architecture
* **Zone 1 (Public On-Chain Metadata):** Credential ID, SHA-256 Document Hash, Linked Parent Milestone ID, Issuer Address, Holder Address, Timestamp, Status (`ACTIVE`, `PENDING`, `REJECTED`, `REVOKED`).
* **Zone 2 (Private Off-Chain Payload):** Personal student details, grades, land boundaries, encrypted PDF blobs stored on IPFS.

---

## 📦 Project Structure

```
CredChain/
├── backend/              # Node.js, Express, TypeScript REST API
│   ├── src/controllers/  # Credential, Verification, File, and Access controllers
│   ├── src/services/     # BlockchainService, CryptoService, PinataService, SupabaseService
│   └── src/__tests__/    # Jest unit and integration test suite
├── blockchain/           # Smart contract workspace
│   ├── contracts/        # CredChain.sol (Progressive milestone registry)
│   ├── scripts/          # Amoy testnet deployment scripts
│   └── test/             # Hardhat smart contract test suite (16 tests)
├── frontend/             # React 18, Vite, TypeScript, Tailwind CSS
│   ├── src/pages/        # Dashboard, Issue, Wallet, Verify, Revoke, Explorer
│   ├── src/context/      # AuthContext (Role Switcher) & Web3Context
│   └── src/services/     # Typed API & Supabase integration services
├── supabase/             # PostgreSQL database migrations & demo seed data
├── docs/                 # Setup guide, deployment guide, Google OAuth guide
└── .env.example          # Environment variable template
```

---

## ⚡ Quick Start

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MetaMask** (optional, for on-chain Web3 wallet interaction)

### 2. Install Dependencies
```bash
# Compile smart contracts
npm run compile:blockchain

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 3. Environment Configuration
Copy `.env.example` to `.env` in the root (or `backend/.env` and `frontend/.env`):
```bash
cp .env.example .env
```
*(CredChain features a built-in in-memory simulation engine for zero-config offline demonstrations without needing live testnet gas or cloud API keys!)*

### 4. Run Test Suites
```bash
# Smart Contract Tests (16/16 passing)
cd blockchain && npm test

# Backend & Milestone Trail Tests (13/13 passing)
cd ../backend && npm test
cd ..
```

### 5. Start Development Servers
In separate terminal windows:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:backend

# Terminal 2: Frontend (port 5173)
npm run dev:frontend
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Live Demonstration Walkthrough

Use the top **Role Switcher** in the navbar to test all 4 personas:

### 1. Institutional Milestone & Final Issuance (`/issue`)
* Select **🏛️ Issuer (ABC Institute of Technology)**.
* Navigate to **Issue Credential** (`/issue`).
* Toggle between **Milestone Event** or **Final Degree Certificate**.
* Upload a document or use demo defaults. Click **Anchor & Issue on Polygon Amoy**.
* The credential is encrypted, hashed, anchored on-chain, and routed to the holder in `PENDING` state.

### 2. Holder Review & Acceptance (`/wallet`)
* Switch role to **👤 Holder (Rahul Kumar)**.
* In the wallet banner, notice the pending credential offer.
* Click **Accept** (or **Reject**). The credential transitions to `ACTIVE`, and on-chain history logs the acceptance.

### 3. Verification & Milestone Inspection (`/verify`)
* Switch role to **🔍 Verifier (XYZ Global Bank)**.
* Verify `BTECH-2026-001` or upload a document:
  * **Result:** Displays **✓ Valid Credential** with **Credential Type**, **Credential Name**, **Issuer**, and **Holder Name**.
  * Displays the unbroken **3-Tier Milestone Trail** (Semester 1–4 Grade Sheet ➔ Capstone ➔ Final Degree).

### 4. Forged Certificate Fail-Case (`BTECH-2026-FORGED`)
* In `/verify`, enter `BTECH-2026-FORGED`.
* **Result:** Flagged as **✕ Forged Credential (Broken Milestone Trail)**. Proves that even if a paper certificate is visually authentic, it cannot forge an unbroken on-chain learning trail.

### 5. Revocation Flow (`/revoke`)
* As Issuer, revoke any active credential with an official reason.
* Verifying the credential immediately flags it as **✕ Revoked**.

---

## 📜 Smart Contract Specification (`CredChain.sol`)

* **Network**: Polygon Amoy Testnet (Chain ID: 80002)
* **Key Methods**:
  * `issueCredential(...)` / `issueProgressiveCredential(...)`
  * `verifyCredential(...)` & `verifyMilestoneTrail(...)`
  * `revokeCredential(string credentialId, string reason)`
  * `grantTimeboxedAccess(string credentialId, address verifier, uint256 durationSeconds)`
  * `revokeAccess(string credentialId, address verifier)`

---

## 🔒 Security & Privacy

* **Strictly Zero PII On-Chain**: No student names, personal identifiers, or unencrypted documents are stored on the public ledger.
* **Environment Protection**: All service secrets, private keys, and API tokens are server-side only and excluded from version control via multi-tier `.gitignore` policies.
* **Consent Gating**: All document decryption requires cryptographic holder consent with automatic time-based expiry.

---

## 👥 Contributors & SIH 2026 Team

* **Project:** CredChain
* **Problem Statement:** PS 26194 (Student Innovation — Distributed Ledger Technology)
* **Theme:** Blockchain & Cybersecurity
