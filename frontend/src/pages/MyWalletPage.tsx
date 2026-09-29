import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { Credential, UserProfile } from "../types";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { QRCodeModal } from "../components/QRCodeModal";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const MyWalletPage: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedQR, setSelectedQR] = useState<{ id: string; title: string } | null>(null);
  const [grantModalCred, setGrantModalCred] = useState<Credential | null>(null);
  const [verifiersList, setVerifiersList] = useState<UserProfile[]>([]);
  const [selectedVerifierId, setSelectedVerifierId] = useState<string>("");
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [walletToast, setWalletToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const [simulatedRequests, setSimulatedRequests] = useState([
    { id: 1, org: "TechCorp Inc.", request: "Degree Verification", status: "pending" },
    { id: 2, org: "Global Visas Dept.", request: "Enrollment History", status: "pending" },
    { id: 3, org: "Alumni Association", request: "Degree Verification", status: "approved", approvedAt: "Oct 25, 2023" },
  ]);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [credsRes, verifiersRes] = await Promise.all([
        apiService.listCredentials().catch(() => ({ credentials: [] })),
        apiService.getVerifiers().catch(() => ({ verifiers: [] })),
      ]);
      const creds = Array.isArray(credsRes?.credentials) ? credsRes.credentials : [];
      const verifiers = Array.isArray(verifiersRes?.verifiers) ? verifiersRes.verifiers : [];
      setCredentials(creds);
      setVerifiersList(verifiers);
      if (verifiers.length > 0) {
        setSelectedVerifierId(verifiers[0].id);
      }
    } catch (err) {
      console.error("Failed to load holder wallet data:", err);
      setCredentials([]);
      setVerifiersList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeCredentials = Array.isArray(credentials) ? credentials : [];
  const safeVerifiers = Array.isArray(verifiersList) ? verifiersList : [];

  const handleGrantAccess = async () => {
    if (!grantModalCred || !selectedVerifierId) return;
    setIsGranting(true);
    try {
      const verifier = verifiersList.find((v) => v.id === selectedVerifierId);
      await apiService.grantAccess(
        grantModalCred.credential_id,
        selectedVerifierId,
        verifier?.full_name || verifier?.organization,
        verifier?.email
      );
      alert(`Access granted to ${verifier?.full_name || "Verifier"} successfully!`);
      setGrantModalCred(null);
      loadData();
    } catch (err: any) {
      alert(`Failed to grant access: ${err.message}`);
    } finally {
      setIsGranting(false);
    }
  };

  const handleRespondCredential = async (credentialId: string, action: "ACCEPT" | "REJECT") => {
    setActionLoadingId(credentialId);
    try {
      const res = await apiService.respondCredential(credentialId, action);
      setWalletToast({
        message: action === "ACCEPT"
          ? `Credential ${credentialId} accepted! It is now active in your wallet.`
          : `Credential ${credentialId} has been rejected.`,
        type: action === "ACCEPT" ? "success" : "info",
      });
      setTimeout(() => setWalletToast(null), 5000);
      await loadData();
    } catch (err: any) {
      console.error("Failed to respond to credential:", err);
      setWalletToast({
        message: err.response?.data?.message || err.message || "Failed to update credential status.",
        type: "error",
      });
      setTimeout(() => setWalletToast(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulatedAction = (id: number, action: "approve" | "deny") => {
    setSimulatedRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: action === "approve" ? "approved" : "denied",
            approvedAt: action === "approve" ? "Just now" : undefined,
          };
        }
        return r;
      })
    );
  };

  return (
    <div className="bg-background dark:bg-[#0b1315] text-on-background dark:text-slate-100 min-h-screen flex flex-col font-body-lg text-body-lg transition-colors duration-200">
      {/* TopNavBar (Exact Stitch Design) */}
      <header className="sticky top-0 z-50 w-full bg-surface dark:bg-[#0f1b1e] border-b border-outline dark:border-slate-800 transition-colors">
        <nav className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-16 flex justify-between items-center">
          <div className="flex items-center gap-margin-desktop">
            <Link className="flex items-center h-8" to="/">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
            <div className="hidden md:flex gap-base">
              <Link
                className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-base py-1"
                to="/explorer"
              >
                Explorer
              </Link>
              <Link
                className="text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors px-base py-1 font-semibold"
                to="/wallet"
              >
                Wallet
              </Link>
              <Link
                className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-base py-1"
                to="/issuer"
              >
                Dashboard
              </Link>
              <Link
                className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-base py-1"
                to="/governance"
              >
                Governance
              </Link>
              <Link
                className="text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-base py-1"
                to="/admin"
              >
                Admin Portal
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-base">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            <Link
              to="/explorer"
              className="hidden sm:flex items-center gap-2 px-base py-1 border border-outline-variant dark:border-slate-700 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-low dark:hover:bg-slate-800 text-body-sm transition-colors"
              title="Search"
            >
              <span className="material-symbols-outlined text-body-lg">search</span>
              <span>Search...</span>
              <kbd className="text-xs border border-outline-variant dark:border-slate-700 px-1 rounded bg-surface-container dark:bg-slate-800 dark:text-slate-400">
                ⌘K
              </kbd>
            </Link>
            {/* Dark mode toggle button */}
            <button
              aria-label="Toggle Dark Mode"
              className="p-1.5 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 border border-outline-variant dark:border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              id="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
              type="button"
            >
              <span className="material-symbols-outlined text-body-lg dark:hidden">dark_mode</span>
              <span className="material-symbols-outlined text-body-lg hidden dark:inline">light_mode</span>
            </button>
            <button
              className="bg-primary dark:bg-primary-container text-on-primary px-base py-1 font-label-md text-label-md border-0 hover:bg-surface-tint dark:hover:bg-primary transition-colors hidden sm:inline-block cursor-pointer"
              type="button"
              onClick={connectWallet}
            >
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Holder Wallet"}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content Canvas */}
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-base">
        {/* Environment Notice Banner */}
        <div className="bg-surface-container-low dark:bg-[#132024] border border-outline-variant dark:border-slate-800 p-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-base text-body-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-status-pending text-body-lg">info</span>
            <div>
              <div className="font-label-md text-label-md text-primary dark:text-primary-fixed font-bold">
                Sample Credential Trail Preview — Mock Data Demonstration
              </div>
              <div className="text-on-surface-variant dark:text-slate-400 text-xs">
                Connected holder wallets stream real credentials and permissions. These records illustrate milestone progression and approval UX.
              </div>
            </div>
          </div>
          <span className="bg-surface-dim dark:bg-slate-800 text-on-surface dark:text-slate-300 px-2 py-0.5 font-label-md text-xs border border-outline-variant dark:border-slate-700 whitespace-nowrap font-semibold">
            Demo Environment
          </span>
        </div>
      </div>

      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-margin-desktop flex flex-col md:flex-row gap-margin-desktop">
        {/* Left Column: Vertical Timeline & Operational View */}
        <div className="flex-grow md:w-2/3">
          
          {/* Zone 1: Operational Wallet View */}
          <div className="mb-margin-desktop bg-surface dark:bg-[#132024] border border-outline-variant dark:border-slate-800 p-margin-mobile shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-base border-b border-outline-variant dark:border-slate-800 pb-2 mb-base">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-headline-md">
                  account_balance_wallet
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed">
                    Zone 1: Operational Wallet View
                  </h2>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Live operational DID session and credential synchronizer
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`border border-outline-variant dark:border-slate-700 px-2 py-0.5 text-xs font-label-md uppercase font-semibold ${
                  account ? "bg-status-valid/20 text-status-valid" : "bg-surface-dim dark:bg-slate-800 text-on-surface dark:text-slate-300"
                }`}>
                  {account ? "CONNECTED" : "DEMO HOLDER SESSION"}
                </span>
                <span className="bg-surface-container dark:bg-slate-800 text-status-pending border border-outline-variant dark:border-slate-700 px-2 py-0.5 text-xs font-mono font-bold">
                  {safeCredentials.filter((c) => c?.status === "ACTIVE").length} ACTIVE • {safeCredentials.filter((c) => c?.status === "PENDING").length} PENDING
                </span>
              </div>
            </div>

            {/* Notification Toast */}
            {walletToast && (
              <div
                className={`mb-4 p-3 text-xs flex items-center justify-between border transition-all ${
                  walletToast.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : walletToast.type === "error"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                    : "bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    {walletToast.type === "success" ? "check_circle" : walletToast.type === "error" ? "error" : "info"}
                  </span>
                  <span>{walletToast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWalletToast(null)}
                  className="text-on-surface-variant hover:text-on-surface ml-2"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* Pending Acceptance Action Banner */}
            {safeCredentials.some((c) => c?.status === "PENDING") && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-amber-600 dark:text-amber-400">mark_email_unread</span>
                  <span>
                    <strong>Action Required:</strong> You have {credentials.filter((c) => c.status === "PENDING").length} new credential offer(s) awaiting your formal acceptance. Review and accept below to anchor into your active vault.
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant dark:text-slate-400">
                Synchronizing on-chain credentials for {user?.full_name || "Holder"}...
              </div>
            ) : credentials.length === 0 ? (
              <div className="py-base px-margin-mobile border border-outline-variant dark:border-slate-700 bg-surface-container-low dark:bg-[#0f1b1e] text-center flex flex-col items-center justify-center gap-2">
                <div className="flex items-center justify-center p-2 rounded-none bg-surface-container dark:bg-slate-800 border border-outline-variant dark:border-slate-700">
                  <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-headline-lg">
                    link_off
                  </span>
                </div>
                <div className="font-label-md text-label-md text-on-background dark:text-white">
                  No Live Credentials in Vault Yet
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 max-w-lg">
                  Issue a new credential from the Issuer Portal to anchor a live verifiable record to your holder wallet, or inspect the simulated preview in Zone 2 below.
                </p>
                <div className="flex flex-wrap gap-base mt-2 justify-center">
                  <Link
                    to="/issue"
                    className="inline-flex items-center gap-1 bg-primary dark:bg-primary-container text-on-primary px-base py-1 font-label-md text-label-md hover:bg-surface-tint dark:hover:bg-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span> Issue Test Credential
                  </Link>
                  <button
                    onClick={connectWallet}
                    className="inline-flex items-center gap-1 bg-surface dark:bg-[#132024] text-primary dark:text-primary-fixed-dim border border-primary dark:border-primary-fixed-dim px-base py-1 font-label-md text-label-md hover:bg-surface-container dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">wallet</span> Connect Holder Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id || cred.credential_id}
                    className="p-4 border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-[#0f1b1e] flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-primary dark:text-primary-fixed">
                          {cred.credential_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase flex items-center gap-1 border ${
                            cred.status === "ACTIVE"
                              ? "bg-status-valid/10 text-status-valid border-status-valid/30"
                              : cred.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/40"
                              : cred.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/40"
                              : "bg-status-revoked/10 text-status-revoked border-status-revoked/30"
                          }`}
                        >
                          {cred.status === "PENDING" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          )}
                          {cred.status === "PENDING" ? "PENDING ACCEPTANCE" : cred.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-on-surface dark:text-white">{cred.title}</h4>
                      <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                        {cred.issuer_organization || cred.issuer_name || "Authorized Issuer"} • Issued: {new Date(cred.issued_at).toLocaleDateString()}
                      </p>
                    </div>

                    {cred.status === "PENDING" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          disabled={actionLoadingId === cred.credential_id}
                          onClick={() => handleRespondCredential(cred.credential_id, "ACCEPT")}
                          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          title="Accept and activate this credential in your wallet"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {actionLoadingId === cred.credential_id ? "Accepting..." : "Accept"}
                        </button>
                        <button
                          disabled={actionLoadingId === cred.credential_id}
                          onClick={() => handleRespondCredential(cred.credential_id, "REJECT")}
                          className="px-3 py-1.5 text-xs border border-rose-500/50 text-rose-500 hover:bg-rose-500/10 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                          title="Reject this credential offer"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          {actionLoadingId === cred.credential_id ? "Rejecting..." : "Reject"}
                        </button>
                        <Link
                          to={`/verify?id=${cred.credential_id}`}
                          className="px-2.5 py-1.5 text-xs border border-outline-variant dark:border-slate-700 hover:bg-surface-container text-on-surface dark:text-slate-200 flex items-center gap-1"
                          title="Inspect cryptographic proof before accepting"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          Inspect
                        </Link>
                      </div>
                    ) : cred.status === "REJECTED" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-rose-500 italic mr-1">Declined by holder</span>
                        <Link
                          to={`/verify?id=${cred.credential_id}`}
                          className="px-2.5 py-1 text-xs border border-outline-variant dark:border-slate-700 hover:bg-surface-container text-on-surface dark:text-slate-200"
                        >
                          Audit Trail
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedQR({ id: cred.credential_id, title: cred.title })}
                          className="px-2.5 py-1 text-xs border border-outline-variant dark:border-slate-700 bg-surface dark:bg-slate-800 hover:bg-surface-container text-on-surface dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code_2</span> QR Code
                        </button>
                        <button
                          onClick={() => setGrantModalCred(cred)}
                          className="px-2.5 py-1 text-xs bg-primary dark:bg-primary-container text-on-primary font-medium hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Grant Access
                        </button>
                        <Link
                          to={`/verify?id=${cred.credential_id}`}
                          className="px-2.5 py-1 text-xs border border-outline-variant dark:border-slate-700 hover:bg-surface-container text-on-surface dark:text-slate-200"
                        >
                          Verify
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Zone 2: Expected Output Preview (Mock Example) — Signature Stitch Feature */}
          <div className="border-2 border-dashed border-outline-variant dark:border-slate-700 bg-surface dark:bg-[#132024] p-margin-mobile shadow-sm">
            <div className="border-b border-outline-variant dark:border-slate-800 pb-base mb-base">
              <div className="flex flex-wrap items-center justify-between gap-base mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-surface-dim dark:bg-slate-800 text-on-surface dark:text-slate-300 border border-outline-variant dark:border-slate-700 px-2 py-0.5 text-xs font-label-md uppercase font-semibold">
                    Zone 2 Preview
                  </span>
                  <span className="bg-surface-container-highest dark:bg-slate-800 text-primary dark:text-primary-fixed border border-primary dark:border-primary-fixed px-2 py-0.5 text-xs font-label-md uppercase font-bold">
                    MOCK HOLDER PREVIEW
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant dark:text-slate-400 font-mono">
                  SCHEMA: W3C-VC-v2.0
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed font-bold">
                Expected Output Preview (Mock Example) — How Your Wallet Credentials Will Look After Sync
              </h2>
              <div className="mt-2 bg-surface-container-low dark:bg-[#0f1b1e] border border-outline-variant dark:border-slate-800 p-base text-body-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-status-pending text-body-lg">info</span>
                <div className="text-xs text-on-surface-variant dark:text-slate-400">
                  <span className="font-bold text-on-background dark:text-white">Simulation Notice:</span> The records below demonstrate the authenticated credential trail, milestone timeline (Academic Degree, Land Deed), and cryptographic proof inspector you will inspect once your DID wallet completes synchronization.
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-base mt-base pt-base border-t border-outline-variant dark:border-slate-800">
                <div className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                  <span>Sample Credential ID:</span>
                  <span className="font-mono font-bold text-on-background dark:text-slate-200">
                    0x9a7f5c3d2e1b8a904b2e
                  </span>
                  <button
                    className="inline-flex items-center gap-1 text-primary dark:text-primary-fixed-dim hover:text-surface-tint dark:hover:text-primary-fixed p-0.5 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText("0x9a7f5c3d2e1b8a904b2e");
                      alert("Copied sample credential hash!");
                    }}
                    title="Copy Credential Hash"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
                <button
                  className="print:hidden inline-flex items-center gap-1 border border-outline-variant dark:border-slate-700 bg-surface dark:bg-[#132024] hover:bg-surface-container-low dark:hover:bg-slate-800 px-2 py-0.5 text-body-sm text-on-surface-variant dark:text-slate-300 transition-colors cursor-pointer"
                  onClick={() => window.print()}
                  title="Print Certificate Trail"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">print</span>
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>

            {/* Vertical Milestone Timeline */}
            <div className="relative border-l-2 border-outline-variant dark:border-slate-700 ml-3 space-y-margin-desktop mb-margin-desktop">
              {/* Milestone 1: Degree */}
              <div className="relative pl-gutter">
                <div className="absolute w-3 h-3 bg-primary dark:bg-primary-fixed -left-[7px] top-1.5 rounded-none border border-outline dark:border-primary-fixed"></div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                    Oct 24, 2023
                  </div>
                  <span className="bg-status-valid text-on-primary px-2 py-0.5 font-label-md text-label-md font-semibold">
                    Issued
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background dark:text-white font-bold">
                  Academic Degree: Bachelor of Science in Computer Science
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
                  University of Technology. Final degree credential securely anchored to the chain with summa cum laude honours.
                </p>
              </div>

              {/* Milestone 2: Land Deed */}
              <div className="relative pl-gutter">
                <div className="absolute w-3 h-3 bg-status-valid -left-[7px] top-1.5 rounded-none border border-outline-variant dark:border-slate-600"></div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                    Aug 18, 2022
                  </div>
                  <span className="bg-status-valid text-on-primary px-2 py-0.5 font-label-md text-label-md font-semibold">
                    Title Anchored
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-background dark:text-white font-bold">
                  Land Deed: Title Registration Parcel #4802-A
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
                  National Cadastre &amp; Land Registry Authority. Freehold title deed authenticated via decentralized notary signature.
                </p>
              </div>

              {/* Milestone 3: Exams */}
              <div className="relative pl-gutter">
                <div className="absolute w-3 h-3 bg-surface-container dark:bg-slate-700 -left-[7px] top-1.5 rounded-none border border-outline-variant dark:border-slate-600"></div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                    May 15, 2023
                  </div>
                  <span className="bg-surface-dim dark:bg-slate-800 text-on-surface dark:text-slate-300 px-2 py-0.5 font-label-md text-label-md border border-outline-variant dark:border-slate-700">
                    Completed
                  </span>
                </div>
                <h3 className="font-body-lg text-body-lg font-bold text-on-background dark:text-slate-100">
                  Final Exams &amp; Prerequisite Milestones
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
                  All comprehensive examination modules verified and signed by University Academic Board.
                </p>
              </div>

              {/* Milestone 4: Enrollment */}
              <div className="relative pl-gutter">
                <div className="absolute w-3 h-3 bg-surface-container dark:bg-slate-700 -left-[7px] top-1.5 rounded-none border border-outline-variant dark:border-slate-600"></div>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                    Sep 01, 2019
                  </div>
                  <span className="bg-surface-dim dark:bg-slate-800 text-on-surface dark:text-slate-300 px-2 py-0.5 font-label-md text-label-md border border-outline-variant dark:border-slate-700">
                    Enrolled
                  </span>
                </div>
                <h3 className="font-body-lg text-body-lg font-bold text-on-background dark:text-slate-100">
                  Identity &amp; Enrollment Verification
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
                  Initial decentralized identifier issuance and institutional enrollment confirmation.
                </p>
              </div>
            </div>

            {/* Cryptographic Proof Inspector Box */}
            <div className="border border-outline dark:border-slate-700 bg-surface-container-low dark:bg-[#0f1b1e] p-base">
              <div className="flex items-center justify-between border-b border-outline-variant dark:border-slate-800 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-label-md">
                    verified_user
                  </span>
                  <h4 className="font-label-md text-label-md text-primary dark:text-primary-fixed font-bold">
                    Cryptographic Proof Inspector (Mock Sample)
                  </h4>
                </div>
                <span className="text-xs font-mono text-status-valid font-bold">
                  Merkle Root Verified ✓
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-on-surface-variant dark:text-slate-400">Proof Type:</span>
                  <span className="text-on-background dark:text-slate-200">Ed25519Signature2020</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-on-surface-variant dark:text-slate-400">Issuer DID:</span>
                  <span className="text-on-background dark:text-slate-200">did:ion:EiD8...4f8b91a</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-on-surface-variant dark:text-slate-400">Merkle Root:</span>
                  <span className="text-on-background dark:text-slate-200">0x7b2f4c91d...ef4a89</span>
                </div>
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-on-surface-variant dark:text-slate-400">Revocation Check:</span>
                  <span className="text-status-valid font-bold">StatusList2021 Entry Valid</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inbound Verifier Requests (Simulation + Real) */}
        <aside className="md:w-1/3 bg-surface-container-low dark:bg-[#132024] p-margin-mobile border border-outline-variant dark:border-slate-800 flex flex-col gap-base transition-colors">
          <div className="border-b border-outline-variant dark:border-slate-700 pb-2 mb-base">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-1">
                <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed font-bold">
                  Inbound Verifier Requests
                </h2>
              </div>
              <span className="bg-surface-dim dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 text-xs px-1.5 py-0.5 border border-outline-variant dark:border-slate-700 uppercase font-semibold w-fit">
                Simulation &amp; Live Grants
              </span>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1">
              Interactive simulation of inbound verification requests from third-party verifiers. Approve or deny to grant cryptographic view rights.
            </p>
          </div>

          {/* Simulated Request Items */}
          {simulatedRequests.map((req) => (
            <div
              key={req.id}
              className={`border border-outline dark:border-slate-700 bg-surface dark:bg-[#17272c] p-base flex flex-col gap-base shadow-sm ${
                req.status === "approved" ? "opacity-75" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-label-md text-label-md text-on-background dark:text-white font-bold">
                    {req.org}
                  </div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                    Requesting: {req.request}
                  </div>
                </div>
                <span className={req.status === "approved" ? "text-status-valid" : "text-status-pending"}>
                  <span className="material-symbols-outlined text-label-md">
                    {req.status === "approved" ? "check_circle" : req.status === "denied" ? "cancel" : "pending"}
                  </span>
                </span>
              </div>

              {req.status === "pending" ? (
                <div className="flex gap-base mt-2">
                  <button
                    onClick={() => handleSimulatedAction(req.id, "approve")}
                    className="flex-1 bg-primary dark:bg-primary-container text-on-primary py-1 font-label-md text-label-md hover:bg-surface-tint dark:hover:bg-primary transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleSimulatedAction(req.id, "deny")}
                    className="flex-1 bg-surface dark:bg-[#132024] text-primary dark:text-primary-fixed-dim border border-primary dark:border-primary-fixed-dim py-1 font-label-md text-label-md hover:bg-surface-container dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Deny
                  </button>
                </div>
              ) : (
                <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-2 italic text-xs">
                  {req.status === "approved" ? `Approved on ${req.approvedAt || "today"}` : "Denied by Holder"}
                </div>
              )}
            </div>
          ))}

          {/* Quick link to full permissions manager */}
          <div className="pt-2">
            <Link
              to="/access-requests"
              className="block w-full text-center py-2 px-3 border border-outline-variant dark:border-slate-700 bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high text-xs font-semibold text-primary dark:text-primary-fixed transition-colors"
            >
              Open Full Permissions Center →
            </Link>
          </div>
        </aside>
      </main>

      {/* Grant Access Modal */}
      {grantModalCred && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-lg text-on-surface dark:text-white mb-2">
              Grant Verifier Access
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-4">
              Select an authorized organization or bank to grant permission to verify{" "}
              <strong>{grantModalCred.title}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-on-surface dark:text-slate-300">
                Select Verifier Entity
              </label>
              <select
                value={selectedVerifierId}
                onChange={(e) => setSelectedVerifierId(e.target.value)}
                className="w-full p-2 text-xs border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white"
              >
                {verifiersList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.full_name} ({v.organization || v.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGrantModalCred(null)}
                className="px-3 py-1.5 text-xs border border-border-subtle dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantAccess}
                disabled={isGranting}
                className="px-4 py-1.5 text-xs bg-primary text-white font-bold"
              >
                {isGranting ? "Granting..." : "Confirm Grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <QRCodeModal
          isOpen={true}
          credentialId={selectedQR.id}
          title={selectedQR.title}
          onClose={() => setSelectedQR(null)}
        />
      )}

      {/* Footer (Exact Stitch Design) */}
      <footer className="bg-surface-container dark:bg-[#0f1b1e] border-t border-outline dark:border-slate-800 flat no shadows full-width bottom-0 w-full py-base px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base mt-auto transition-colors">
        <div className="font-label-md text-label-md font-bold text-on-surface dark:text-slate-300">
          © 2026 CredChain Ledger. Built on open standards.
        </div>
        <div className="flex gap-base">
          <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150 font-body-sm text-body-sm" href="#">
            Privacy
          </a>
          <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150 font-body-sm text-body-sm" href="#">
            Terms
          </a>
          <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150 font-body-sm text-body-sm" href="#">
            API Docs
          </a>
          <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150 font-body-sm text-body-sm" href="#">
            Source
          </a>
        </div>
      </footer>
    </div>
  );
};
