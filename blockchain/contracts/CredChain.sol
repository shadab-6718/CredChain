// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CredChain
 * @notice Tamper-evident digital credential and land-record verification registry.
 * @dev Stores cryptographic proofs (SHA-256 hashes, timestamps, issuer/holder addresses) and
 * progressive milestone links on-chain. Off-chain documents remain encrypted in IPFS.
 */
contract CredChain is Ownable, ReentrancyGuard {
    enum CredentialStatus {
        NONE,
        ACTIVE,
        REVOKED
    }

    struct CredentialProof {
        string credentialId;
        bytes32 documentHash;
        address issuer;
        address holder;
        uint256 issueTimestamp;
        uint256 revocationTimestamp;
        string credentialType;
        CredentialStatus status;
        string revocationReason;
        string eventType;              // "MILESTONE", "FINAL_CERTIFICATE", "LAND_TRANSFER", etc.
        string linkedPreviousEventId; // Parent milestone ID in progressive credential chain
        string ipfsCid;               // Off-chain encrypted document content identifier
    }

    struct GrantRecord {
        bool granted;
        uint256 expiresAt;
    }

    // Mapping from credentialId => CredentialProof
    mapping(string => CredentialProof) private _credentials;

    // Mapping from credentialId => verifier => GrantRecord (for time-boxed access)
    mapping(string => mapping(address => GrantRecord)) private _accessGrants;

    // Array of all credential IDs for registry indexing
    string[] private _allCredentialIds;

    // Maximum trail depth to prevent unbounded loops
    uint256 public constant MAX_TRAIL_DEPTH = 32;

    // Events
    event CredentialIssued(
        string indexed credentialId,
        bytes32 indexed documentHash,
        address indexed issuer,
        address holder,
        string credentialType,
        uint256 timestamp
    );

    event MilestoneChained(
        string indexed credentialId,
        string indexed linkedPreviousEventId,
        address indexed issuer,
        string eventType,
        uint256 timestamp
    );

    event CredentialRevoked(
        string indexed credentialId,
        address indexed issuer,
        uint256 timestamp,
        string reason
    );

    event AccessGranted(
        string indexed credentialId,
        address indexed holder,
        address indexed verifier,
        uint256 timestamp
    );

    event TimeboxedAccessGranted(
        string indexed credentialId,
        address indexed holder,
        address indexed verifier,
        uint256 timestamp,
        uint256 expiresAt
    );

    event AccessRevoked(
        string indexed credentialId,
        address indexed holder,
        address indexed verifier,
        uint256 timestamp
    );

    // Custom errors
    error CredentialAlreadyExists(string credentialId);
    error CredentialNotFound(string credentialId);
    error CredentialAlreadyRevoked(string credentialId);
    error UnauthorizedIssuer(address caller, address expectedIssuer);
    error UnauthorizedHolder(address caller, address expectedHolder);
    error InvalidParameters();
    error ParentMilestoneNotFound(string parentId);
    error ParentMilestoneRevoked(string parentId);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Issues a standard credential proof (backward compatible)
     */
    function issueCredential(
        string calldata credentialId,
        bytes32 documentHash,
        address holder,
        string calldata credentialType
    ) external nonReentrant {
        _internalIssue(
            credentialId,
            documentHash,
            "",
            holder,
            credentialType,
            "FINAL_CERTIFICATE",
            ""
        );
    }

    /**
     * @notice Issues a progressive milestone or final credential with parent milestone link & IPFS CID
     * @param credentialId Unique identifier (e.g. "BTECH-MS-001" or "BTECH-2026-001")
     * @param documentHash 32-byte SHA-256 hash of document
     * @param ipfsCid Content identifier of encrypted document in IPFS
     * @param holder Wallet address of credential owner
     * @param credentialType Descriptor (e.g. "Semester Grade Sheet", "B.Tech Degree")
     * @param eventType Event type ("MILESTONE", "FINAL_CERTIFICATE", "LAND_TRANSFER")
     * @param linkedPreviousEventId Identifier of predecessor milestone ("" for initial/root event)
     */
    function issueProgressiveCredential(
        string calldata credentialId,
        bytes32 documentHash,
        string calldata ipfsCid,
        address holder,
        string calldata credentialType,
        string calldata eventType,
        string calldata linkedPreviousEventId
    ) external nonReentrant {
        _internalIssue(
            credentialId,
            documentHash,
            ipfsCid,
            holder,
            credentialType,
            bytes(eventType).length > 0 ? eventType : "MILESTONE",
            linkedPreviousEventId
        );
    }

    function _internalIssue(
        string calldata credentialId,
        bytes32 documentHash,
        string memory ipfsCid,
        address holder,
        string calldata credentialType,
        string memory eventType,
        string memory linkedPreviousEventId
    ) internal {
        if (bytes(credentialId).length == 0 || documentHash == bytes32(0)) {
            revert InvalidParameters();
        }

        if (_credentials[credentialId].status != CredentialStatus.NONE) {
            revert CredentialAlreadyExists(credentialId);
        }

        // Validate linked parent milestone if specified
        if (bytes(linkedPreviousEventId).length > 0) {
            CredentialProof storage parent = _credentials[linkedPreviousEventId];
            if (parent.status == CredentialStatus.NONE) {
                revert ParentMilestoneNotFound(linkedPreviousEventId);
            }
            if (parent.status == CredentialStatus.REVOKED) {
                revert ParentMilestoneRevoked(linkedPreviousEventId);
            }
        }

        _credentials[credentialId] = CredentialProof({
            credentialId: credentialId,
            documentHash: documentHash,
            issuer: msg.sender,
            holder: holder,
            issueTimestamp: block.timestamp,
            revocationTimestamp: 0,
            credentialType: credentialType,
            status: CredentialStatus.ACTIVE,
            revocationReason: "",
            eventType: eventType,
            linkedPreviousEventId: linkedPreviousEventId,
            ipfsCid: ipfsCid
        });

        _allCredentialIds.push(credentialId);

        emit CredentialIssued(
            credentialId,
            documentHash,
            msg.sender,
            holder,
            credentialType,
            block.timestamp
        );

        if (bytes(linkedPreviousEventId).length > 0) {
            emit MilestoneChained(
                credentialId,
                linkedPreviousEventId,
                msg.sender,
                eventType,
                block.timestamp
            );
        }
    }

    /**
     * @notice Revokes an existing credential. Only the original issuer or contract owner can revoke.
     */
    function revokeCredential(
        string calldata credentialId,
        string calldata reason
    ) external nonReentrant {
        CredentialProof storage proof = _credentials[credentialId];

        if (proof.status == CredentialStatus.NONE) {
            revert CredentialNotFound(credentialId);
        }

        if (proof.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedIssuer(msg.sender, proof.issuer);
        }

        if (proof.status == CredentialStatus.REVOKED) {
            revert CredentialAlreadyRevoked(credentialId);
        }

        proof.status = CredentialStatus.REVOKED;
        proof.revocationTimestamp = block.timestamp;
        proof.revocationReason = reason;

        emit CredentialRevoked(
            credentialId,
            msg.sender,
            block.timestamp,
            reason
        );
    }

    /**
     * @notice Verifies a credential's existence, integrity against provided hash, and status
     */
    function verifyCredential(
        string calldata credentialId,
        bytes32 documentHash
    ) external view returns (
        bool isValid,
        bool exists,
        bool isRevoked,
        bool hashMatches,
        address issuer,
        address holder,
        uint256 issueTimestamp,
        string memory credentialType
    ) {
        CredentialProof storage proof = _credentials[credentialId];

        if (proof.status == CredentialStatus.NONE) {
            return (false, false, false, false, address(0), address(0), 0, "");
        }

        exists = true;
        isRevoked = (proof.status == CredentialStatus.REVOKED);
        hashMatches = (proof.documentHash == documentHash);
        issuer = proof.issuer;
        holder = proof.holder;
        issueTimestamp = proof.issueTimestamp;
        credentialType = proof.credentialType;

        isValid = (exists && !isRevoked && hashMatches);

        return (
            isValid,
            exists,
            isRevoked,
            hashMatches,
            issuer,
            holder,
            issueTimestamp,
            credentialType
        );
    }

    /**
     * @notice Verifies the complete progressive milestone trail backwards on-chain
     * @dev Validates that every preceding milestone in the chain exists and is ACTIVE
     * @param credentialId The target certificate or milestone to inspect
     * @return isTrailValid True if all milestones in the trail are present and active
     * @return trailLength Number of events traversed in the trail
     * @return trailIds Ordered array of credential IDs in the trail (from current back to root)
     */
    function verifyMilestoneTrail(
        string calldata credentialId
    ) external view returns (
        bool isTrailValid,
        uint256 trailLength,
        string[] memory trailIds
    ) {
        CredentialProof storage current = _credentials[credentialId];
        if (current.status == CredentialStatus.NONE || current.status == CredentialStatus.REVOKED) {
            return (false, 0, new string[](0));
        }

        string[] memory tempIds = new string[](MAX_TRAIL_DEPTH);
        tempIds[0] = credentialId;
        uint256 count = 1;
        string memory nextId = current.linkedPreviousEventId;

        while (bytes(nextId).length > 0 && count < MAX_TRAIL_DEPTH) {
            CredentialProof storage parent = _credentials[nextId];
            // If parent missing or revoked, milestone trail is invalid
            if (parent.status == CredentialStatus.NONE || parent.status == CredentialStatus.REVOKED) {
                // Return invalid trail
                string[] memory brokenTrail = new string[](count);
                for (uint256 i = 0; i < count; i++) {
                    brokenTrail[i] = tempIds[i];
                }
                return (false, count, brokenTrail);
            }

            tempIds[count] = nextId;
            count++;
            nextId = parent.linkedPreviousEventId;
        }

        string[] memory finalTrail = new string[](count);
        for (uint256 j = 0; j < count; j++) {
            finalTrail[j] = tempIds[j];
        }

        return (true, count, finalTrail);
    }

    /**
     * @notice Grants permanent verifier access (backward compatible)
     */
    function grantAccess(string calldata credentialId, address verifier) external {
        grantTimeboxedAccess(credentialId, verifier, 0);
    }

    /**
     * @notice Grants verifier access with a time-box duration in seconds
     * @param durationSeconds 0 for indefinite, or number of seconds from now
     */
    function grantTimeboxedAccess(
        string calldata credentialId,
        address verifier,
        uint256 durationSeconds
    ) public {
        CredentialProof storage proof = _credentials[credentialId];
        if (proof.status == CredentialStatus.NONE) {
            revert CredentialNotFound(credentialId);
        }
        if (proof.holder != msg.sender && proof.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedHolder(msg.sender, proof.holder);
        }

        uint256 expiresAt = (durationSeconds == 0)
            ? type(uint256).max
            : block.timestamp + durationSeconds;

        _accessGrants[credentialId][verifier] = GrantRecord({
            granted: true,
            expiresAt: expiresAt
        });

        emit AccessGranted(credentialId, msg.sender, verifier, block.timestamp);
        emit TimeboxedAccessGranted(credentialId, msg.sender, verifier, block.timestamp, expiresAt);
    }

    /**
     * @notice Revokes verifier access
     */
    function revokeAccess(string calldata credentialId, address verifier) external {
        CredentialProof storage proof = _credentials[credentialId];
        if (proof.status == CredentialStatus.NONE) {
            revert CredentialNotFound(credentialId);
        }
        if (proof.holder != msg.sender && proof.issuer != msg.sender && owner() != msg.sender) {
            revert UnauthorizedHolder(msg.sender, proof.holder);
        }

        _accessGrants[credentialId][verifier].granted = false;
        emit AccessRevoked(credentialId, msg.sender, verifier, block.timestamp);
    }

    /**
     * @notice Checks if a verifier has active, unexpired access
     */
    function hasAccess(string calldata credentialId, address verifier) external view returns (bool) {
        CredentialProof storage proof = _credentials[credentialId];
        if (proof.status == CredentialStatus.NONE) {
            return false;
        }

        if (verifier == proof.holder || verifier == proof.issuer) {
            return true;
        }

        GrantRecord storage grant = _accessGrants[credentialId][verifier];
        if (!grant.granted) {
            return false;
        }

        return block.timestamp <= grant.expiresAt;
    }

    /**
     * @notice Fetches full on-chain proof struct for a credential
     */
    function getCredentialProof(
        string calldata credentialId
    ) external view returns (CredentialProof memory) {
        CredentialProof storage proof = _credentials[credentialId];
        if (proof.status == CredentialStatus.NONE) {
            revert CredentialNotFound(credentialId);
        }
        return proof;
    }

    /**
     * @notice Returns total number of credentials registered in CredChain
     */
    function getTotalCredentials() external view returns (uint256) {
        return _allCredentialIds.length;
    }

    /**
     * @notice Returns a paginated list of credential IDs
     */
    function getCredentialIds(uint256 offset, uint256 limit) external view returns (string[] memory) {
        uint256 total = _allCredentialIds.length;
        if (offset >= total) {
            return new string[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 size = end - offset;
        string[] memory result = new string[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = _allCredentialIds[offset + i];
        }
        return result;
    }
}
