import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { AccessGrant, Credential } from "../types";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const AccessRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [grantsMap, setGrantsMap] = useState<Record<string, AccessGrant[]>>({});
  const [inboundRequests, setInboundRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock feedback states for Zone 2
  const [mock1Status, setMock1Status] = useState<"pending" | "approved" | "declined">("pending");
  const [mock2Status, setMock2Status] = useState<"active" | "revoked">("active");

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { connectWallet, account } = useWeb3();

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

  const formatTimeBox = (expiresAt?: string) => {
    if (!expiresAt) return { text: "Indefinite (Revocable)", isExpired: false, isExpiringSoon: false };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { text: "Expired", isExpired: true, isExpiringSoon: false };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return { text: `${days}d ${hours % 24}h remaining`, isExpired: false, isExpiringSoon: false };
    return { text: `${hours}h ${mins}m remaining`, isExpired: false, isExpiringSoon: hours < 12 };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiService.listCredentials();
      const creds = Array.isArray(res?.credentials) ? res.credentials : [];
      setCredentials(creds);

      const map: Record<string, AccessGrant[]> = {};
      await Promise.all(
        creds.map(async (c) => {
          try {
            const r = await apiService.getAccessGrants(c.credential_id);
            map[c.credential_id] = Array.isArray(r?.grants) ? r.grants : [];
          } catch {}
        })
      );
      setGrantsMap(map);

      try {
        const reqRes = await apiService.listAccessRequests();
        setInboundRequests(reqRes.requests || []);
      } catch (e) {
        console.warn("Inbound requests fetch notice:", e);
      }
    } catch (err) {
      console.error("Access requests load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRevokeGrant = async (credentialId: string, verifierId: string) => {
    if (!confirm("Are you sure you want to revoke document access from this verifier?")) return;
    try {
      await apiService.revokeAccess(credentialId, verifierId);
      alert("Verifier access revoked successfully on smart contract.");
      loadData();
    } catch (err: any) {
      alert(`Failed to revoke access: ${err.message}`);
    }
  };

  const handleRespondRequest = async (requestId: string, approved: boolean, durationHours: number = 72) => {
    try {
      await apiService.respondAccessRequest(requestId, approved, durationHours);
      alert(approved ? `Access granted for ${durationHours} hours.` : "Access request declined.");
      loadData();
    } catch (err: any) {
      alert(`Failed to respond to request: ${err.message}`);
    }
  };

  return (
    <div className="bg-background dark:bg-[#0b1315] text-on-surface dark:text-slate-100 font-body-lg text-body-lg min-h-screen flex flex-col antialiased transition-colors duration-200">
      {/* TopNavBar (Exact Stitch Design) */}
      <header className="w-full bg-surface dark:bg-[#101b1e] border-b border-outline-variant dark:border-slate-800 top-0 z-50 sticky transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-8">
            <Link className="flex items-center" to="/">
              <img
                alt="CredChain"
                className="h-10 md:h-12 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6 font-body-lg text-body-lg">
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/explorer">
                Explorer
              </Link>
              <Link className="text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-1 font-semibold hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/wallet">
                Wallet
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/issuer">
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            <button
              aria-label="Toggle color mode"
              className="p-2 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#162428] hover:bg-surface-container dark:hover:bg-[#1e3238] text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed transition-colors flex items-center justify-center cursor-pointer"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle Dark Mode"
              type="button"
            >
              <span className="material-symbols-outlined text-base" id="theme-icon">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
            {user?.role === "holder" && (
              <button
                className="bg-primary dark:bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 hover:bg-primary-container dark:hover:bg-[#007b80] transition-colors active:opacity-80 cursor-pointer"
                type="button"
                onClick={connectWallet}
              >
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        {/* Title */}
        <div className="mb-8 pb-6 border-b border-border-subtle dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-white">
              Access Control Matrix
            </span>
            <span className="text-xs font-mono text-on-surface-variant dark:text-slate-400">
              Two-Zone Cryptographic Privacy Architecture
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface dark:text-white">
            Verifier Access &amp; Permissions
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-1">
            Control which employers, financial institutions, and government verifiers have authorization to view full off-chain document contents.
          </p>
        </div>

        {/* Zone 1: Operational State — Live Access Grants Matrix */}
        <section className="mb-12">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-primary-fixed">security</span>
              <h2 className="font-headline-md text-base font-bold text-on-surface dark:text-white">
                Zone 1: Operational Access State
              </h2>
            </div>
            <span className="px-2.5 py-0.5 bg-surface-container-low dark:bg-slate-800 border border-border-subtle dark:border-slate-700 text-xs font-mono font-bold">
              ZONE 1 OPERATIONAL
            </span>
          </div>

          {loading ? (
            <div className="p-12 border border-border-subtle dark:border-slate-800 bg-surface-container-lowest dark:bg-[#132024] text-center text-xs text-on-surface-variant dark:text-slate-400">
              Loading cryptographic access grant policies from consensus ledger...
            </div>
          ) : credentials.length === 0 ? (
            <div className="p-12 border border-border-subtle dark:border-slate-800 bg-surface-container-lowest dark:bg-[#132024] text-center text-xs text-on-surface-variant dark:text-slate-400">
              No credentials found in your account to manage access grants for. Issue a test credential first.
            </div>
          ) : (
            <div className="space-y-6">
              {credentials.map((cred) => {
                const grants = grantsMap[cred.credential_id] || [];
                return (
                  <div key={cred.credential_id} className="border border-border-subtle dark:border-slate-800 bg-surface-container-lowest dark:bg-[#132024]">
                    {/* Header */}
                    <div className="p-4 bg-surface-container-low dark:bg-slate-900 border-b border-border-subtle dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold font-mono text-primary dark:text-primary-fixed mr-2">
                          {cred.credential_id}
                        </span>
                        <span className="font-semibold text-on-surface dark:text-white">{cred.title}</span>
                      </div>
                      <span className="text-xs font-mono text-on-surface-variant dark:text-slate-400">
                        Active Grants: <strong>{grants.filter((g) => g.status === "ACTIVE").length}</strong>
                      </span>
                    </div>

                    {/* Grants Table */}
                    {grants.length === 0 ? (
                      <div className="p-6 text-center text-xs text-on-surface-variant dark:text-slate-400">
                        No verifiers have been granted access to this credential. The document remains strictly private to you.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-surface-container-low/50 dark:bg-slate-800/40 border-b border-border-subtle dark:border-slate-800 text-on-surface-variant dark:text-slate-400">
                              <th className="py-2.5 px-4">Verifier Entity</th>
                              <th className="py-2.5 px-4">Email / Contact</th>
                              <th className="py-2.5 px-4">Granted At</th>
                              <th className="py-2.5 px-4">Time-Box Policy</th>
                              <th className="py-2.5 px-4">Policy Status</th>
                              <th className="py-2.5 px-4 text-right">Revoke Access</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/40 dark:divide-slate-800">
                            {grants.map((g) => {
                              const timebox = formatTimeBox(g.expires_at);
                              return (
                                <tr key={g.id} className="hover:bg-surface-container-low/30">
                                  <td className="py-3 px-4 font-bold text-on-surface dark:text-white">
                                    {g.verifier_name}
                                  </td>
                                  <td className="py-3 px-4 font-mono text-on-surface-variant dark:text-slate-400">
                                    {g.verifier_email}
                                  </td>
                                  <td className="py-3 px-4 text-on-surface-variant dark:text-slate-400 font-mono">
                                    {new Date(g.granted_at).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded flex items-center gap-1 w-fit ${
                                      timebox.isExpired
                                        ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                        : timebox.isExpiringSoon
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                        : "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30"
                                    }`}>
                                      <span className="material-symbols-outlined text-[13px]">
                                        {timebox.isExpired ? "timer_off" : "timer"}
                                      </span>
                                      {timebox.text}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        g.status === "ACTIVE"
                                          ? "bg-status-valid/15 text-status-valid border border-status-valid/30"
                                          : "bg-status-revoked/15 text-status-revoked border border-status-revoked/30"
                                      }`}
                                    >
                                      {g.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {g.status === "ACTIVE" && (
                                      <button
                                        onClick={() => handleRevokeGrant(cred.credential_id, g.verifier_id)}
                                        className="px-3 py-1 text-xs font-bold text-status-revoked border border-status-revoked/30 hover:bg-status-revoked/10 transition-colors cursor-pointer"
                                      >
                                        Revoke Permission
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Inbound Verifier Requests Handshake Queue (PRD PS26194) */}
        <section className="mb-12">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">swap_horizontal_circle</span>
              <h2 className="font-headline-md text-base font-bold text-on-surface dark:text-white">
                Inbound Verifier Requests Queue (Bilateral Consent Handshake)
              </h2>
            </div>
            <span className="px-2.5 py-0.5 bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-mono font-bold">
              {inboundRequests.length} PENDING HANDSHAKES
            </span>
          </div>

          {inboundRequests.length === 0 ? (
            <div className="p-8 border border-border-subtle dark:border-slate-800 bg-surface-container-lowest dark:bg-[#132024] rounded-lg text-center flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-gray-500">mark_email_read</span>
              <p className="text-sm font-semibold text-on-surface dark:text-white">No Inbound Requests Pending</p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-md">
                When background verifiers, banks, or employers request time-boxed access to your credentials via the public portal, they will appear here for your cryptographic signature and authorization.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inboundRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 border border-border-subtle dark:border-slate-800 bg-surface-container-lowest dark:bg-[#132024] rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-on-surface dark:text-white">{req.verifier_name}</span>
                      <span className="text-xs font-mono text-gray-500">({req.verifier_email})</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant dark:text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Target Credential: <strong className="font-mono text-teal-600 dark:text-teal-400">{req.credential_id}</strong></span>
                      {req.purpose && <span>• Purpose: <em>{req.purpose}</em></span>}
                    </div>
                    <div className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      Requested: {new Date(req.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, true, 24)}
                      className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      Approve 24h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, true, 72)}
                      className="px-3 py-1.5 rounded bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">timer</span>
                      Approve 72h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, true, 720)}
                      className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      Approve 30d
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRespondRequest(req.id, false)}
                      className="px-3 py-1.5 rounded border border-red-300 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zone 2: Expected Output Preview (Mock Demonstration) — Signature Stitch Feature */}
        <section className="border-2 border-primary/60 dark:border-primary-fixed/50 bg-surface-container-low/40 dark:bg-[#0e1a1d]/60 p-6 md:p-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-subtle dark:border-[#22353a] pb-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <span className="w-2.5 h-2.5 bg-secondary dark:bg-secondary-fixed-dim rounded-none"></span>
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-slate-100">
                  Expected Output Preview (Mock Demonstration) — How Inbound Access Requests Appear
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300 max-w-4xl">
                Operational state remains clean above. The cards below demonstrate how inbound verifier requests, cryptographic permission scopes (ZKP disclosure, duration, revoke rights), and status look once verifiers request access to your credential.
              </p>
            </div>
            <div className="shrink-0 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary-fixed/15 border border-primary dark:border-primary-fixed text-primary dark:text-primary-fixed font-code-sm text-code-sm font-bold px-3 py-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px]">view_quilt</span>
                MOCK PREVIEW FORMAT (2-3 EXAMPLES ONLY)
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-[#132024] border-l-4 border-primary p-3.5 mb-6 text-on-surface-variant dark:text-slate-300 font-body-sm text-body-sm flex items-start gap-2.5 shadow-sm">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-[20px] shrink-0 mt-0.5">info</span>
            <span>
              <strong>Simulated Mock Scenarios:</strong> These representative cards reflect real-world cryptographic handshake scopes (Selective ZKP disclosure, time-locked Land Title proof, and expired Merkle proofs) with interactive button feedback states.
            </span>
          </div>

          <div className="space-y-6">
            {/* Mock Example 1 */}
            <article className="bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 shadow-sm transition-all hover:border-primary">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="bg-primary text-on-primary font-code-sm text-code-sm font-bold px-2 py-0.5 tracking-wider">
                      MOCK EXAMPLE 1
                    </span>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-slate-100">
                      Veritas Background Verification Corp
                    </h3>
                    <span className="bg-surface-container dark:bg-[#0e1a1d] px-2 py-0.5 font-code-sm text-code-sm text-primary dark:text-primary-fixed font-semibold border border-border-subtle dark:border-[#22353a]">
                      VERIFIED ACCREDITED
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400">
                    <span>Verifier DID: did:ion:0x88f419c832a829e1f55b9a7c3</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold ${
                    mock1Status === "approved"
                      ? "bg-status-valid text-white"
                      : mock1Status === "declined"
                      ? "bg-status-revoked text-white"
                      : "bg-status-pending text-white"
                  }`}>
                    Status: {mock1Status === "approved" ? "Approved (Active)" : mock1Status === "declined" ? "Access Declined" : "Action Required (Pending)"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low dark:bg-[#0e1a1d] p-4 border border-border-subtle dark:border-[#22353a] mb-5">
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 block font-semibold">
                    Requested Credential:
                  </span>
                  <span className="font-body-lg text-body-lg font-bold text-on-surface dark:text-slate-100">
                    B.S. Computer Science Attestation
                  </span>
                </div>
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 block font-semibold">
                    Purpose:
                  </span>
                  <span className="font-body-lg text-body-lg text-on-surface dark:text-slate-200">
                    Pre-Employment Milestone Verification
                  </span>
                </div>
              </div>

              {mock1Status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setMock1Status("approved")}
                    className="bg-primary dark:bg-primary-container text-on-primary font-bold text-xs px-5 py-2 hover:bg-surface-tint transition-colors cursor-pointer"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => setMock1Status("declined")}
                    className="border border-border-subtle dark:border-slate-700 text-on-surface dark:text-slate-300 font-bold text-xs px-5 py-2 hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    Decline Request
                  </button>
                </div>
              )}
            </article>

            {/* Mock Example 2 */}
            <article className="bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 shadow-sm transition-all hover:border-primary">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="bg-primary text-on-primary font-code-sm text-code-sm font-bold px-2 py-0.5 tracking-wider">
                      MOCK EXAMPLE 2
                    </span>
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface dark:text-slate-100">
                      Apex Global Mortgage &amp; Escrow
                    </h3>
                    <span className="bg-surface-container dark:bg-[#0e1a1d] px-2 py-0.5 font-code-sm text-code-sm text-primary dark:text-primary-fixed font-semibold border border-border-subtle dark:border-[#22353a]">
                      TIER 1 FINANCIAL
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400">
                    <span>Verifier DID: did:ion:0x34c992a11bf73809e23</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold ${
                    mock2Status === "active" ? "bg-status-valid text-white" : "bg-status-revoked text-white"
                  }`}>
                    Status: {mock2Status === "active" ? "Active (Time-Locked 30 Days)" : "Revoked Early"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low dark:bg-[#0e1a1d] p-4 border border-border-subtle dark:border-[#22353a] mb-5">
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 block font-semibold">
                    Requested Credential:
                  </span>
                  <span className="font-body-lg text-body-lg font-bold text-on-surface dark:text-slate-100">
                    Freehold Title Deed #4802-A
                  </span>
                </div>
                <div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 block font-semibold">
                    Purpose:
                  </span>
                  <span className="font-body-lg text-body-lg text-on-surface dark:text-slate-200">
                    Collateral Valuation &amp; Title Verification
                  </span>
                </div>
              </div>

              {mock2Status === "active" && (
                <button
                  onClick={() => setMock2Status("revoked")}
                  className="border border-status-revoked text-status-revoked hover:bg-status-revoked/10 font-bold text-xs px-5 py-2 transition-colors cursor-pointer"
                >
                  Revoke Permission Early
                </button>
              )}
            </article>
          </div>
        </section>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="mt-auto border-t border-gray-200 dark:border-[#1e2f34] bg-white dark:bg-[#101b1e] py-6 px-4 sm:px-margin-desktop transition-colors duration-200">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>© 2026 CredChain Ledger. Built on open standards.</div>
          <div className="flex items-center gap-6">
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Security Audits
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
