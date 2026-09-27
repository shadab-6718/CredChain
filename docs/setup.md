# CredChain — Complete Setup & Deployment Guide

This guide walks you through setting up CredChain from scratch, including smart contract deployment to Polygon Amoy, Supabase Auth/PostgreSQL configuration, Pinata IPFS keys, and running the application.

---

## 📋 Prerequisites

* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MetaMask Browser Extension** (for Web3 wallet interactions)
* **Free accounts** on:
  1. [Supabase](https://supabase.com)
  2. [Pinata Cloud](https://pinata.cloud)
  3. [Google Cloud Console](https://console.cloud.google.com) (for Google OAuth)
  4. [Polygon Amoy Faucet](https://faucet.polygon.technology/) (for free test POL)

---

## 🛠️ Step-by-Step Setup

### Step 1: Clone Repository & Configure `.env`
1. Copy `.env.example` to `.env` in the root folder:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your API keys (see sections below).

---

### Step 2: Supabase Database & Auth Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **Project Settings ➔ API**:
   * Copy `Project URL` ➔ set `SUPABASE_URL` and `VITE_SUPABASE_URL` in `.env`.
   * Copy `anon public` key ➔ set `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY` in `.env`.
   * Copy `service_role secret` ➔ set `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
3. Go to **SQL Editor** in Supabase:
   * Open file [supabase/migrations/20260905_initial_schema.sql](file:///c:/CredChain/supabase/migrations/20260905_initial_schema.sql)
   * Paste and click **Run** to create all tables, indexes, RLS policies, and triggers.
   * (Optional) Open [supabase/seed.sql](file:///c:/CredChain/supabase/seed.sql) and run it to populate demo records.

---

### Step 3: Google OAuth Configuration
See [docs/google_oauth_guide.md](file:///c:/CredChain/docs/google_oauth_guide.md) for detailed step-by-step instructions.

---

### Step 4: Pinata IPFS Account Setup
1. Sign up on [Pinata Cloud](https://pinata.cloud).
2. Go to **API Keys ➔ New Key**:
   * Enable `pinFileToIPFS` permissions.
   * Copy your **JWT** or **API Key + Secret API Key**.
3. In `.env`:
   ```env
   PINATA_JWT=your-pinata-jwt-token
   # Or:
   PINATA_API_KEY=your-api-key
   PINATA_SECRET_API_KEY=your-secret-key
   PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
   ```

---

### Step 5: Polygon Amoy Testnet & Smart Contract Deployment
1. **Get Test POL**:
   * Open MetaMask and switch to **Polygon Amoy Testnet** (Chain ID: 80002).
   * Request free test POL from [Polygon Faucet](https://faucet.polygon.technology/).
2. **Export Private Key** (for development only):
   * In MetaMask ➔ Account Details ➔ Export Private Key.
   * In `.env`:
     ```env
     DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
     POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
     ```
3. **Compile and Test Contracts**:
   ```bash
   cd blockchain
   npm install
   npm test
   ```
4. **Deploy to Polygon Amoy**:
   ```bash
   npm run deploy:amoy
   ```
   *Copy the printed contract address and update `.env`:*
   ```env
   CREDCHAIN_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   VITE_CREDCHAIN_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

---

### Step 6: Start Backend and Frontend
1. **Start Express Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Backend runs on `http://localhost:5000` (Health check: `http://localhost:5000/health`).*

2. **Start React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173`.*

---

## 🎯 Verification Checklist

- [ ] Smart contract tests pass (`npm test` in `blockchain/`)
- [ ] Backend tests pass (`npm test` in `backend/`)
- [ ] Frontend builds cleanly (`npm run build` in `frontend/`)
- [ ] Google OAuth & Email login work
- [ ] Issue credential ➔ verified on Polygon Amoy explorer
- [ ] Uploading altered document flags `✕ Document Integrity Failed`
- [ ] Revoking credential flags `✕ Credential Revoked`
