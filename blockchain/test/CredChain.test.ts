import { expect } from "chai";
import { ethers } from "hardhat";
import { CredChain } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CredChain Smart Contract", function () {
  let credChain: CredChain;
  let owner: SignerWithAddress;
  let issuer: SignerWithAddress;
  let holder: SignerWithAddress;
  let verifier: SignerWithAddress;
  let unauthorizedUser: SignerWithAddress;

  const testCredentialId = "BTECH-2026-001";
  const dummyDocContent = "CredChain Verified Certificate for Rahul Kumar ABC University";
  const testDocHash = ethers.keccak256(ethers.toUtf8Bytes(dummyDocContent));
  const alteredDocHash = ethers.keccak256(ethers.toUtf8Bytes(dummyDocContent + " TAMPERED"));
  const testCredentialType = "B.Tech Degree Certificate";

  beforeEach(async function () {
    [owner, issuer, holder, verifier, unauthorizedUser] = await ethers.getSigners();

    const CredChainFactory = await ethers.getContractFactory("CredChain");
    credChain = await CredChainFactory.deploy();
    await credChain.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the contract deployer as owner", async function () {
      expect(await credChain.owner()).to.equal(owner.address);
    });

    it("should initialize with 0 credentials", async function () {
      expect(await credChain.getTotalCredentials()).to.equal(0);
    });
  });

  describe("Credential Issuance", function () {
    it("should issue a new credential successfully and emit CredentialIssued event", async function () {
      const tx = await credChain.connect(issuer).issueCredential(
        testCredentialId,
        testDocHash,
        holder.address,
        testCredentialType
      );

      await expect(tx)
        .to.emit(credChain, "CredentialIssued")
        .withArgs(
          testCredentialId,
          testDocHash,
          issuer.address,
          holder.address,
          testCredentialType,
          (val: any) => typeof val === "bigint" || Number(val) > 0
        );

      expect(await credChain.getTotalCredentials()).to.equal(1);

      const proof = await credChain.getCredentialProof(testCredentialId);
      expect(proof.credentialId).to.equal(testCredentialId);
      expect(proof.documentHash).to.equal(testDocHash);
      expect(proof.issuer).to.equal(issuer.address);
      expect(proof.holder).to.equal(holder.address);
      expect(proof.credentialType).to.equal(testCredentialType);
      expect(proof.status).to.equal(1); // ACTIVE
    });

    it("should reject duplicate credential IDs", async function () {
      await credChain.connect(issuer).issueCredential(
        testCredentialId,
        testDocHash,
        holder.address,
        testCredentialType
      );

      await expect(
        credChain.connect(issuer).issueCredential(
          testCredentialId,
          testDocHash,
          holder.address,
          testCredentialType
        )
      ).to.be.revertedWithCustomError(credChain, "CredentialAlreadyExists");
    });

    it("should reject empty credential ID or zero hash", async function () {
      await expect(
        credChain.connect(issuer).issueCredential("", testDocHash, holder.address, testCredentialType)
      ).to.be.revertedWithCustomError(credChain, "InvalidParameters");

      await expect(
        credChain.connect(issuer).issueCredential(
          testCredentialId,
          ethers.ZeroHash,
          holder.address,
          testCredentialType
        )
      ).to.be.revertedWithCustomError(credChain, "InvalidParameters");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await credChain.connect(issuer).issueCredential(
        testCredentialId,
        testDocHash,
        holder.address,
        testCredentialType
      );
    });

    it("should return isValid=true when hash matches and credential is active", async function () {
      const result = await credChain.verifyCredential(testCredentialId, testDocHash);

      expect(result.isValid).to.be.true;
      expect(result.exists).to.be.true;
      expect(result.isRevoked).to.be.false;
      expect(result.hashMatches).to.be.true;
      expect(result.issuer).to.equal(issuer.address);
      expect(result.holder).to.equal(holder.address);
      expect(result.credentialType).to.equal(testCredentialType);
    });

    it("should return hashMatches=false and isValid=false when document is tampered", async function () {
      const result = await credChain.verifyCredential(testCredentialId, alteredDocHash);

      expect(result.isValid).to.be.false;
      expect(result.exists).to.be.true;
      expect(result.isRevoked).to.be.false;
      expect(result.hashMatches).to.be.false;
    });

    it("should return exists=false when credential is unknown", async function () {
      const result = await credChain.verifyCredential("NON-EXISTENT-ID", testDocHash);

      expect(result.isValid).to.be.false;
      expect(result.exists).to.be.false;
      expect(result.isRevoked).to.be.false;
    });
  });

  describe("Revocation", function () {
    beforeEach(async function () {
      await credChain.connect(issuer).issueCredential(
        testCredentialId,
        testDocHash,
        holder.address,
        testCredentialType
      );
    });

    it("should allow original issuer to revoke credential and emit event", async function () {
      const reason = "Administrative correction";
      const tx = await credChain.connect(issuer).revokeCredential(testCredentialId, reason);

      await expect(tx)
        .to.emit(credChain, "CredentialRevoked")
        .withArgs(
          testCredentialId,
          issuer.address,
          (val: any) => typeof val === "bigint" || Number(val) > 0,
          reason
        );

      const proof = await credChain.getCredentialProof(testCredentialId);
      expect(proof.status).to.equal(2); // REVOKED
      expect(proof.revocationReason).to.equal(reason);

      // Subsequent verification should fail
      const result = await credChain.verifyCredential(testCredentialId, testDocHash);
      expect(result.isValid).to.be.false;
      expect(result.isRevoked).to.be.true;
      expect(result.exists).to.be.true;
    });

    it("should prevent unauthorized users from revoking credentials", async function () {
      await expect(
        credChain.connect(unauthorizedUser).revokeCredential(testCredentialId, "Malicious attempt")
      ).to.be.revertedWithCustomError(credChain, "UnauthorizedIssuer");
    });

    it("should reject revoking an already revoked credential", async function () {
      await credChain.connect(issuer).revokeCredential(testCredentialId, "First revocation");

      await expect(
        credChain.connect(issuer).revokeCredential(testCredentialId, "Second attempt")
      ).to.be.revertedWithCustomError(credChain, "CredentialAlreadyRevoked");
    });
  });

  describe("Access Grants", function () {
    beforeEach(async function () {
      await credChain.connect(issuer).issueCredential(
        testCredentialId,
        testDocHash,
        holder.address,
        testCredentialType
      );
    });

    it("should allow holder to grant and revoke access to a verifier", async function () {
      expect(await credChain.hasAccess(testCredentialId, verifier.address)).to.be.false;

      await expect(credChain.connect(holder).grantAccess(testCredentialId, verifier.address))
        .to.emit(credChain, "AccessGranted")
        .withArgs(testCredentialId, holder.address, verifier.address, (v: any) => typeof v === "bigint" || Number(v) > 0);

      expect(await credChain.hasAccess(testCredentialId, verifier.address)).to.be.true;

      await expect(credChain.connect(holder).revokeAccess(testCredentialId, verifier.address))
        .to.emit(credChain, "AccessRevoked")
        .withArgs(testCredentialId, holder.address, verifier.address, (v: any) => typeof v === "bigint" || Number(v) > 0);

      expect(await credChain.hasAccess(testCredentialId, verifier.address)).to.be.false;
    });

    it("should support time-boxed access grants with automatic expiration", async function () {
      // Grant access for 2 seconds
      await credChain.connect(holder).grantTimeboxedAccess(testCredentialId, verifier.address, 2);
      expect(await credChain.hasAccess(testCredentialId, verifier.address)).to.be.true;

      // Increase time on local testnet by 5 seconds
      await ethers.provider.send("evm_increaseTime", [5]);
      await ethers.provider.send("evm_mine", []);

      // Access should now be expired
      expect(await credChain.hasAccess(testCredentialId, verifier.address)).to.be.false;
    });
  });

  describe("Progressive Milestone Chaining (PRD Differentiator)", function () {
    const ms1Id = "BTECH-MS-001";
    const ms2Id = "BTECH-MS-002";
    const finalId = "BTECH-2026-FINAL";
    const cid1 = "bafybeicredchain_sem1_4";
    const cid2 = "bafybeicredchain_capstone";
    const cidFinal = "bafybeicredchain_finaldegree";

    it("should issue a chained 3-tier milestone sequence and verify the complete trail on-chain", async function () {
      // 1. Issue Milestone 1 (Root milestone)
      await credChain.connect(issuer).issueProgressiveCredential(
        ms1Id,
        testDocHash,
        cid1,
        holder.address,
        "Semester 1-4 Results",
        "MILESTONE",
        ""
      );

      // 2. Issue Milestone 2 (Chained to MS1)
      await credChain.connect(issuer).issueProgressiveCredential(
        ms2Id,
        testDocHash,
        cid2,
        holder.address,
        "Capstone & Defense Approval",
        "MILESTONE",
        ms1Id
      );

      // 3. Issue Final Certificate (Chained to MS2)
      await credChain.connect(issuer).issueProgressiveCredential(
        finalId,
        testDocHash,
        cidFinal,
        holder.address,
        "Bachelor of Technology Degree",
        "FINAL_CERTIFICATE",
        ms2Id
      );

      // Verify on-chain trail traversal
      const [isTrailValid, trailLength, trailIds] = await credChain.verifyMilestoneTrail(finalId);
      expect(isTrailValid).to.be.true;
      expect(trailLength).to.equal(3);
      expect(trailIds[0]).to.equal(finalId);
      expect(trailIds[1]).to.equal(ms2Id);
      expect(trailIds[2]).to.equal(ms1Id);
    });

    it("should reject linking to a non-existent parent milestone", async function () {
      await expect(
        credChain.connect(issuer).issueProgressiveCredential(
          "FORGED-001",
          testDocHash,
          "cid_fake",
          holder.address,
          "Degree Certificate",
          "FINAL_CERTIFICATE",
          "NON-EXISTENT-PARENT"
        )
      ).to.be.revertedWithCustomError(credChain, "ParentMilestoneNotFound");
    });

    it("should invalidate trail if an intermediate milestone is revoked", async function () {
      // Issue MS1 -> MS2
      await credChain.connect(issuer).issueProgressiveCredential(
        "REV-MS1",
        testDocHash,
        cid1,
        holder.address,
        "Prerequisite Milestone",
        "MILESTONE",
        ""
      );

      await credChain.connect(issuer).issueProgressiveCredential(
        "REV-FINAL",
        testDocHash,
        cidFinal,
        holder.address,
        "Degree",
        "FINAL_CERTIFICATE",
        "REV-MS1"
      );

      // Trail is initially valid
      const [initValid] = await credChain.verifyMilestoneTrail("REV-FINAL");
      expect(initValid).to.be.true;

      // Revoke the prerequisite milestone
      await credChain.connect(issuer).revokeCredential("REV-MS1", "Academic fraud in coursework");

      // Trail should now be invalid
      const [afterValid] = await credChain.verifyMilestoneTrail("REV-FINAL");
      expect(afterValid).to.be.false;
    });
  });
});

