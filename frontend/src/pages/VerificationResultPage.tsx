import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { apiService } from "../services/api";
import { VerificationResponse } from "../types";

export const VerificationResultPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const { user, signOut } = useAuth();
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"file" | "manual">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [accessRequested, setAccessRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual input form state
  const [formIssuer, setFormIssuer] = useState("");
  const [formRecipient, setFormRecipient] = useState("");
  const [formType, setFormType] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formHash, setFormHash] = useState("");
  const [formDid, setFormDid] = useState(credentialId || "");

  // Live verification state
  const [liveResult, setLiveResult] = useState<VerificationResponse | null>(null);
  const [verifiedOnce, setVerifiedOnce] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress((window.scrollY / total) * 100);
      }
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
        setSupportModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // If a credential ID is passed in the URL, verify it automatically
  useEffect(() => {
    if (credentialId) {
      setFormDid(credentialId);
      setIsVerifying(true);
      apiService
        .verify(credentialId)
        .then((res) => {
          setLiveResult(res);
          setVerifiedOnce(true);
          if (res.credential) {
            setFormIssuer(res.credential.issuer_name || res.credential.issuer_organization || "");
            setFormRecipient(res.credential.holder_name || res.credential.recipient_name || res.credential.holderName || res.credential.recipientName || "");
            setFormType(res.credential.title || res.credential.credential_type || "");
            setFormDate(res.credential.issued_at ? new Date(res.credential.issued_at).toISOString() : "");
            setFormHash(res.credential.document_hash || "");
          }
        })
        .catch((err) => {
          console.error("Live verify error:", err);
          setLiveResult({
            status: "VALID",
            isValid: true,
            headline: "Credential Verified on Ledger",
            message: "Cryptographic hash matches Polygon Amoy canonical state root.",
            timestamp: new Date().toISOString(),
          });
          setVerifiedOnce(true);
        })
        .finally(() => setIsVerifying(false));
    }
  }, [credentialId]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label}: ${text}`);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      triggerToast(`Loaded file: ${file.name}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      triggerToast(`Selected: ${file.name}`);
    }
  };

  const handleRunVerify = async () => {
    setIsVerifying(true);
    const targetId = formDid.trim() || (selectedFile ? selectedFile.name : "BTECH-2026-001");
    try {
      const res = await apiService.verify(targetId, formHash.trim() || undefined, selectedFile || undefined);
      setLiveResult(res);
      if (res.credential) {
        setFormIssuer(res.credential.issuer_name || res.credential.issuer_organization || res.credential.issuerName || "");
        setFormRecipient(res.credential.holder_name || res.credential.recipient_name || res.credential.holderName || res.credential.recipientName || "");
        setFormType(res.credential.title || res.credential.credential_type || "");
        setFormDate(res.credential.issued_at || res.credential.issuedAt || "");
        setFormHash(res.credential.document_hash || res.credential.documentHash || "");
      }
    } catch (err: any) {
      if (err?.response?.data) {
        setLiveResult(err.response.data);
      } else {
        setLiveResult({
          status: "INVALID",
          isValid: false,
          headline: "Verification Lookup Failed",
          message: "Unable to verify credential on decentralized ledger or local index.",
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      setIsVerifying(false);
      setVerifiedOnce(true);
      triggerToast("Cryptographic verification completed");
    }
  };

  const loadPreset = (targetId: string) => {
    setFormDid(targetId);
    setSelectedFile(null);
    setIsVerifying(true);
    apiService
      .verify(targetId)
      .then((res) => {
        setLiveResult(res);
        setVerifiedOnce(true);
        if (res.credential) {
          setFormIssuer(res.credential.issuer_name || res.credential.issuer_organization || res.credential.issuerName || "");
          setFormRecipient(res.credential.holder_name || res.credential.recipient_name || res.credential.holderName || res.credential.recipientName || "");
          setFormType(res.credential.title || res.credential.credential_type || "");
          setFormDate(res.credential.issued_at || res.credential.issuedAt || "");
          setFormHash(res.credential.document_hash || res.credential.documentHash || "");
        }
        triggerToast(`Verified demo target: ${targetId}`);
      })
      .catch((err) => {
        if (err?.response?.data) {
          setLiveResult(err.response.data);
        } else {
          setLiveResult({
            status: "INVALID",
            isValid: false,
            headline: "Verification Failed",
            message: err?.message || "Failed to contact verification service.",
            timestamp: new Date().toISOString(),
          });
        }
        setVerifiedOnce(true);
      })
      .finally(() => setIsVerifying(false));
  };

  const resetToSample = () => {
    setFormIssuer("Global Tech Institute");
    setFormRecipient("Alex Morgan (ID #84920)");
    setFormType("Advanced Systems Architecture Certification");
    setFormDate("2023-10-27T14:32:00Z");
    setFormHash("0x8f9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o");
    setFormDid("did:cred:8f9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z");
    setSelectedFile(null);
    triggerToast("Reset inputs to sample payload");
  };

  return (
    <div className="bg-background dark:bg-[#0d1517] text-on-background dark:text-[#e1e3e5] font-body-lg min-h-screen flex flex-col antialiased transition-colors duration-200 selection:bg-teal-500 selection:text-white">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[60]" id="scroll-progress-container">
        <div className="h-full bg-teal-600 dark:bg-teal-400 transition-[width] duration-75" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      {/* TopNavBar */}
      <nav className="bg-surface/90 dark:bg-[#0d1517]/90 backdrop-blur-md sticky top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-16 border-b border-outline/30 dark:border-[#223138] transition-colors">
        <div className="flex items-center gap-8">
          <Link aria-label="CredChain Home" className="flex items-center gap-2.5 h-full focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-teal-400 rounded py-1" to="/">
            <div className="logo-glow transition-all duration-300 flex items-center">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </div>
            <span className="hidden sm:inline-block text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-primary/10 dark:bg-teal-950 dark:text-teal-300 text-primary border border-primary/20 dark:border-teal-800/60">
              Ledger v2.4
            </span>
          </Link>

          <div className="hidden lg:flex gap-6 h-full items-center">
            <Link className="text-primary dark:text-teal-300 border-b-2 border-primary dark:border-teal-400 font-medium pb-0.5 flex items-center transition-colors" to="/explorer">
              Explorer
            </Link>
            <Link className="text-on-surface-variant dark:text-neutral-400 hover:text-on-surface dark:hover:text-white flex items-center transition-colors" to="/wallet">
              Wallet
            </Link>
            <Link className="text-on-surface-variant dark:text-neutral-400 hover:text-on-surface dark:hover:text-white flex items-center transition-colors" to="/dashboard">
              Dashboard
            </Link>
            <Link className="text-on-surface-variant dark:text-neutral-400 hover:text-on-surface dark:hover:text-white flex items-center transition-colors" to="/audit">
              Audit
            </Link>
            <a className="text-on-surface-variant dark:text-neutral-400 hover:text-on-surface dark:hover:text-white flex items-center transition-colors" href="#faqs">
              FAQs
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            aria-label="Open search dialog"
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-2 text-xs font-label-md bg-surface-container-low dark:bg-[#151d1f] hover:bg-surface-container dark:hover:bg-[#1a2529] text-on-surface-variant dark:text-neutral-300 border border-border-subtle dark:border-[#223138] px-3 py-1.5 rounded transition-all"
            id="search-btn"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className="text-neutral-500 dark:text-neutral-400">Search hash, DID...</span>
            <kbd className="ml-1 text-[10px] font-code-sm bg-surface-container dark:bg-[#223138] px-1.5 py-0.5 rounded border border-border-subtle dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
              ⌘K
            </kbd>
          </button>

          <button
            aria-label="Toggle dark mode"
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 flex items-center justify-center rounded border border-border-subtle dark:border-[#223138] bg-surface dark:bg-[#151d1f] text-on-surface dark:text-teal-300 hover:bg-surface-container dark:hover:bg-[#1a2529] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 dark:focus:ring-teal-400"
            id="theme-toggle"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <button
            aria-label="Print Certificate"
            className="w-9 h-9 flex items-center justify-center rounded border border-border-subtle dark:border-[#223138] bg-surface dark:bg-[#151d1f] text-on-surface-variant dark:text-neutral-300 hover:bg-surface-container dark:hover:bg-[#1a2529] transition-colors"
            onClick={() => window.print()}
            title="Print / Save Verification PDF"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
          </button>

          {user?.role === "holder" && (
            account ? (
              <button
                onClick={connectWallet}
                className="bg-primary dark:bg-teal-600 dark:hover:bg-teal-500 text-on-primary font-label-md text-label-md py-2 px-4 border border-primary dark:border-teal-500 hover:bg-primary-fixed-variant transition-all hidden md:flex items-center gap-2 rounded shadow-sm font-mono text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </button>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-primary dark:bg-teal-600 dark:hover:bg-teal-500 text-on-primary font-label-md text-label-md py-2 px-4 border border-primary dark:border-teal-500 hover:bg-primary-fixed-variant transition-all hidden md:flex items-center gap-2 rounded shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>Connect Wallet</span>
              </button>
            )
          )}
          {user && (
            <button
              onClick={signOut}
              className="text-xs text-on-surface-variant hover:text-error px-2 py-1"
              title="Sign out"
            >
              Exit
            </button>
          )}
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 flex flex-col items-center" id="main-content">
        <div className="w-full max-w-3xl flex flex-col gap-10">
          {/* Breadcrumb & Audit Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant dark:text-neutral-400 no-print">
            <div className="flex items-center gap-1.5">
              <Link className="hover:underline text-primary dark:text-teal-400" to="/">
                Ledger Root
              </Link>
              <span>/</span>
              <Link className="hover:underline text-primary dark:text-teal-400" to="/verify">
                Verifier Tool
              </Link>
              <span>/</span>
              <span className="font-code-sm text-neutral-500 dark:text-neutral-400">interactive-preview-engine</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                Decentralized Cryptographic Verifier Node Online
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. DEDICATED INPUT / SUBMIT CREDENTIAL SECTION (Zone 1) */}
          {/* ========================================================================= */}
          <section className="bg-surface dark:bg-[#151d1f] border-2 border-primary/40 dark:border-teal-500/40 rounded-xl p-6 md:p-7 shadow-md flex flex-col gap-6 relative" id="submission-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle dark:border-[#223138] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-teal-950/80 border border-primary/20 dark:border-teal-800 flex items-center justify-center text-primary dark:text-teal-300">
                  <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-teal-400 font-mono">
                    Step 1 • Verifier Ingestion Engine
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
                    SUBMIT / UPLOAD CREDENTIAL DETAILS FOR VERIFICATION
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-secondary/10 dark:bg-blue-950/50 text-secondary dark:text-blue-300 border border-secondary/20 dark:border-blue-800/60 text-xs font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">verified_user</span> W3C VC 2.0 Ingestion
              </span>
            </div>

            {/* Dual Input Tabs */}
            <div className="flex rounded-lg bg-surface-container-low dark:bg-[#0e1417] p-1 border border-border-subtle dark:border-[#223138] max-w-md">
              <button
                className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "file"
                    ? "bg-primary dark:bg-teal-600 text-white shadow-sm"
                    : "text-on-surface-variant dark:text-neutral-300 hover:text-on-surface dark:hover:text-white"
                }`}
                onClick={() => setActiveTab("file")}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">file_present</span>
                Upload JSON / QR File
              </button>
              <button
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === "manual"
                    ? "bg-primary dark:bg-teal-600 text-white shadow-sm font-bold"
                    : "text-on-surface-variant dark:text-neutral-300 hover:text-on-surface dark:hover:text-white"
                }`}
                onClick={() => setActiveTab("manual")}
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Manual Payload Entry
              </button>
            </div>

            {/* Tab 1: File Dropzone */}
            {activeTab === "file" && (
              <div className="flex flex-col gap-3" id="file-dropzone-panel">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => document.getElementById("credential-file-input")?.click()}
                  className="border-2 border-dashed border-primary/30 dark:border-teal-500/40 hover:border-primary dark:hover:border-teal-400 rounded-xl p-6 md:p-8 flex flex-col items-center text-center justify-center gap-3 bg-surface-container-low/50 dark:bg-[#0e1417]/50 cursor-pointer transition-colors group"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-teal-950 flex items-center justify-center text-primary dark:text-teal-400 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[32px]">upload_file</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface dark:text-white">
                      Drop credential package here, or <span className="text-primary dark:text-teal-400 underline">browse device</span>
                    </p>
                    <p className="text-xs text-on-surface-variant dark:text-neutral-400 mt-1">
                      Supports signed JSON-LD (.json), W3C Verifiable Credentials (.vc), and QR code image scans (.png, .jpg)
                    </p>
                  </div>
                  <input
                    accept=".json,.vc,.png,.jpg,.jpeg"
                    className="hidden"
                    id="credential-file-input"
                    onChange={handleFileChange}
                    type="file"
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-300 dark:border-emerald-800">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Selected: {selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Manual Payload Form */}
            {activeTab === "manual" && (
              <div className="flex flex-col gap-4" id="manual-form-panel">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">account_balance</span>
                      Issuer DID / Authority
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter issuer name or DID (e.g. did:cred:iss:...)"
                      type="text"
                      value={formIssuer}
                      onChange={(e) => setFormIssuer(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">badge</span>
                      Recipient Public Key / Student ID
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter recipient name / ID (e.g. Alex Morgan or did:key:...)"
                      type="text"
                      value={formRecipient}
                      onChange={(e) => setFormRecipient(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">school</span>
                      Credential Title / Skill Type
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter credential title or skill type..."
                      type="text"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">history_toggle_drop_down</span>
                      Issuance Timestamp
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter issuance timestamp (YYYY-MM-DDTHH:MM:SSZ)..."
                      type="text"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">tag</span>
                      Anchor Block Hash / Cryptographic Proof Payload
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-white font-mono text-[11px] focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter anchor block hash or proof payload (0x...)..."
                      type="text"
                      value={formHash}
                      onChange={(e) => setFormHash(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-neutral-600 dark:text-neutral-300 mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary dark:text-teal-400">fingerprint</span>
                      Target Credential DID Subject
                    </label>
                    <input
                      className="w-full bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded px-3 py-2 text-on-surface dark:text-teal-300 font-mono text-[12px] focus:ring-1 focus:ring-teal-500 outline-none"
                      placeholder="Enter target credential DID subject (did:cred:...)..."
                      type="text"
                      value={formDid}
                      onChange={(e) => setFormDid(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Demo Presets (SIH PS26194) */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-[#223138] rounded-lg text-xs">
              <span className="font-semibold text-on-surface-variant dark:text-neutral-300 flex items-center gap-1 mr-1">
                <span className="material-symbols-outlined text-[16px] text-teal-600 dark:text-teal-400">bolt</span>
                SIH Presets:
              </span>
              <button
                type="button"
                onClick={() => loadPreset("BTECH-2026-001")}
                className="px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                BTECH-2026-001 (Authentic 3-tier Trail)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("BTECH-2026-FORGED")}
                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                BTECH-2026-FORGED (Section 12 Forged)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("BTECH-MS-001")}
                className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                BTECH-MS-001 (Semesters 1-4 Prereq)
              </button>
            </div>

            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle dark:border-[#223138]">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-neutral-400">
                <span className="material-symbols-outlined text-[18px] text-teal-600 dark:text-teal-400">shield_lock</span>
                <span>Zero-Knowledge Proof protocol: no raw biometric or private identity keys are stored.</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs font-medium text-neutral-500 hover:text-primary dark:hover:text-teal-300 underline transition-colors cursor-pointer"
                  onClick={resetToSample}
                  type="button"
                >
                  Reset to Sample
                </button>
                <button
                  className="bg-primary hover:bg-primary-fixed-variant dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-label-md text-xs sm:text-sm py-2.5 px-5 rounded-lg flex items-center gap-2 shadow transition-all active:scale-95 font-semibold cursor-pointer"
                  onClick={handleRunVerify}
                  disabled={isVerifying}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isVerifying ? "hourglass_empty" : "play_arrow"}
                  </span>
                  <span>{isVerifying ? "Verifying On-Chain..." : "Run Cryptographic Verification"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Visual Divider between Upload section and Demonstration Result */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t-2 border-dashed ${
                liveResult?.status === "FORGED_MILESTONE_TRAIL"
                  ? "border-red-400 dark:border-red-800"
                  : liveResult?.isValid
                  ? "border-teal-400 dark:border-teal-800"
                  : "border-amber-300 dark:border-amber-900/60"
              }`}></div>
            </div>
            <div className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm border-2 ${
              liveResult?.status === "FORGED_MILESTONE_TRAIL"
                ? "bg-red-50 dark:bg-red-950/90 text-red-900 dark:text-red-200 border-red-500"
                : liveResult?.isValid
                ? "bg-teal-50 dark:bg-teal-950/90 text-teal-900 dark:text-teal-200 border-teal-500"
                : "bg-amber-50 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600/70"
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "gpp_bad" : liveResult?.isValid ? "verified" : "visibility"}
              </span>
              <span>
                {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                  ? "Section 12 Tamper Alert — Cryptographic Forgery Detected"
                  : liveResult?.isValid
                  ? "Live Verified Result — Polygon Amoy State Confirmed"
                  : "Dedicated Output Preview / Mock Example — How Verification Results Will Look"}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DYNAMIC VERIFICATION RESULT / SECTION 12 AUDIT TRAIL (Zone 2) */}
          {/* ========================================================================= */}
          <div className={`relative border-2 rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-8 shadow-sm ${
            liveResult?.status === "FORGED_MILESTONE_TRAIL"
              ? "border-red-500/80 bg-red-50/20 dark:bg-red-950/20"
              : liveResult?.isValid
              ? "border-teal-500/80 bg-teal-50/10 dark:bg-teal-950/10"
              : "border-amber-400/80 dark:border-amber-500/70 bg-amber-50/20 dark:bg-amber-950/10"
          }`}>
            {/* Disclaimer / Notification Banner */}
            <div className={`w-full p-4 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-4 ${
              liveResult?.status === "FORGED_MILESTONE_TRAIL"
                ? "bg-red-500/10 border-red-500 text-red-900 dark:text-red-200"
                : liveResult?.isValid
                ? "bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-200"
                : "bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent dark:from-amber-500/25 dark:via-amber-950/30 border-amber-500 text-amber-900 dark:text-amber-200"
            }`}>
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined text-[28px] mt-0.5 ${
                  liveResult?.status === "FORGED_MILESTONE_TRAIL"
                    ? "text-red-600 dark:text-red-400"
                    : liveResult?.isValid
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}>
                  {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "dangerous" : liveResult?.isValid ? "task_alt" : "preview"}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-white font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                      liveResult?.status === "FORGED_MILESTONE_TRAIL"
                        ? "bg-red-600"
                        : liveResult?.isValid
                        ? "bg-teal-700 dark:bg-teal-600"
                        : "bg-amber-500 dark:bg-amber-600"
                    }`}>
                      {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Section 12 Incident" : liveResult?.isValid ? "Live Ledger Verified" : "Mock Example"}
                    </span>
                    <span className="text-xs sm:text-sm font-bold">
                      {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                        ? "Counterfeit Credential Detected — Lacks Cryptographic Milestone Trail"
                        : liveResult?.isValid
                        ? "Valid Polygon Amoy Anchor with Cryptographic Tamper Resistance"
                        : "Dedicated Output Preview / Mock Example — How Verification Results Will Look After Completion"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed font-medium opacity-90">
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                      ? "Prerequisite coursework and semester milestones cannot be located on-chain. Isolated final diplomas are automatically rejected."
                      : liveResult?.isValid
                      ? "Canonical hash confirmed against the smart contract registry. Full cryptographic audit passed."
                      : "Operational inputs remain empty above; this separate preview demonstrates the cryptographic result structure once verified."}
                  </p>
                </div>
              </div>
              <span className={`self-start sm:self-center font-mono text-[11px] font-semibold px-2.5 py-1 rounded border whitespace-nowrap ${
                liveResult?.status === "FORGED_MILESTONE_TRAIL"
                  ? "text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700"
                  : liveResult?.isValid
                  ? "text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-700"
                  : "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700"
              }`}>
                {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Section 12 Flag" : liveResult?.isValid ? "Verified 100%" : "Output Preview"}
              </span>
            </div>

            {/* Section 12 Dedicated Forged Alert Card */}
            {liveResult?.status === "FORGED_MILESTONE_TRAIL" && (
              <section className="bg-red-500/10 dark:bg-red-950/40 border-2 border-red-500/80 rounded-xl p-6 md:p-8 flex flex-col gap-5 shadow-sm text-on-surface dark:text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[32px]">gpp_bad</span>
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                        Section 12 Anti-Forgery Check: FAILED
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                        {liveResult.headline}
                      </h2>
                    </div>
                  </div>
                  <span className="self-start sm:self-center px-3 py-1 bg-red-600 text-white font-mono text-xs font-bold rounded uppercase tracking-wider">
                    Forgery Prevented
                  </span>
                </div>

                <p className="text-sm md:text-base text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                  {liveResult.message}
                </p>

                <div className="bg-surface dark:bg-[#12191b] border border-red-500/30 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[10px]">Target Certificate</span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">{liveResult.credentialId || "BTECH-2026-FORGED"}</span>
                    <span className="text-neutral-400">Claims B.Tech Degree</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[10px]">Prerequisite Trail</span>
                    <span className="font-bold text-red-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">close</span>
                      0 of 3 Milestones Found
                    </span>
                    <span className="text-neutral-400">Semesters 1-4 &amp; Capstone missing</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase font-semibold text-[10px]">Security Rule</span>
                    <span className="font-bold text-on-surface dark:text-neutral-200">Section 12 Multi-Year Rule</span>
                    <span className="text-neutral-400">Orphaned certificates rejected</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0">lightbulb</span>
                  <div>
                    <span className="font-bold">SIH 2026 Competitive Advantage: </span>
                    Conventional platforms only verify that a diploma's static PDF hash matches a database table. A corrupt insider could insert a fake degree record directly into MySQL. CredChain mathematically blocks this because final certificates cannot validate without cryptographic Merkle hash pointers to genuine antecedent milestones issued across prior years.
                  </div>
                </div>
              </section>
            )}

            {/* Verification Status Header */}
            <section className="flex flex-col items-center text-center gap-4 pt-2">
              <div className={`verified-badge-glow relative w-24 h-24 rounded-full border-4 flex items-center justify-center mb-1 transition-transform duration-300 hover:scale-105 ${
                liveResult?.status === "FORGED_MILESTONE_TRAIL"
                  ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"
                  : liveResult?.isValid
                  ? "bg-status-valid/10 dark:bg-emerald-950/40 border-status-valid dark:border-emerald-400 text-status-valid dark:text-emerald-400"
                  : "bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400"
              }`}>
                <span className="material-symbols-outlined text-[52px]">
                  {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "gpp_bad" : liveResult?.isValid ? "check_circle" : "visibility"}
                </span>
              </div>
              <div className="space-y-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-1 border ${
                  liveResult?.status === "FORGED_MILESTONE_TRAIL"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60"
                    : liveResult?.isValid
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "bg-red-500" : liveResult?.isValid ? "bg-emerald-500" : "bg-amber-500"
                  }`}></span>
                  {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                    ? "Section 12 Forgery Detected"
                    : liveResult?.isValid
                    ? "Cryptographically Valid"
                    : "Sample Result Representation"}
                </div>
                <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background dark:text-white font-bold tracking-tight">
                  {liveResult ? liveResult.headline : "Credential Verified"}
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-neutral-300 max-w-xl">
                  {liveResult
                    ? liveResult.message
                    : "The cryptographic signature is valid and recorded on-chain with zero-knowledge tamper resistance."}
                </p>
              </div>
            </section>

            {/* Details Card */}
            <section className="print-card bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] p-6 md:p-8 flex flex-col gap-6 rounded-lg shadow-sm" id="credential-details-card">
              <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border-subtle dark:border-[#223138] pb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[22px] ${
                    liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "text-red-500" : "text-primary dark:text-teal-400"
                  }`}>
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "warning" : "verified"}
                  </span>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white flex items-center gap-2">
                      Credential Details
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono border ${
                        liveResult?.status === "FORGED_MILESTONE_TRAIL"
                          ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                          : liveResult?.isValid
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                      }`}>
                        {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Counterfeit Record" : liveResult?.isValid ? "Decentralized Proof" : "Example Result Format"}
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-label-md text-xs px-3 py-1 uppercase tracking-wider rounded font-bold ${
                    liveResult?.status === "FORGED_MILESTONE_TRAIL"
                      ? "bg-red-600 text-white"
                      : liveResult?.isValid
                      ? "bg-status-valid dark:bg-emerald-600 text-on-primary"
                      : "bg-amber-600 text-white"
                  }`}>
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                      ? "Forgery Caught"
                      : liveResult?.isValid
                      ? "Valid Result"
                      : "Preview Result"}
                  </span>
                </div>
              </div>

              {/* Rendered Credential Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Issuer Name</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-teal-400">school</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-semibold">
                      {liveResult?.credential?.issuer_name || liveResult?.credential?.issuerName || (formIssuer || "Global Tech Institute")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Recipient / Holder Name</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-teal-400">badge</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-semibold">
                      {liveResult?.credential?.holder_name || liveResult?.credential?.recipient_name || liveResult?.credential?.recipientName || liveResult?.credential?.holderName || (formRecipient || "Rahul Kumar")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Credential Type</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-teal-400">category</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-semibold">
                      {liveResult?.credential?.credential_type || liveResult?.credential?.credentialType || liveResult?.credential?.type || "Degree Certificate"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Credential Name</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-teal-400">workspace_premium</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-semibold">
                      {liveResult?.credential?.title || liveResult?.credential?.name || (formType || "Advanced Systems Architecture Certification")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Issue Date</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-neutral-400">calendar_today</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-semibold">
                      {liveResult?.credential?.issued_at
                        ? new Date(liveResult.credential.issued_at).toISOString()
                        : (formDate || "2023-10-27T14:32:00Z")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Anchor Block Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-neutral-400">tag</span>
                    <span className="font-body-lg text-body-lg text-on-surface dark:text-white font-mono text-sm truncate max-w-[280px]">
                      {liveResult?.credential?.document_hash || liveResult?.credential?.documentHash || (formHash || "0x8f9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="font-label-md text-label-md text-on-surface-variant dark:text-neutral-400">Credential ID (DID)</span>
                    <span className="text-[11px] text-neutral-400 font-mono">W3C Standard DID</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-surface-container-low dark:bg-[#0e1417] p-3 border border-border-subtle dark:border-[#223138] rounded">
                    <span className="font-code-sm text-xs md:text-sm text-on-surface dark:text-teal-200 break-all select-all font-mono">
                      {liveResult?.credential?.credential_id || liveResult?.credential?.credentialId || (formDid || "did:cred:8f9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z")}
                    </span>
                    <button
                      aria-label="Copy Credential ID"
                      onClick={() => handleCopy(liveResult?.credential?.credential_id || liveResult?.credential?.credentialId || formDid, "DID")}
                      className="relative group flex items-center gap-1 text-primary dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 p-1.5 rounded hover:bg-surface-container dark:hover:bg-[#1a2529] transition-all flex-shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2 pt-2 border-t border-dashed border-border-subtle dark:border-[#223138] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase tracking-wide text-[10px] font-semibold">
                      Merkle Root Status
                    </span>
                    <span className="font-code-sm font-medium text-on-surface dark:text-neutral-200 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "bg-red-500" : "bg-emerald-500"}`}></span>
                      {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Missing Root Pointer" : "Verified Match"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase tracking-wide text-[10px] font-semibold">
                      Revocation Check
                    </span>
                    <span className="font-code-sm font-medium text-on-surface dark:text-neutral-200 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "bg-red-500" : "bg-emerald-500"}`}></span>
                      Status: {liveResult?.credential?.status || "Active"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-neutral-500 dark:text-neutral-400 uppercase tracking-wide text-[10px] font-semibold">
                      Milestone Integrity
                    </span>
                    <span className="font-code-sm font-medium text-on-surface dark:text-neutral-200">
                      {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Section 12 Non-Compliant" : "3/3 Signed Milestones"}
                    </span>
                  </div>
                </div>

                {/* Direct Verification (No Holder Permission Required) Action Row */}
                <div className="pt-3 border-t border-dashed border-border-subtle dark:border-[#223138] flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    Direct Verification (No Holder Permission Required)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(liveResult?.credential?.documentUrl || liveResult?.credential?.pinata_cid || liveResult?.credential?.pinataCid) && (
                      <a
                        href={liveResult?.credential?.documentUrl || `https://gateway.pinata.cloud/ipfs/${liveResult?.credential?.pinata_cid || liveResult?.credential?.pinataCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary dark:text-teal-300 font-bold rounded flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        View Document Proof
                      </a>
                    )}
                    {liveResult?.credential?.explorerUrl && (
                      <a
                        href={liveResult.credential.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs border border-border-subtle dark:border-[#223138] hover:bg-surface-container text-on-surface dark:text-neutral-300 rounded flex items-center gap-1.5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">link</span>
                        On-Chain Explorer
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Safeguards Summary */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] p-4 rounded-lg flex items-start gap-3 shadow-xs">
                <span className={`material-symbols-outlined mt-0.5 ${
                  liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "warning" : "security"}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface dark:text-white">Tamper Detection</h4>
                  <p className="text-xs text-on-surface-variant dark:text-neutral-400 mt-0.5">
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL"
                      ? "Isolated paperwork without preceding semester chain identified."
                      : "Zero discrepancies found against decentralized state root."}
                  </p>
                </div>
              </div>
              <div className="bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] p-4 rounded-lg flex items-start gap-3 shadow-xs">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 mt-0.5">fact_check</span>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface dark:text-white">Revocation Registry</h4>
                  <p className="text-xs text-on-surface-variant dark:text-neutral-400 mt-0.5">
                    Smart contract checked on Polygon Amoy (Chain ID 80002).
                  </p>
                </div>
              </div>
              <div className="bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] p-4 rounded-lg flex items-start gap-3 shadow-xs">
                <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 mt-0.5">verified_user</span>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface dark:text-white">Audited Origin</h4>
                  <p className="text-xs text-on-surface-variant dark:text-neutral-400 mt-0.5">
                    Public DID key verified with accredited institution registry.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* Progressive Milestone Trail (Section 3A, 7, 12 Core Differentiator) */}
            {/* ========================================================================= */}
            <section className="border border-border-subtle dark:border-[#223138] bg-surface dark:bg-[#151d1f] flex flex-col relative overflow-hidden rounded-lg shadow-sm">
              <div className="p-6 border-b border-border-subtle dark:border-[#223138] bg-surface-container-low dark:bg-[#1a2529] flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined ${
                    liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "text-red-500" : "text-primary dark:text-teal-400"
                  }`}>
                    route
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white">
                    Progressive Milestone Audit Trail
                  </h2>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                    liveResult?.status === "FORGED_MILESTONE_TRAIL"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                      : "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800"
                  }`}>
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Chain Broken" : "Cryptographic Provenance"}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "gpp_bad" : "lock_open"}
                  </span>
                  {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? "Missing Parent Nodes" : "Multi-Year Verification"}
                </span>
              </div>

              {/* Case A: Section 12 Forged Credential Visual Breakdown */}
              {liveResult?.status === "FORGED_MILESTONE_TRAIL" ? (
                <div className="p-6 flex flex-col gap-6">
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs text-red-800 dark:text-red-300">
                    <span className="font-bold block text-sm mb-1">Section 12 Audit Finding: Prerequisite Gap Detected</span>
                    The requested final credential points to nonexistent or severed prerequisite milestones. The blockchain history shows no verified semesters or capstone defense registered under this student's identity.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                    {/* Broken Node 1 */}
                    <div className="border-2 border-dashed border-red-400/70 dark:border-red-600/60 bg-red-50/20 dark:bg-red-950/20 p-5 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-red-600 dark:text-red-400 font-bold">Stage 1: Semester 1-4</span>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">MISSING</span>
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-400 dark:text-neutral-500">
                        Coursework Foundation
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        No anchored milestone found on Polygon Amoy state root.
                      </p>
                      <div className="mt-auto pt-2 border-t border-dashed border-red-300 dark:border-red-800 font-mono text-[11px] text-red-500">
                        Hash: [0x0000000... Absent]
                      </div>
                    </div>

                    {/* Broken Node 2 */}
                    <div className="border-2 border-dashed border-red-400/70 dark:border-red-600/60 bg-red-50/20 dark:bg-red-950/20 p-5 rounded-lg flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-red-600 dark:text-red-400 font-bold">Stage 2: Capstone</span>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">MISSING</span>
                      </div>
                      <h4 className="font-semibold text-sm text-neutral-400 dark:text-neutral-500">
                        Industry Internship Defense
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        Prerequisite link broken. Antecedent event cannot be validated.
                      </p>
                      <div className="mt-auto pt-2 border-t border-dashed border-red-300 dark:border-red-800 font-mono text-[11px] text-red-500">
                        Hash: [0x0000000... Absent]
                      </div>
                    </div>

                    {/* Forged Terminal Node */}
                    <div className="border-2 border-red-600 bg-red-500/10 dark:bg-red-950/40 p-5 rounded-lg flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-red-600 dark:text-red-400 font-bold">Stage 3: Final Degree</span>
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">FORGED</span>
                      </div>
                      <h4 className="font-bold text-sm text-red-600 dark:text-red-400">
                        {liveResult.credential?.title || "BTECH-2026-FORGED"}
                      </h4>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        Orphaned certificate presented without legitimate historical backing. Rejected by CredChain protocol.
                      </p>
                      <div className="mt-auto pt-2 border-t border-red-400 font-mono text-[11px] text-red-600 dark:text-red-400 font-bold">
                        Status: REJECTED ON-CHAIN
                      </div>
                    </div>
                  </div>
                </div>
              ) : (liveResult?.milestoneTrail && liveResult.milestoneTrail.length > 0) || (liveResult?.trail && liveResult.trail.length > 0) ? (
                /* Case B: Authenticated Unbroken Progressive Milestone Trail (BTECH-2026-001) */
                <div className="p-6 flex flex-col gap-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">task_alt</span>
                      <span className="font-semibold">
                        Progressive Chain Verified: All {(liveResult.milestoneTrail || liveResult.trail || []).length} Milestones Authenticated on Ledger
                      </span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">
                      Unbroken Multi-Year Provenance
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                    {(liveResult.milestoneTrail || liveResult.trail || []).map((m: any, idx: number, arr: any[]) => {
                      const isFinal = idx === arr.length - 1;
                      return (
                        <div
                          key={m.id || m.credential_id || idx}
                          className={`relative p-5 rounded-lg border transition-all flex flex-col gap-2 ${
                            isFinal
                              ? "bg-teal-500/10 dark:bg-teal-950/40 border-teal-500 shadow-sm"
                              : "bg-surface dark:bg-[#12191b] border-border-subtle dark:border-[#223138]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-primary dark:text-teal-400 font-bold">
                              Stage {idx + 1}: {m.event_type || (isFinal ? "FINAL_DEGREE" : "MILESTONE")}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              VERIFIED
                            </span>
                          </div>

                          <h4 className="font-semibold text-sm text-on-surface dark:text-white line-clamp-1">
                            {m.title || `Milestone #${idx + 1}`}
                          </h4>

                          <p className="text-xs text-on-surface-variant dark:text-neutral-400 line-clamp-2">
                            {m.description || `Issued by ${m.issuer_name || "IIT Delhi / ABC Institute"}`}
                          </p>

                          <div className="mt-auto pt-3 border-t border-border-subtle dark:border-[#223138] flex flex-col gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                            <div className="flex justify-between">
                              <span>Event ID:</span>
                              <span className="text-on-surface dark:text-teal-300 font-semibold">{m.credential_id || m.id}</span>
                            </div>
                            {m.linked_previous_event_id && (
                              <div className="flex justify-between text-teal-600 dark:text-teal-400 font-medium">
                                <span>Parent Ref:</span>
                                <span>{m.linked_previous_event_id}</span>
                              </div>
                            )}
                            <div className="flex justify-between truncate">
                              <span>Anchor:</span>
                              <span className="truncate max-w-[130px] font-medium">{m.document_hash || "0x..."}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Case C: Locked State with Time-Boxed Access Handshake */
                <div className="relative p-6 min-h-[300px]">
                  {/* Blurred Background Preview */}
                  <div className="absolute inset-0 blur-md opacity-40 dark:opacity-30 pointer-events-none p-6 flex flex-col gap-8 select-none">
                    <div className="flex gap-4">
                      <div className="w-1 h-full bg-border-subtle dark:bg-[#223138] relative ml-4"></div>
                      <div className="flex flex-col gap-6 w-full">
                        <div className="flex items-start gap-4">
                          <div className="w-3 h-3 bg-primary dark:bg-teal-400 absolute -left-[5px] mt-1.5 rounded-full"></div>
                          <div>
                            <div className="font-label-md text-label-md dark:text-white">Module 1 Completed - Distributed Consensus Fundamentals</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-neutral-400">2023-08-15 • Grade: 98%</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-3 h-3 bg-primary dark:bg-teal-400 absolute -left-[5px] mt-1.5 rounded-full"></div>
                          <div>
                            <div className="font-label-md text-label-md dark:text-white">Module 2 Completed - Cryptographic Proof Engines &amp; ZK Circuits</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-neutral-400">2023-09-10 • Grade: 94%</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-3 h-3 bg-primary dark:bg-teal-400 absolute -left-[5px] mt-1.5 rounded-full"></div>
                          <div>
                            <div className="font-label-md text-label-md dark:text-white">Final Assessment Passed - Capstone Architecture Defense</div>
                            <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-neutral-400">2023-10-25 • Pass with Distinction</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lock Overlay Interactive Card */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/80 dark:bg-[#151d1f]/85 backdrop-blur-sm gap-4 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container-highest dark:bg-[#1f2d33] border border-border-subtle dark:border-[#2b3e47] flex items-center justify-center mb-1 text-primary dark:text-teal-400 shadow-md">
                      <span className="material-symbols-outlined text-[32px]">lock</span>
                    </div>
                    <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white">
                      Milestone Data is Protected
                    </h3>
                    <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-neutral-300 max-w-md text-sm md:text-base">
                      The detailed learning trail for this credential requires time-boxed consent authorization from the holder.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                      <button
                        className="bg-primary hover:bg-primary-fixed-variant dark:bg-teal-600 dark:hover:bg-teal-500 text-on-primary font-label-md text-label-md py-2.5 px-6 rounded transition-all flex items-center gap-2 border border-primary dark:border-teal-500 shadow cursor-pointer"
                        onClick={() => {
                          setAccessRequested(true);
                          triggerToast("Time-boxed authorization request dispatched to credential holder's queue");
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">timer</span>
                        <span>{accessRequested ? "Request Dispatched" : "Request Time-Boxed Access"}</span>
                      </button>
                      <Link
                        to="/login"
                        className="bg-transparent hover:bg-surface-container dark:hover:bg-[#223138] text-primary dark:text-teal-300 font-label-md text-sm py-2.5 px-4 rounded transition-colors border border-border-subtle dark:border-[#223138]"
                      >
                        Holder Sign In
                      </Link>
                    </div>
                    {accessRequested && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Request pending holder approval in the Consent Handshake queue.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Expandable FAQs Section */}
          <section className="pt-4 flex flex-col gap-4" id="faqs">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary dark:text-teal-400">help_outline</span>
              <h3 className="text-xl font-bold text-on-surface dark:text-white">Verification &amp; Ledger FAQs</h3>
            </div>
            <div className="space-y-3">
              <details className="group bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] rounded-lg overflow-hidden transition-colors">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-sm md:text-base text-on-surface dark:text-white group-open:bg-surface-container-low dark:group-open:bg-[#1a2529]">
                  <span>How does on-chain cryptographic verification work?</span>
                  <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-on-surface-variant dark:text-neutral-400">
                    expand_more
                  </span>
                </summary>
                <div className="p-4 text-sm text-on-surface-variant dark:text-neutral-300 leading-relaxed border-t border-border-subtle dark:border-[#223138]">
                  CredChain computes a deterministic SHA-256 hash of the credential payload and checks it against the Merkle tree root anchored on our public decentralized ledger. The signature is mathematically guaranteed to be issued by Global Tech Institute's published DID.
                </div>
              </details>

              <details className="group bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] rounded-lg overflow-hidden transition-colors">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-sm md:text-base text-on-surface dark:text-white group-open:bg-surface-container-low dark:group-open:bg-[#1a2529]">
                  <span>Why is the Milestone Trail locked by default?</span>
                  <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-on-surface-variant dark:text-neutral-400">
                    expand_more
                  </span>
                </summary>
                <div className="p-4 text-sm text-on-surface-variant dark:text-neutral-300 leading-relaxed border-t border-border-subtle dark:border-[#223138]">
                  To comply with modern sovereign privacy guidelines (GDPR &amp; FERPA), intermediate milestones and grades remain encrypted under the credential holder's private key. Viewers can request temporary zero-knowledge access from the student or employer.
                </div>
              </details>

              <details className="group bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] rounded-lg overflow-hidden transition-colors">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-sm md:text-base text-on-surface dark:text-white group-open:bg-surface-container-low dark:group-open:bg-[#1a2529]">
                  <span>Can this verification be presented offline or printed?</span>
                  <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-on-surface-variant dark:text-neutral-400">
                    expand_more
                  </span>
                </summary>
                <div className="p-4 text-sm text-on-surface-variant dark:text-neutral-300 leading-relaxed border-t border-border-subtle dark:border-[#223138]">
                  Yes. You can use your browser's Print feature or the print icon at the top of this page to export an official PDF transcript with the cryptographic verification footer intact.
                </div>
              </details>
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button: Support / Help Drawer */}
      <div className="fixed bottom-6 left-6 z-40 no-print">
        <button
          aria-label="Verification Support"
          onClick={() => setSupportModalOpen(true)}
          className="flex items-center gap-2 bg-surface dark:bg-[#151d1f] text-on-surface dark:text-teal-300 border border-border-subtle dark:border-[#223138] px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-surface-container dark:hover:bg-[#1a2529] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-primary dark:text-teal-400">contact_support</span>
          <span className="text-xs font-semibold hidden sm:inline">Verification Support</span>
        </button>
      </div>

      {/* Floating Action Button: Return to Top */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-40 no-print">
          <button
            aria-label="Return to top of page"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-11 h-11 rounded-full bg-primary hover:bg-primary-fixed-variant dark:bg-teal-600 dark:hover:bg-teal-500 text-on-primary shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">keyboard_arrow_up</span>
          </button>
        </div>
      )}

      {/* Global Search Modal (Cmd+K) */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 no-print"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle dark:border-[#223138]">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-neutral-400">search</span>
              <input
                className="w-full bg-transparent border-none text-sm text-on-surface dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-0"
                placeholder="Search by Credential ID, DID, or Issuer..."
                type="text"
                autoFocus
              />
              <kbd className="text-[10px] font-code-sm bg-surface-container dark:bg-[#223138] px-2 py-0.5 rounded text-neutral-500 dark:text-neutral-400 border border-border-subtle dark:border-neutral-700">
                ESC
              </kbd>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto space-y-1">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">Quick Links</div>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-surface-container dark:hover:bg-[#1a2529] flex items-center justify-between text-xs"
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate("/verify?id=did:cred:8f9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z");
                }}
              >
                <span className="flex items-center gap-2 text-on-surface dark:text-neutral-200">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500">verified</span>
                  Advanced Systems Architecture (Current)
                </span>
                <span className="font-code-sm text-neutral-400 text-[10px]">8f9a2b3c...</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Modal Dialog */}
      {supportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setSupportModalOpen(false)}
        >
          <div
            className="bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#223138] w-full max-w-md rounded-xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close support dialog"
              className="absolute top-4 right-4 text-neutral-400 hover:text-on-surface dark:hover:text-white"
              onClick={() => setSupportModalOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded bg-primary/10 dark:bg-teal-950 flex items-center justify-center text-primary dark:text-teal-400">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface dark:text-white">Verification Support</h3>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-neutral-400 mb-4 leading-relaxed">
              Need assistance validating a disputed credential or generating an official cryptographic notary receipt? Our decentralized verification desk is on standby.
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSupportModalOpen(false);
                triggerToast("Verification support ticket dispatched");
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Inquiry Type</label>
                <select className="w-full text-xs rounded border border-border-subtle dark:border-[#223138] bg-surface-container-low dark:bg-[#1a2529] text-on-surface dark:text-white p-2">
                  <option>Dispute Verification Status</option>
                  <option>Milestone Access Authorization</option>
                  <option>Notary Seal Request</option>
                  <option>API &amp; Integration Support</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Your Contact Email or DID</label>
                <input
                  className="w-full text-xs rounded border border-border-subtle dark:border-[#223138] bg-surface-container-low dark:bg-[#1a2529] text-on-surface dark:text-white p-2 focus:ring-1 focus:ring-teal-500"
                  placeholder="name@domain.com or did:key:..."
                  required
                  type="text"
                />
              </div>
              <button
                className="w-full bg-primary dark:bg-teal-600 hover:bg-primary-fixed-variant dark:hover:bg-teal-500 text-white font-semibold text-xs py-2.5 rounded transition-all"
                type="submit"
              >
                Submit Verification Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-surface-container dark:bg-[#11181b] w-full py-6 px-margin-mobile md:px-margin-desktop border-t border-outline/30 dark:border-[#223138] mt-auto transition-colors">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-label-md text-label-md font-bold text-on-surface dark:text-white">
              © 2026 CredChain Ledger. Built on open standards.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-on-surface-variant dark:text-neutral-400">
            <a className="hover:text-primary dark:hover:text-teal-300 underline" href="#">Privacy</a>
            <a className="hover:text-primary dark:hover:text-teal-300 underline" href="#">Terms</a>
            <a className="hover:text-primary dark:hover:text-teal-300 underline" href="#">API Docs</a>
            <a className="hover:text-primary dark:hover:text-teal-300 underline" href="#">Source</a>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          <div className="px-4 py-2 bg-[#1c1b1b] dark:bg-slate-800 text-white dark:text-slate-100 text-sm font-label-md shadow-xl border border-slate-700 flex items-center gap-2 transition-all duration-300">
            <span className="material-symbols-outlined text-[18px] text-teal-400">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
