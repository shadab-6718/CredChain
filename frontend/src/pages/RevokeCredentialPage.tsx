import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { Credential } from "../types";

export const RevokeCredentialPage: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [reason, setReason] = useState("Administrative revocation / incorrect document issued");
  const [isRevoking, setIsRevoking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [revokeSuccess, setRevokeSuccess] = useState<any>(null);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const navigate = useNavigate();

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

  useEffect(() => {
    if (credentialId) {
      apiService
        .getCredential(credentialId)
        .then((res) => setCredential(res.credential))
        .catch((err) => setErrorMsg(err.message || "Credential not found"));
    }
  }, [credentialId]);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId) return;

    setIsRevoking(true);
    setErrorMsg("");

    try {
      const res = await apiService.revokeCredential(credentialId, reason);
      setRevokeSuccess(res);
    } catch (err: any) {
      console.error("Revocation error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to revoke credential.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] dark:bg-[#0b1315] text-[#191c1d] dark:text-[#e0e3e3] min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation Header (Exact Stitch Design) */}
      <header className="bg-white/90 dark:bg-[#101b1e]/90 backdrop-blur border-b border-gray-200 dark:border-[#1e2f34] w-full px-4 sm:px-margin-desktop h-16 sticky top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center max-w-7xl mx-auto h-full gap-4">
          <div className="flex items-center gap-6">
            <Link to="/">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
            <nav className="hidden md:flex gap-6 items-center text-sm font-medium">
              <Link className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" to="/explorer">
                Explorer
              </Link>
              <Link className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white" to="/wallet">
                Wallet
              </Link>
              <Link className="text-primary dark:text-[#8ad3d7] font-bold border-b-2 border-primary dark:border-[#8ad3d7] pb-1" to="/issuer">
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Toggle theme"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#16272c] border border-transparent hover:border-gray-200 rounded transition-all duration-200 cursor-pointer"
              id="theme-toggle"
              onClick={toggleTheme}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Breadcrumbs */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-[#22353a]">
          <Link to="/issuer" className="text-xs text-primary dark:text-[#8ad3d7] hover:underline font-semibold flex items-center gap-1 mb-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Issuer Dashboard
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-status-revoked text-white">
              Revocation Terminal
            </span>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              Zone 1 &amp; Zone 2 Consensus Enforcement
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revoke Credential Proof</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Permanently invalidate a previously issued credential on the Polygon Amoy blockchain.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-6 bg-error/10 border border-error text-error text-xs">
            {errorMsg}
          </div>
        )}

        {/* Revoke Success View */}
        {revokeSuccess ? (
          <div className="border border-gray-200 dark:border-[#22353a] bg-white dark:bg-[#132024] p-8 text-center mb-8">
            <div className="w-12 h-12 bg-status-revoked text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 rounded-full">
              ✕
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Credential Revoked on Blockchain
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              The status for <strong>{credentialId}</strong> has been permanently updated to REVOKED on Polygon Amoy. Any future verification will now flag this credential as revoked.
            </p>

            <div className="p-4 bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] text-xs font-mono text-left mb-6 space-y-2 max-w-lg mx-auto">
              <div>Tx Hash: <strong className="truncate block text-primary dark:text-[#8ad3d7]">{revokeSuccess.transactionHash}</strong></div>
              <div>Reason: <strong className="text-gray-900 dark:text-white font-sans">{reason}</strong></div>
              <div>Polygonscan: <a href={revokeSuccess.explorerUrl} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-[#8ad3d7] hover:underline">View on Amoy Explorer</a></div>
            </div>

            <div className="flex justify-center gap-3">
              <Link
                to={`/verify?id=${credentialId}`}
                className="px-5 py-2.5 bg-primary dark:bg-[#006064] text-white text-xs font-bold hover:bg-opacity-90 transition-all rounded"
              >
                Test Verification Status →
              </Link>
              <Link
                to="/issuer"
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#132024] text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded"
              >
                Back to Issuer Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Zone 1: Revocation Execution Form */
          <div className="border border-gray-200 dark:border-[#22353a] bg-white dark:bg-[#132024] p-6 mb-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2f34] pb-3 mb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                Target Credential for Permanent Revocation
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-mono font-bold">
                ZONE 1 ACTION
              </span>
            </div>

            {credential ? (
              <form onSubmit={handleRevoke} className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-[#0e1a1d] border border-gray-200 dark:border-[#24393f] text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Credential ID:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{credential.credential_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Title:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{credential.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Recipient:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">{credential.holder_wallet || "0x9965...A4df"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Current Status:</span>
                    <span className="font-bold text-status-valid uppercase">{credential.status}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Official Revocation Reason (Recorded on Blockchain)
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 text-xs border border-gray-300 dark:border-[#24393f] bg-white dark:bg-[#0e1a1d] text-gray-900 dark:text-white mb-2"
                  >
                    <option value="Administrative revocation / incorrect document issued">
                      Administrative revocation / incorrect document issued
                    </option>
                    <option value="Academic misconduct or disciplinary revocation">
                      Academic misconduct or disciplinary revocation
                    </option>
                    <option value="Fraudulent initial application / falsified credentials">
                      Fraudulent initial application / falsified credentials
                    </option>
                    <option value="Regulatory Order or Legal Decree">
                      Regulatory Order or Legal Decree
                    </option>
                    <option value="Expired credential superseded by new certification">
                      Expired credential superseded by new certification
                    </option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isRevoking || credential.status === "REVOKED"}
                    className="px-6 py-2.5 bg-status-revoked text-white font-bold text-xs hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">block</span>
                    <span>{isRevoking ? "Broadcasting Revocation Tx..." : "Confirm & Broadcast Revocation"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                Loading credential record...
              </div>
            )}
          </div>
        )}

        {/* Zone 2: Expected Output Preview (Mock Example) — Signature Stitch Feature */}
        <section className="bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] p-6 rounded-none shadow-sm mb-8 transition-colors duration-200">
          <div className="bg-gray-100 dark:bg-[#16272c] border-l-4 border-primary dark:border-[#8ad3d7] p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-[20px] text-primary dark:text-[#8ad3d7]">
                  preview
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Expected Output Preview (Mock Example) — How Results Will Look After Completion
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase font-semibold text-primary dark:text-[#8ad3d7] bg-white dark:bg-[#0f1b1e] px-2.5 py-1 border border-primary dark:border-[#8ad3d7] self-start sm:self-auto">
                MOCK REVOCATION PREVIEW
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
              Active form inputs remain clean above. This zone displays a simulated demonstration of the verified on-chain result and updated audit log once revocation is committed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 dark:border-[#22373d] bg-gray-50 dark:bg-[#0f1b1e] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  Sample Revoked Target (Post-Execution)
                </span>
                <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                  Revoked
                </span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Land Deed Parcel #402-A (CRED-84920)
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
                Target Hash: 0xe3b0c44298fc...7852b855
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                State updated on-chain to non-verifiable. Dependent applications and wallet verifiers receive instantaneous revocation signals.
              </p>
            </div>

            <div className="border border-gray-200 dark:border-[#22373d] bg-gray-50 dark:bg-[#0f1b1e] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                  Cryptographic Proof Receipt
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  Included in Block
                </span>
              </div>
              <div className="space-y-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                <p>
                  <span className="text-gray-900 dark:text-gray-200 font-sans font-medium">Tx Hash:</span>{" "}
                  <span className="text-teal-600 dark:text-teal-400">0x7bf8...390a</span>
                </p>
                <p>
                  <span className="text-gray-900 dark:text-gray-200 font-sans font-medium">Accumulator Proof:</span> Validated (0ms latency)
                </p>
                <p>
                  <span className="text-gray-900 dark:text-gray-200 font-sans font-medium">Notification Webhook:</span> Dispatched to Holder DID
                </p>
              </div>
            </div>
          </div>

          {/* Public Revocation Audit Log Sample */}
          <div className="pb-4 mb-4 border-b border-gray-200 dark:border-[#22353a]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Public Revocation Audit Log
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Historical and simulated revocation records registered by authorized institution keys.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-[#16272c] border-b border-gray-200 dark:border-[#1c2d32] text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="p-3">Credential ID</th>
                  <th className="p-3">Title / Type</th>
                  <th className="p-3">Recipient DID</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Revoked At</th>
                  <th className="p-3">Ledger Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1c2d32] text-xs">
                <tr className="hover:bg-gray-50 dark:hover:bg-[#17272c] transition-colors">
                  <td className="p-3 font-mono font-semibold text-status-revoked">CRED-81902</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">Commercial Broker License #88</td>
                  <td className="p-3 font-mono text-gray-500 dark:text-gray-400">did:ion:0x981...021</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">Regulatory Order</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">Mar 24, 2026</td>
                  <td className="p-3 font-mono text-teal-600 dark:text-teal-400">0x629...41a</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-[#17272c] transition-colors">
                  <td className="p-3 font-mono font-semibold text-status-revoked">CRED-79410</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">Civil Engineering Stamp - Ph 1</td>
                  <td className="p-3 font-mono text-gray-500 dark:text-gray-400">did:ion:0x442...99f</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">Clerical / Data Entry Error</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">Mar 19, 2026</td>
                  <td className="p-3 font-mono text-teal-600 dark:text-teal-400">0x3b1...88c</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="w-full bg-white dark:bg-[#0b1315] border-t border-gray-200 dark:border-[#1e2f34] transition-colors duration-200 mt-auto">
        <div className="w-full py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto text-xs text-gray-500 dark:text-gray-400">
          <div>© 2026 CredChain Ledger. Built on open standards.</div>
          <div className="flex items-center space-x-6">
            <a className="hover:text-primary dark:hover:text-[#8ad3d7] underline transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-primary dark:hover:text-[#8ad3d7] underline transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-primary dark:hover:text-[#8ad3d7] underline transition-colors" href="#">
              API Docs
            </a>
            <a className="hover:text-primary dark:hover:text-[#8ad3d7] underline transition-colors" href="#">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
