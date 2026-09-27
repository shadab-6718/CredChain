import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const IssueCredentialPage: React.FC = () => {
  const { user } = useAuth();
  const { contractAddress } = useWeb3();
  const navigate = useNavigate();

  const [credentialType, setCredentialType] = useState("Degree Certificate");
  const [organizationName, setOrganizationName] = useState(user?.organization || "ABC Institute of Technology");
  const [holderName, setHolderName] = useState("");
  const [issuerKey, setIssuerKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [eventType, setEventType] = useState<"FINAL_CERTIFICATE" | "MILESTONE">("FINAL_CERTIFICATE");
  const [linkedPreviousEventId, setLinkedPreviousEventId] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [attachedMetadata, setAttachedMetadata] = useState('{"course": "Advanced Cryptography", "grade": "A"}');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successResult, setSuccessResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const executeIssue = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // 1. Upload file & calculate hash
      let uploadRes;
      if (selectedFile) {
        uploadRes = await apiService.uploadFile(selectedFile);
      } else {
        // Fallback demo document if none selected
        uploadRes = {
          pinataCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
          documentHash: "0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b",
        };
      }

      let parsedMeta = {};
      try {
        parsedMeta = JSON.parse(attachedMetadata);
      } catch {}

      // 2. Broadcast on Polygon Amoy
      const issuerEntityName = organizationName.trim() || user?.organization || "ABC Institute of Technology";
      const targetHolderName = holderName.trim() || "Rahul Kumar";
      const result = await apiService.issueCredential({
        credentialType,
        title: `${credentialType} — ${targetHolderName}`,
        documentName: selectedFile?.name || "academic_degree_certificate.pdf",
        documentSizeBytes: selectedFile?.size || 245100,
        pinataCid: uploadRes.pinataCid,
        documentHash: uploadRes.documentHash,
        holderName: targetHolderName,
        recipientName: targetHolderName,
        issuerName: issuerEntityName,
        organizationName: issuerEntityName,
        eventType,
        linkedPreviousEventId: linkedPreviousEventId.trim() || undefined,
        isEncrypted,
        metadata: {
          holderName: targetHolderName,
          recipientName: targetHolderName,
          issuerName: issuerEntityName,
          organization: issuerEntityName,
          college: issuerEntityName,
          eventType,
          linkedPreviousEventId: linkedPreviousEventId.trim() || undefined,
          isEncrypted,
          ...parsedMeta,
        },
      });

      setSuccessResult(result);
    } catch (err: any) {
      console.error("Issuance failed:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to issue credential.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-[#0b1315] text-gray-800 dark:text-gray-100 antialiased transition-colors duration-200">
      {/* Sticky Navigation Header (Exact Stitch Design) */}
      <nav className="sticky top-0 bg-white/90 dark:bg-[#101b1e]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#1e2f34] z-50 transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-8">
            <Link aria-label="CredChain Home" className="flex items-center h-14" to="/">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1" to="/explorer">
                Explorer
              </Link>
              <Link className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1" to="/wallet">
                Wallet
              </Link>
              <Link className="text-teal-700 dark:text-teal-400 font-semibold border-b-2 border-teal-700 dark:border-teal-400 pb-1 py-1" to="/issuer">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            {/* Theme Toggle Button */}
            <button
              aria-label="Toggle theme"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 border border-gray-300 dark:border-[#24393f] bg-white dark:bg-[#0e1a1d] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              id="theme-toggle"
              onClick={toggleTheme}
              type="button"
            >
              <span className="material-symbols-outlined text-base">{isDark ? "light_mode" : "dark_mode"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Form Content */}
      <main className="flex-grow py-8 px-4 sm:px-6">
        {/* Stepper / Breadcrumbs */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <Link to="/issuer" className="hover:text-teal-600 dark:hover:text-teal-400">Issuer Portal</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-semibold">Issue New Credential</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Issue Digital Credential</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Anchor an immutable educational credential, certificate, or title deed onto the Polygon Amoy blockchain.
          </p>
        </div>

      <div className="max-w-2xl mx-auto bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] rounded-xl p-6 sm:p-8 shadow-sm">
        
        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }}>
          
          {/* Credential Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Credential Type
            </label>
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              className="w-full bg-white dark:bg-[#0e1a1d] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            >
              <option value="Degree Certificate">Degree Certificate (Bachelor of Technology / Masters)</option>
              <option value="Land Title Deed">Land Title Deed (Freehold Residential / Commercial)</option>
              <option value="Professional License">Professional License / Board Certification</option>
              <option value="Course Milestone">Course Milestone / Micro-Credential</option>
            </select>
          </div>

          {/* College / Company / Organization Name (Issuing Authority) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="organizationName">
              College / Company / Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organizationName"
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. ABC Institute of Technology, Directorate of Land Records, MIT"
              className="w-full bg-white dark:bg-[#0e1a1d] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This entity will be recorded as the certified issuing authority in the on-chain ledger proof.
            </p>
          </div>

          {/* Holder Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="holderName">
              Holder Name / Identifier
            </label>
            <input
              type="text"
              id="holderName"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Rahul Kumar (Student / Property Owner)"
              className="w-full bg-white dark:bg-[#0e1a1d] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Drag & Drop File Upload Zone */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Supporting Document
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById("fileUpload")?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-[#274047] bg-gray-50/50 dark:bg-[#101e22] hover:bg-gray-100/50 dark:hover:bg-[#14262b] text-gray-600 dark:text-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group"
              id="dropZone"
            >
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors">
                upload_file
              </span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                Drag and drop file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                Sample file formats accepted: PDF, PNG, JPG (up to 10MB)
              </p>
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileInput}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
            </div>

            {/* Uploaded File Badge */}
            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-100 dark:bg-[#14262b] p-3 rounded-lg border border-gray-200 dark:border-[#24393f] mt-2 text-sm">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-base">description</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium truncate">{selectedFile.name}</span>
                </div>
                <button
                  type="button"
                  aria-label="Remove uploaded file"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Issuer Signing Key Field */}
          <div className="space-y-1.5" id="issuerKeyFieldContainer">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="issuerKey">
                Issuer Signing Key / Secret <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">Required for cryptographic hash</span>
            </div>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                id="issuerKey"
                value={issuerKey}
                onChange={(e) => setIssuerKey(e.target.value)}
                placeholder="Enter signing secret or leave blank for authorized demo authority"
                className="w-full bg-white dark:bg-[#0e1a1d] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 pr-11 font-mono text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              />
              <button
                type="button"
                aria-label="Toggle signing key visibility"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showKey ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Progressive Milestone Architecture (SIH 2026 PRD PS26194) */}
          <div className="space-y-3.5 p-4 rounded-xl bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f]">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-base">account_tree</span>
                Progressive Milestone Chaining (PRD PS26194)
              </label>
              <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold border border-teal-500/30">
                Anti-Forgery Engine
              </span>
            </div>

            {/* Issuance Mode Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEventType("FINAL_CERTIFICATE")}
                className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  eventType === "FINAL_CERTIFICATE"
                    ? "bg-[#006064] dark:bg-[#00796b] text-white border-transparent shadow-xs"
                    : "bg-white dark:bg-[#132024] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#274047] hover:border-teal-500"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                Final Degree / Title Deed
              </button>
              <button
                type="button"
                onClick={() => setEventType("MILESTONE")}
                className={`p-2.5 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  eventType === "MILESTONE"
                    ? "bg-[#006064] dark:bg-[#00796b] text-white border-transparent shadow-xs"
                    : "bg-white dark:bg-[#132024] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#274047] hover:border-teal-500"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">flag</span>
                Coursework Milestone
              </button>
            </div>

            {/* Parent Milestone Hash Linker */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Linked Prerequisite Milestone (Parent DID / ID)
                </label>
                <span className="text-[10px] text-gray-400">Leave blank for root milestone</span>
              </div>
              <input
                type="text"
                value={linkedPreviousEventId}
                onChange={(e) => setLinkedPreviousEventId(e.target.value)}
                placeholder="e.g. BTECH-MS-001 or BTECH-MS-002"
                className="w-full bg-white dark:bg-[#132024] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                <span className="text-gray-500 dark:text-gray-400">Quick-link:</span>
                <button
                  type="button"
                  onClick={() => setLinkedPreviousEventId("BTECH-MS-001")}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#24393f] text-teal-600 dark:text-teal-300 hover:border-teal-500 cursor-pointer"
                >
                  Sem 1-4 (BTECH-MS-001)
                </button>
                <button
                  type="button"
                  onClick={() => setLinkedPreviousEventId("BTECH-MS-002")}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#24393f] text-teal-600 dark:text-teal-300 hover:border-teal-500 cursor-pointer"
                >
                  Capstone (BTECH-MS-002)
                </button>
                {linkedPreviousEventId && (
                  <button
                    type="button"
                    onClick={() => setLinkedPreviousEventId("")}
                    className="text-red-500 hover:underline cursor-pointer"
                  >
                    Clear Link
                  </button>
                )}
              </div>
            </div>

            {/* Two-Zone Privacy & AES-256 Encryption Toggle */}
            <div className="pt-2 border-t border-gray-200 dark:border-[#22353a] flex items-start gap-2.5">
              <input
                type="checkbox"
                id="encryptToggle"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="encryptToggle" className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none">
                <span className="font-semibold text-gray-900 dark:text-white">Enable Two-Zone Privacy (AES-256 GCM):</span>{" "}
                Encrypt raw student transcript &amp; PII off-chain. Only cryptographic hashes and zero-knowledge proofs are public on Polygon Amoy.
              </label>
            </div>
          </div>

          {/* Attached Metadata */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300" htmlFor="attachedMetadata">
                Attached Metadata (Optional)
              </label>
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-gray-100 dark:bg-[#1a2c31] text-teal-700 dark:text-teal-400 border border-gray-200 dark:border-[#274047]">
                Example Payload Format
              </span>
            </div>
            <textarea
              id="attachedMetadata"
              value={attachedMetadata}
              onChange={(e) => setAttachedMetadata(e.target.value)}
              rows={3}
              placeholder='{"course": "Advanced Cryptography", "grade": "A"}'
              className="w-full bg-white dark:bg-[#0e1a1d] border border-gray-300 dark:border-[#24393f] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-[#22353a] flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#006064] dark:bg-[#00796b] text-white hover:bg-[#004d40] dark:hover:bg-[#00695c] font-medium text-sm px-6 py-3 rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add_link</span>
              <span>{isSubmitting ? "Broadcasting to Polygon Amoy..." : "Issue Credential"}</span>
            </button>
          </div>
        </form>

        {/* Success State Panel */}
        {successResult && (
          <div className="flex flex-col mt-6 p-6 rounded-xl border border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-950/20" id="successPanel">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-200 dark:border-emerald-900">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white">
                <span className="material-symbols-outlined text-base font-bold">check</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issuance Successful</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              The cryptographic proof has been successfully anchored to Polygon Amoy and routed to the holder for formal acceptance into their digital wallet.
            </p>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Credential ID
                </span>
                <div className="bg-white dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2.5 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-mono text-gray-800 dark:text-gray-200 font-bold">
                    {successResult.credential.credential_id}
                  </span>
                  <Link
                    to={`/verify?id=${successResult.credential.credential_id}`}
                    className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                  >
                    Verify Live →
                  </Link>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Transaction Hash
                </span>
                <div className="bg-white dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2.5 rounded-lg flex justify-between items-center group">
                  <span className="text-xs font-mono text-gray-800 dark:text-gray-200 truncate mr-2">
                    {successResult.blockchainTx.txHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(successResult.blockchainTx.txHash)}
                    className="text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  IPFS Content URI
                </span>
                <div className="bg-white dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2.5 rounded-lg flex justify-between items-center group">
                  <span className="text-xs font-mono text-gray-800 dark:text-gray-200 truncate mr-2">
                    ipfs://{successResult.credential.pinata_cid}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`ipfs://${successResult.credential.pinata_cid}`)}
                    className="text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Expected Output Preview (Mock Example) — How Results Will Look After Completion */}
      <div className="max-w-2xl mx-auto mt-8 border-2 border-dashed border-teal-700/30 dark:border-[#274047] bg-gray-50/70 dark:bg-[#101e22]/60 rounded-xl p-6 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-[#22353a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-lg">visibility</span>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Expected Output Preview (Mock Example) — How Results Will Look After Completion
            </h3>
          </div>
          <span className="px-2 py-0.5 self-start sm:self-auto rounded bg-teal-700/10 dark:bg-teal-400/10 text-teal-700 dark:text-teal-400 text-[10px] font-mono font-bold tracking-wider border border-teal-700/20 dark:border-teal-400/20">
            MOCK PREVIEW FORMAT
          </span>
        </div>

        <div className="p-3 mb-4 rounded-lg bg-white dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <strong className="text-gray-800 dark:text-gray-200">Note:</strong> Active form inputs above are clean and blank for real input. The cryptographic receipts, Merkle proof anchor, and IPFS identifier below illustrate what will generate after you submit and sign the transaction.
        </div>

        <div className="bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100 dark:border-[#1e2f34]">
            <span className="font-medium text-gray-600 dark:text-gray-400">Ledger Status:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-mono text-[11px] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span> Immutable Record Verified
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Example Tx Hash
            </span>
            <div className="bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              0x8f7601f07d2c3dfb8782a201c8088018e69888be6201b17d05775f0fbeae5692
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Example SHA-256 Digest / Root
            </span>
            <div className="bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              0x3a45c2635e07662cf05051d9ebf52a7ccca84347ec0ea29505876febeac84f7b
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Example IPFS URI
            </span>
            <div className="bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] max-w-md w-full p-6 rounded-xl shadow-2xl space-y-5 transition-colors">
            <div className="flex justify-between items-start border-b border-gray-200 dark:border-[#22353a] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-xl">gavel</span>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Confirm Immutable Issuance</h3>
              </div>
              <button
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              You are about to anchor a cryptographic proof for <strong>{holderName || "Rahul Kumar"}</strong> to the Polygon Amoy blockchain. This proof cannot be modified or deleted.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeIssue}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#006064] text-white hover:bg-[#004d40]"
              >
                Confirm & Sign on Amoy
              </button>
            </div>
          </div>
        </div>
      )}

      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="mt-auto border-t border-gray-200 dark:border-[#1e2f34] bg-white dark:bg-[#101b1e] py-6 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>© 2026 CredChain Ledger. Built on open standards.</div>
          <div className="flex items-center gap-6">
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Smart Contract Registry
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
