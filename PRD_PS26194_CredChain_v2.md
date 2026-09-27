# Product Requirements Document

**Problem Statement:** SIH 2026 – PS 26194
**Working Product Name:** CredChain *(placeholder — rename as your team prefers)*
**Category:** Software | **Theme:** Blockchain & Cybersecurity
**Organization:** AICTE (AICTE/MIC – Student Innovation)
**Version:** 0.2 (Draft — differentiated)
**Date:** ______

---

## 1. Official Problem Statement (as issued)

> "Student Innovation - Provide ideas in a decentralized and distributed ledger technology used to store digital information that powers cryptocurrencies and NFTs and can radically change multiple sectors."

Open/ideation-category statement. Direction chosen: blockchain-based digital identity & credential verification (academic certificates + land records).

---

## 2. Why This Needs Explicit Differentiation

A quick literature scan turned up a fairly consistent existing pattern across multiple published blockchain-credential systems (CertificateChain, DocCert, EduCTX, Blockchain-for-Education, and others): issuer computes a hash of a certificate → writes it to a blockchain/smart contract → holder gets a QR code → verifier compares hashes. This is the "baseline" approach, and it's very likely what other SIH teams tackling similar PSs will also build. **If your PRD stops at hash-on-chain + QR scan, you will look identical to prior work** — including work already published and evaluated in research papers, which judges familiar with the space may recognize.

I found two gaps that are consistently named as unsolved even in the existing literature (not something I'm inventing — these are gaps the papers themselves flag):

1. **Verification is binary and end-state only.** Most systems verify "is this final certificate valid," not the process behind it — individual assignments, attendance, course completions, or the sequence of activities that produced the credential. A forged certificate that mimics a real one's format can be harder to catch than a forged learning trail.
2. **Off-chain data handling is the weak link.** Nearly every paper notes that while the hash is decentralized, the actual document usually still lives in a centralized university/government database — exactly the single point of failure blockchain was supposed to remove. Papers explicitly call this out as unsolved.

I'm not certain how many other SIH teams are aware of this literature gap — it's possible several teams converge on it independently, which would reduce its uniqueness. Treat this as a strong starting angle, not a guaranteed differentiator; validate against other teams' pitches once visible.

---

## 3. Differentiation Strategy

Two concrete pivots from the baseline design:

### A. Progressive/granular credentialing, not just a final certificate
Instead of only anchoring the final certificate hash, anchor a **chain of milestone events** that build up to it (e.g., semester results, key coursework completions, land-record amendments/transfers over time). A verifier can then inspect the *history*, not just a single end-state stamp — much harder to forge convincingly, and it directly answers "why blockchain and not just a signed PDF" with a concrete example: a forged final certificate has no matching milestone trail on-chain.

### B. Decentralized off-chain storage, not a centralized DB behind a hash
Store the actual documents on a **content-addressed, distributed store (e.g., IPFS)** rather than a conventional institutional database. The on-chain record stores the IPFS content hash. This directly closes the gap papers flag: no single database to breach, leak, or silently alter. Pair this with encryption so only the holder + authorized verifiers (via consent/access-grant) can decrypt the actual file — the chain proves *integrity*, IPFS+encryption handles *availability and confidentiality*.

### Positioning line for your pitch
"Existing systems put a single certificate on the blockchain. We put the *trail* on the blockchain and take the *single point of failure* off it."

---

## 4. Goals & Objectives

| Goal | Objective |
|---|---|
| Trust | Independently, cryptographically verifiable credentials |
| Depth | Verify the process/history behind a credential, not just its final state |
| Resilience | No centralized off-chain database as a single point of failure |
| Speed | Reduce verification time from days to seconds |
| Institution control | Issuers retain issue/revoke authority; no central data owner |
| Privacy | Holder-controlled, consent-gated access to underlying documents |

---

## 5. Target Users / Personas

1. **Issuing Authority** — university registrar / land registry officer. Issues milestone + final credentials, can revoke.
2. **Credential Holder** — student / landowner. Controls who can decrypt/view underlying documents; builds a verifiable history over time.
3. **Verifier** — employer, bank, other government department. Checks authenticity and, optionally, the milestone trail.
4. **System Admin** — onboards issuing institutions.

---

## 6. Scope

### In scope for hackathon MVP
- Issuer dashboard: issue a milestone or final credential, generate on-chain hash + IPFS content hash + QR
- Progressive credential chain for at least one entity (e.g., a student with 2–3 milestone events leading to a final certificate)
- Holder wallet: view own credential trail, grant/revoke verifier access to underlying documents
- Verifier flow: scan QR → see valid/invalid/revoked status → optionally view the milestone trail (with holder consent)
- Revocation flow
- One demo permissioned/test chain + IPFS (or IPFS-like) storage, 2 document types (certificate trail + land record)

### Out of scope for MVP
- Real integration with legacy university/land-registry databases
- Legal/regulatory recognition workflows
- Full KYC of issuers
- Native mobile apps

---

## 7. Core Features (MVP)

1. **Institution Onboarding** — register issuer identity/public key.
2. **Milestone Issuance** — issuer logs individual events (e.g., semester result, land transfer) as they occur; each is hashed and chained on-ledger.
3. **Final Credential Issuance** — issuer issues the final certificate, referencing the milestone chain.
4. **Decentralized Storage** — actual files pushed to IPFS (or equivalent), encrypted; only the content hash + access-control metadata go on-chain.
5. **Consent-Gated Access** — holder grants time-boxed decryption access to a specific verifier; access grants are themselves logged on-chain.
6. **Verification** — verifier scans QR/enters ID → sees status + (if granted) milestone trail.
7. **Revocation** — issuer revokes a credential; ledger records event, propagates to the trail.
8. **Audit Trail / Ledger Explorer** — read-only view of all issuance/access/revocation events (strong demo visual).

---

## 8. User Flows (high level)

**Progressive issuance:** Issuer logs milestone event → hash written, chained to holder's existing trail → (later) issuer issues final credential referencing the full trail.

**Consent-gated verification:** Verifier requests access → holder approves (time-boxed) → verifier can decrypt/view underlying document + trail → access event logged on-chain → access auto-expires.

**Revocation:** Issuer revokes a credential → ledger appends event → all future verifications of that credential (and dependent final credentials) show revoked/flagged.

---

## 9. Suggested Tech Stack

- **Ledger layer:** Hyperledger Fabric (permissioned) or a public testnet (Polygon Amoy) with a Solidity contract for issue/verify/revoke/access-grant events.
- **Decentralized storage:** IPFS for encrypted document blobs; on-chain stores only the CID (content identifier) + access-control metadata.
- **Encryption:** Client-side encryption before IPFS upload; symmetric key shared via a consent/access-grant mechanism (e.g., re-encrypted per verifier, or a simple shared-secret flow for demo purposes).
- **Backend:** Node.js/Express or Python/FastAPI bridging frontend, chain SDK, and IPFS client.
- **Frontend:** React/Next.js — issuer dashboard, holder wallet, verifier page, ledger explorer.

I'm not certain which testnet faucets or IPFS pinning services will be free/stable at hackathon time — verify availability close to the event.

---

## 10. Data Model (high level)

**On-chain:**
- Event ID (milestone or final credential)
- Issuer ID/public key
- Holder ID (or holder public key/DID)
- Event type (milestone / final certificate / land transfer / revocation / access-grant)
- Linked previous event ID (builds the chain/trail)
- IPFS content hash (CID)
- Timestamp, status

**Off-chain (IPFS, encrypted):**
- Actual document/file
- Detailed metadata (course name, grade, land parcel details, etc.)

---

## 11. Non-Functional Requirements

- **Security:** issuer private keys never exposed client-side; signed transactions only.
- **Privacy:** no PII on-chain; documents encrypted at rest on IPFS; access strictly consent-gated.
- **Availability:** no centralized database as a single point of failure for document storage.
- **Auditability:** every issuance, access-grant, and revocation is permanently traceable on-chain.

---

## 12. Success Metrics (for the hackathon demo)

- Live demo showing a forged *final certificate* (no matching milestone trail) failing verification — this is your strongest differentiator moment, make sure it's rehearsed
- Time to verify: under 5 seconds
- Live demo of consent-gated access: verifier cannot see the document until holder approves, then access expires
- End-to-end flow (milestone issue → final issue → holder consent → verify → revoke → re-verify) working live

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| IPFS/testnet downtime during demo | Local IPFS node + local/private chain as fallback |
| Encryption/access-grant flow adds complexity under time pressure | Build a simplified but real version for MVP; document the production-grade approach (e.g., proxy re-encryption) as future work rather than fully implementing it |
| Judges see "milestone trail" as just more data, not clearly differentiated | Rehearse the specific forged-certificate demo — it makes the difference concrete, not abstract |
| Team unfamiliar with IPFS or chosen chain SDK | Time-box a spike/prototype early (first 4 hours) to confirm feasibility before committing |

---

## 14. Suggested 36-Hour Hackathon Timeline

1. **Hrs 0–4:** Architecture lock, chain + IPFS spike, confirm both work end-to-end with a trivial example
2. **Hrs 4–14:** Milestone + final credential issuance (issuer dashboard + smart contract)
3. **Hrs 14–22:** IPFS upload/encryption + verification flow (QR/hash check)
4. **Hrs 22–28:** Consent-gated access flow + holder wallet
5. **Hrs 28–32:** Revocation, ledger explorer, seed realistic demo data (including one forged document for the fail-case demo)
6. **Hrs 32–36:** Rehearse demo (especially the forged-certificate moment), finalize PPT

---

## 15. Open Questions for Your Team to Resolve

- Public testnet (Polygon) or permissioned (Fabric) — affects SDK, demo reliability, and how you narrate "decentralization" to judges
- Real (anonymized) sample data or fully synthetic — a real-looking forged certificate is important for the demo's strongest moment
- How far to build the consent/access-grant encryption for real vs. describe as architecture — this is the most complex non-baseline feature; scope it honestly against your remaining time

---

*Differentiation claims here are based on a limited search of published academic/technical literature on blockchain credentialing, not a survey of other SIH teams' actual submissions. Validate against whatever visibility you get into competing teams before finalizing your pitch.*
