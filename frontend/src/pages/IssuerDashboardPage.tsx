import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { Credential } from "../types";
import { useAuth } from "../context/AuthContext";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const IssuerDashboardPage: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { user } = useAuth();
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

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const { credentials } = await apiService.listCredentials();
      setCredentials(credentials);
    } catch (err) {
      console.error("Failed to load issuer credentials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const totalIssued = credentials.length;
  const activeCount = credentials.filter((c) => c.status === "ACTIVE").length;
  const pendingCount = credentials.filter((c) => c.status === "PENDING").length;
  const revokedCount = credentials.filter((c) => c.status === "REVOKED").length;

  const filteredCredentials = credentials.filter((c) => {
    const matchesSearch =
      !searchTerm.trim() ||
      c.credential_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.recipient_did || c.holder_wallet || c.holder_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document_hash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && c.status === "ACTIVE") ||
      (filterStatus === "PENDING" && c.status === "PENDING") ||
      (filterStatus === "REVOKED" && c.status === "REVOKED");

    const matchesType =
      filterType === "ALL" || c.credential_type.toUpperCase().includes(filterType);

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="bg-background dark:bg-[#0b1315] text-on-surface dark:text-slate-100 min-h-screen flex flex-col font-body-lg text-body-lg antialiased transition-colors duration-200">
      {/* TopNavBar Header (Exact Stitch Design) */}
      <nav className="bg-surface dark:bg-[#0f1a1d] border-b border-border-subtle dark:border-slate-800 w-full sticky top-0 z-50 transition-colors">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-gutter">
            <div className="flex items-center gap-2">
              <Link to="/">
                <img
                  alt="CredChain"
                  className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                  src="/logo.svg"
                />
              </Link>
            </div>
            <div className="hidden md:flex items-center ml-8 h-full">
              <Link
                className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors px-4 py-2 h-full flex items-center"
                to="/explorer"
              >
                Explorer
              </Link>
              <Link
                className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors px-4 py-2 h-full flex items-center"
                to="/wallet"
              >
                Wallet
              </Link>
              <Link
                className="font-body-lg text-body-lg text-primary dark:text-[#8ad3d7] border-b-2 border-primary dark:border-[#8ad3d7] pb-1 px-4 h-full flex items-center font-medium"
                to="/issuer"
              >
                Dashboard
              </Link>
              <Link
                className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-4 py-2 h-full flex items-center"
                to="/governance"
              >
                Governance
              </Link>
              <Link
                className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-4 py-2 h-full flex items-center"
                to="/admin"
              >
                Admin Portal
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            <button
              className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-border-subtle dark:border-slate-700 bg-surface-bright dark:bg-[#142327] text-on-surface-variant dark:text-slate-300 text-body-sm hover:border-primary dark:hover:border-primary-fixed-dim transition-colors cursor-pointer"
              onClick={() => document.getElementById("credential-search")?.focus()}
              title="Search (Cmd+K)"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Search...</span>
              <kbd className="text-code-sm font-code-sm border border-border-subtle dark:border-slate-700 px-1 py-0.5 bg-surface-container-low dark:bg-slate-800 text-outline dark:text-slate-400">
                ⌘K
              </kbd>
            </button>
            {/* Dark mode toggle */}
            <button
              className="p-2 border border-border-subtle dark:border-slate-700 bg-surface dark:bg-[#142327] hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors text-on-surface-variant dark:text-slate-200 flex items-center justify-center cursor-pointer"
              id="theme-toggle"
              onClick={toggleTheme}
              title="Toggle Theme"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]" id="theme-toggle-icon">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background dark:text-white">
              Issuer Dashboard
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-2">
              Manage and track issued credentials for {user?.organization || user?.full_name || "ABC Institute of Technology"}.
            </p>
            <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 bg-status-valid/10 dark:bg-emerald-950/40 border border-status-valid/20 dark:border-emerald-500/30">
              <span className="material-symbols-outlined text-status-valid dark:text-emerald-400 text-[16px]">
                verified
              </span>
              <span className="font-label-md text-[12px] text-status-valid dark:text-emerald-400 uppercase tracking-wider">
                Registry Sync: Active • Polygon Amoy (80002)
              </span>
            </div>
          </div>
          <Link
            to="/issue"
            className="font-label-md text-label-md bg-primary dark:bg-[#14696d] text-on-primary px-4 py-2 rounded-none hover:bg-surface-tint dark:hover:bg-[#004f53] transition-colors flex items-center gap-2 border border-primary dark:border-[#14696d]"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
              add
            </span>
            Issue New Event
          </Link>
        </div>

        {/* Zone 1: Density Data Table Container */}
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-[#8ad3d7] text-[20px]">
                dashboard
              </span>
              <h2 className="font-headline-md text-[18px] text-on-background dark:text-white font-bold">
                Live Operations &amp; Registry Activity
              </h2>
            </div>
            <span className="px-2.5 py-1 bg-surface-container-low dark:bg-slate-800 border border-border-subtle dark:border-slate-700 text-on-surface-variant dark:text-slate-300 font-code-sm text-[11px] uppercase tracking-wider">
              Zone 1 • Operational State
            </span>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-4">
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                Total Active Credentials
              </p>
              <p className="font-headline-lg text-headline-lg text-on-background dark:text-white mt-1">
                {totalIssued}
              </p>
              <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400">
                {totalIssued > 0 ? "Live on Polygon Ledger" : "Awaiting issuance stream"}
              </span>
            </div>
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-4">
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                Valid On-Chain Proofs
              </p>
              <p className="font-headline-lg text-headline-lg text-status-valid dark:text-emerald-400 mt-1">
                {activeCount}
              </p>
              <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400">
                {totalIssued > 0 ? `${Math.round((activeCount / totalIssued) * 100)}% of issued register` : "0% of issued register"}
              </span>
            </div>
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-4">
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                Pending Acceptance
              </p>
              <p className="font-headline-lg text-headline-lg text-status-pending dark:text-amber-400 mt-1">
                {pendingCount}
              </p>
              <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400">
                {pendingCount > 0 ? "Awaiting holder acceptance" : "No pending offers"}
              </span>
            </div>
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-4">
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400">
                Revoked Proofs
              </p>
              <p className="font-headline-lg text-headline-lg text-status-revoked dark:text-red-400 mt-1">
                {revokedCount}
              </p>
              <span className="font-body-sm text-[12px] text-on-surface-variant dark:text-slate-400">
                {revokedCount === 0 ? "Zero revocation flags" : `${revokedCount} revocation flag(s)`}
              </span>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-3 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2 w-full md:w-auto flex-grow max-w-md">
              <span className="material-symbols-outlined text-outline dark:text-slate-400 text-[18px]">
                filter_list
              </span>
              <input
                className="w-full bg-surface-bright dark:bg-[#0c1619] border border-border-subtle dark:border-slate-700 px-3 py-1.5 text-body-sm text-on-surface dark:text-slate-200 placeholder:text-outline dark:placeholder:text-slate-500 focus:outline-none focus:border-primary"
                id="credential-search"
                placeholder="Filter credentials by holder address, event type, or hash..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <select
                className="px-3 py-1.5 border border-border-subtle dark:border-slate-700 bg-surface dark:bg-[#132024] text-on-surface-variant dark:text-slate-300 font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="DEGREE">Degrees &amp; Certs</option>
                <option value="LAND">Land Records</option>
              </select>
              <select
                className="px-3 py-1.5 border border-border-subtle dark:border-slate-700 bg-surface dark:bg-[#132024] text-on-surface-variant dark:text-slate-300 font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Status: Any</option>
                <option value="ACTIVE">Status: Valid</option>
                <option value="PENDING">Status: Pending Acceptance</option>
                <option value="REVOKED">Status: Revoked</option>
              </select>
            </div>
          </div>

          {/* Real Live Registry Table / Empty State */}
          {loading ? (
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-12 text-center">
              <span className="font-body-sm text-on-surface-variant dark:text-slate-400">
                Synchronizing with Polygon Amoy smart contract and Supabase storage...
              </span>
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-surface-container-low dark:bg-slate-800/80 rounded-none mb-4">
                <span className="material-symbols-outlined text-[36px] text-outline dark:text-slate-400">
                  folder_off
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white font-semibold">
                No Active Credentials Loaded
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mt-2 max-w-md">
                Connect Issuer Node or Issue New Credential to initialize live ledger sync and populate operational metrics.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link
                  to="/issue"
                  className="font-label-md text-label-md bg-primary dark:bg-[#14696d] text-on-primary px-5 py-2.5 rounded-none hover:bg-surface-tint dark:hover:bg-[#004f53] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Issue Credential
                </Link>
                <button
                  type="button"
                  onClick={loadCredentials}
                  className="font-label-md text-label-md border border-border-subtle dark:border-slate-700 text-on-surface dark:text-slate-200 px-4 py-2.5 rounded-none hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  Connect Issuer Node
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface dark:bg-[#132024] border border-border-subtle dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-low dark:bg-slate-800/80 border-b border-border-subtle dark:border-slate-700 font-label-md text-label-md text-on-surface dark:text-slate-200">
                    <th className="py-3 px-4">Credential ID</th>
                    <th className="py-3 px-4">Title / Event Type</th>
                    <th className="py-3 px-4">Recipient Address / DID</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Ledger Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle dark:divide-slate-800">
                  {filteredCredentials.map((c) => (
                    <tr key={c.id || c.credential_id} className="hover:bg-surface-container-low dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary dark:text-primary-fixed">
                        {c.credential_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface dark:text-white">{c.title}</div>
                        <div className="text-xs text-on-surface-variant dark:text-slate-400">{c.credential_type}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-on-surface-variant dark:text-slate-300">
                        {c.recipient_did}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-on-surface-variant dark:text-slate-400">
                        {new Date(c.issued_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold ${
                            c.status === "ACTIVE"
                              ? "bg-status-valid/15 text-status-valid border border-status-valid/30"
                              : c.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              : c.status === "REJECTED"
                              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                              : "bg-status-revoked/15 text-status-revoked border border-status-revoked/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.status === "ACTIVE"
                                ? "bg-status-valid"
                                : c.status === "PENDING"
                                ? "bg-amber-500 animate-pulse"
                                : c.status === "REJECTED"
                                ? "bg-rose-500"
                                : "bg-status-revoked"
                            }`}
                          />
                          {c.status === "ACTIVE"
                            ? "Confirmed"
                            : c.status === "PENDING"
                            ? "Pending Acceptance"
                            : c.status === "REJECTED"
                            ? "Declined"
                            : "Revoked"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          to={`/verify?id=${c.credential_id}`}
                          className="px-2.5 py-1 text-xs font-semibold border border-border-subtle dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 text-on-surface dark:text-slate-200 transition-colors inline-block"
                        >
                          Verify
                        </Link>
                        <Link
                          to={`/verify/${c.credential_id}/history`}
                          className="px-2.5 py-1 text-xs font-semibold border border-border-subtle dark:border-slate-700 hover:bg-surface-container-low dark:hover:bg-slate-800 text-on-surface dark:text-slate-200 transition-colors inline-block"
                        >
                          Audit
                        </Link>
                        {c.status === "ACTIVE" && (
                          <Link
                            to={`/revoke/${c.credential_id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-status-revoked border border-status-revoked/30 hover:bg-status-revoked/10 transition-colors inline-block"
                          >
                            Revoke
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Zone 2: Expected Registry Preview (Mock Example) — Signature Stitch Feature */}
        <div className="bg-surface dark:bg-[#132024] border-2 border-dashed border-status-pending/40 dark:border-amber-500/40 rounded-none overflow-hidden shadow-sm mt-4">
          <div className="p-4 bg-status-pending/10 dark:bg-amber-950/40 border-b border-status-pending/20 dark:border-amber-500/30 flex flex-col md:flex-row justify-between md:items-center gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-status-pending dark:text-amber-400 text-[24px] mt-0.5">
                developer_board
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-headline-md text-[16px] text-status-pending dark:text-amber-400 font-bold">
                    Expected Registry Preview (Mock Example) — How Issued Credentials Table Will Look After Issuance
                  </h3>
                  <span className="px-2 py-0.5 bg-status-pending/20 dark:bg-amber-500/20 text-status-pending dark:text-amber-400 font-code-sm text-[11px] uppercase tracking-wider font-bold">
                    MOCK DATA PREVIEW
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-1">
                  For example, it will show like this once credentials (such as university degrees or land titles) are issued and anchored onto the immutable ledger.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse font-body-sm text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle dark:border-slate-800 text-xs font-semibold text-on-surface-variant dark:text-slate-400">
                  <th className="py-2.5 px-3">Example ID</th>
                  <th className="py-2.5 px-3">Credential Title</th>
                  <th className="py-2.5 px-3">Recipient Identity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Blockchain Anchor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60 dark:divide-slate-800/60 font-code-sm text-code-sm text-xs">
                <tr className="hover:bg-surface-container-low dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-primary dark:text-primary-fixed">
                    CRED-2026-ENG-0891
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-sans font-bold text-on-surface dark:text-slate-200">
                      Bachelor of Technology in Computer Science &amp; Engineering
                    </div>
                    <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      ABC Institute of Technology • First Class Honours
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-on-surface-variant dark:text-slate-300">
                    Rahul Kumar (0x9965...A4df)
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-valid/15 text-status-valid border border-status-valid/30 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-valid"></span>
                      Verified Active
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-primary dark:text-primary-fixed text-[11px]">
                    0x7a2b9c1d...3a6b (Block #19,842,091)
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-primary dark:text-primary-fixed">
                    LAND-DEED-PARCEL-4802
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-sans font-bold text-on-surface dark:text-slate-200">
                      Freehold Land Title Certificate — Sector 12, Plot 4802-A
                    </div>
                    <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      State Cadastre &amp; Revenue Authority
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-on-surface-variant dark:text-slate-300">
                    Rahul Kumar (0x9965...A4df)
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-valid/15 text-status-valid border border-status-valid/30 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-valid"></span>
                      Verified Active
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-primary dark:text-primary-fixed text-[11px]">
                    0x3f98c21a...89be (Block #19,842,099)
                  </td>
                </tr>

                <tr className="hover:bg-surface-container-low dark:hover:bg-slate-800/30">
                  <td className="py-3 px-3 font-mono font-bold text-status-revoked">
                    CRED-2025-ARCH-0412
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-sans font-bold text-on-surface dark:text-slate-200">
                      Provisional Architectural License
                    </div>
                    <div className="text-[11px] text-on-surface-variant dark:text-slate-400">
                      Revocation Reason: Expired provisional status superseded by 2026 certification
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-on-surface-variant dark:text-slate-300">
                    Priya Sharma (0x4421...99ef)
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-status-revoked/15 text-status-revoked border border-status-revoked/30 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-revoked"></span>
                      Revoked
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-on-surface-variant dark:text-slate-400 text-[11px]">
                    0x992b11d...e3a1 (Block #19,841,500)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="bg-surface-container dark:bg-[#0f1a1d] border-t border-outline dark:border-slate-800 w-full mt-auto transition-colors">
        <div className="w-full py-base px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base max-w-container-max mx-auto h-16">
          <span className="font-label-md text-label-md font-bold text-on-surface dark:text-slate-300">
            © 2026 CredChain Ledger. Built on open standards.
          </span>
          <div className="flex items-center gap-4">
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150" href="#">
              Privacy
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150" href="#">
              Terms
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150" href="#">
              API Docs
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed-dim underline transition-opacity duration-150" href="#">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
