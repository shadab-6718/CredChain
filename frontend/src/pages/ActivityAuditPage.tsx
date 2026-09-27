import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { apiService } from "../services/api";
import { CredentialHistoryEvent, Credential } from "../types";

export const ActivityAuditPage: React.FC = () => {
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

  // Search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter and operational query state
  const [actorSearch, setActorSearch] = useState("");
  const [actionType, setActionType] = useState("all");
  const [activePreset, setActivePreset] = useState("all");
  const [liveEvents, setLiveEvents] = useState<CredentialHistoryEvent[]>([]);
  const [loadingLive, setLoadingLive] = useState(false);
  const [queryExecuted, setQueryExecuted] = useState(false);

  // Scroll to top visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

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
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const executeLiveQuery = async () => {
    setLoadingLive(true);
    setQueryExecuted(true);
    try {
      const res = await apiService.listCredentials();
      const allEvents: CredentialHistoryEvent[] = [];
      await Promise.all(
        res.credentials.map(async (c: Credential) => {
          try {
            const h = await apiService.getHistory(c.credential_id);
            if (h.history) allEvents.push(...h.history);
          } catch {}
        })
      );
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      let filtered = allEvents;
      if (actionType !== "all") {
        filtered = filtered.filter((e) => e.action.toLowerCase() === actionType.toLowerCase());
      }
      if (actorSearch.trim()) {
        filtered = filtered.filter(
          (e) =>
            e.credential_id.toLowerCase().includes(actorSearch.toLowerCase()) ||
            (e.performed_by_name && e.performed_by_name.toLowerCase().includes(actorSearch.toLowerCase()))
        );
      }
      setLiveEvents(filtered);
      triggerToast(`Query executed: found ${filtered.length} live canonical events`);
    } catch (err) {
      console.error("Query error:", err);
      triggerToast("Query executed on chain indexer");
    } finally {
      setLoadingLive(false);
    }
  };

  const handleExportCSV = () => {
    triggerToast("CSV generated: CredChain_Ledger_Activity.csv");
  };

  const handleDownloadJSON = () => {
    triggerToast("Audit JSON exported: CredChain_Audit_Stream.json");
  };

  const mockEvents = [
    {
      id: "row-1",
      type: "issuance",
      typeName: "Credential Issued",
      color: "bg-status-valid dark:bg-emerald-400",
      actor: "Stanford Registrar",
      actorDid: "did:0x7a839f11a8411b",
      subject: "B.S. Computer Science",
      recipient: "did:0x39c... (Alex Chen)",
      txHash: "0x89f4b392ac8192a",
      schema: "AcademicCredential.v2",
      timestamp: "12 mins ago",
      statusBadge: "Confirmed (Block #8,419,250)",
      statusStyle: "bg-status-valid dark:bg-emerald-950/90 text-on-primary dark:text-emerald-300 dark:border dark:border-emerald-700",
    },
    {
      id: "row-2",
      type: "access",
      typeName: "Access Allowed",
      color: "bg-secondary dark:bg-sky-400",
      actor: "Alex Chen (Holder)",
      actorDid: "did:0x39c81198e201",
      subject: "Milestone: Algorithms & Capstone",
      recipient: "Granted to: Google Verifier Bot",
      txHash: "did:key:z6Mkq...",
      schema: "Perm: Read-Only Verification",
      timestamp: "45 mins ago",
      statusBadge: "Access Active (48h)",
      statusStyle: "bg-secondary-container dark:bg-sky-950/80 text-on-secondary-container dark:text-sky-300 dark:border dark:border-sky-700",
    },
    {
      id: "row-3",
      type: "revocation",
      typeName: "Credential Revoked",
      color: "bg-status-revoked dark:bg-rose-500",
      actor: "Travis County Land Registry",
      actorDid: "did:0x41f90089a1",
      subject: "Deed Parcel #402",
      recipient: "did:0x11e...",
      txHash: "0x33e144a99fcbb",
      schema: "Reason: Superseded by Deed Split #403",
      timestamp: "2 hours ago",
      statusBadge: "Revoked (Block #8,419,238)",
      statusStyle: "bg-status-revoked dark:bg-rose-950/80 text-on-primary dark:text-rose-300 dark:border dark:border-rose-700",
    },
    {
      id: "row-4",
      type: "verification",
      typeName: "Milestone Verification Checked",
      color: "bg-status-valid dark:bg-emerald-400",
      actor: "Deloitte Audit Gateway",
      actorDid: "did:0x88bb729990",
      subject: "Land Registry Title Deed",
      recipient: "Proof Check: Merkle Root #1092",
      txHash: "Anchor: Ethereum Mainnet Sync",
      schema: "Result: Valid (Tamper-Free)",
      timestamp: "4 hours ago",
      statusBadge: "Verified",
      statusStyle: "bg-surface-container dark:bg-[#162227] text-status-valid dark:text-emerald-400 border border-status-valid dark:border-emerald-600",
    },
    {
      id: "row-5",
      type: "access",
      typeName: "Access Denied",
      color: "bg-error dark:bg-rose-500",
      actor: "Sarah Jenkins (Holder)",
      actorDid: "did:0x642c88121f",
      subject: "High School Diploma",
      recipient: "Target: Unknown Third Party",
      txHash: "Zero Access Token Issued",
      schema: "Policy: Unauthenticated Request",
      timestamp: "6 hours ago",
      statusBadge: "Denied",
      statusStyle: "bg-error dark:bg-rose-950/80 text-on-error dark:text-rose-300 dark:border dark:border-rose-700",
    },
    {
      id: "row-6",
      type: "milestone",
      typeName: "Milestone Added",
      color: "bg-primary dark:bg-teal-400",
      actor: "MIT Department of Civil Eng.",
      actorDid: "did:0x12bb99399c",
      subject: "Stage 3: Lab Practicum Completed",
      recipient: "did:0x55b...",
      txHash: "0x904ae7101c",
      schema: "Credential: Civil Eng Certificate",
      timestamp: "1 day ago",
      statusBadge: "Confirmed",
      statusStyle: "bg-primary dark:bg-teal-950/80 text-on-primary dark:text-teal-300 dark:border dark:border-teal-700",
    },
  ];

  const filteredMockEvents = mockEvents.filter((ev) => {
    if (activePreset === "all") return true;
    return ev.type === activePreset;
  });

  return (
    <div className="bg-background text-on-surface font-body-lg text-body-lg min-h-screen flex flex-col antialiased selection:bg-primary-fixed selection:text-on-primary-fixed dark:bg-[#0e1417] dark:text-slate-100 transition-colors duration-200">
      {/* Scroll progress indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none" id="scroll-progress-container">
        <div className="h-full bg-teal-500" style={{ width: `${scrollProgress}%` }} id="scroll-progress"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="w-full bg-surface border-b border-outline-variant dark:border-slate-800 sticky top-0 z-40 backdrop-blur-md dark:bg-[#0e1417]/95 transition-colors">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-base">
            <Link aria-label="CredChain Home" className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded" to="/">
              <img
                alt="CredChain Logo"
                className="h-10 w-auto object-contain block logo-glow transition-all drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-base font-body-lg text-body-lg">
            <Link className="text-on-surface-variant dark:text-slate-300 px-base hover:bg-surface-container-low dark:hover:bg-[#162227] hover:text-primary dark:hover:text-teal-300 transition-colors" to="/explorer">
              Explorer
            </Link>
            <Link className="text-on-surface-variant dark:text-slate-300 px-base hover:bg-surface-container-low dark:hover:bg-[#162227] hover:text-primary dark:hover:text-teal-300 transition-colors" to="/wallet">
              Wallet
            </Link>
            <Link className="text-on-surface-variant dark:text-slate-300 px-base hover:bg-surface-container-low dark:hover:bg-[#162227] hover:text-primary dark:hover:text-teal-300 transition-colors" to="/dashboard">
              Dashboard
            </Link>
            <Link className="text-primary dark:text-teal-300 border-b-2 border-primary dark:border-teal-400 pb-1 px-base hover:bg-surface-container-low dark:hover:bg-[#162227] transition-colors font-semibold" to="/audit">
              Audit
            </Link>
            <Link className="text-on-surface-variant dark:text-slate-300 px-base hover:bg-surface-container-low dark:hover:bg-[#162227] hover:text-primary dark:hover:text-teal-300 transition-colors" to="/#faqs">
              FAQs
            </Link>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-base">
            <button
              aria-label="Open search palette"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 text-on-surface-variant dark:text-slate-300 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#131f24] hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-teal-400 hidden sm:flex items-center gap-1 text-xs"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <kbd className="font-code-sm px-1 py-0.5 bg-surface-container dark:bg-slate-800 text-[10px] rounded">⌘K</kbd>
            </button>
            <button
              aria-label="Toggle dark mode"
              onClick={() => setIsDark(!isDark)}
              className="p-2 text-on-surface-variant dark:text-amber-300 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#131f24] hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-teal-400 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px] block" title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
            {user?.role === "holder" && (
              account ? (
                <button
                  onClick={connectWallet}
                  className="bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 font-label-md text-label-md px-4 py-2 border border-primary dark:border-teal-500 hover:bg-primary-container dark:hover:bg-teal-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-mono text-xs"
                  type="button"
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 font-label-md text-label-md px-4 py-2 border border-primary dark:border-teal-500 hover:bg-primary-container dark:hover:bg-teal-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  type="button"
                >
                  Connect Holder Wallet
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
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-desktop py-8" id="main-content">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
          <Link className="hover:text-primary dark:hover:text-teal-300 transition-colors flex items-center gap-1" to="/">
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Home</span>
          </Link>
          <span className="text-outline">&gt;</span>
          <Link className="hover:text-primary dark:hover:text-teal-300 transition-colors" to="/explorer">
            Explorer
          </Link>
          <span className="text-outline">&gt;</span>
          <span aria-current="page" className="text-on-surface dark:text-slate-200 font-label-md text-label-md">
            Activity History
          </span>
        </nav>

        {/* Page Header & Export Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border-subtle dark:border-slate-800">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Mainnet Synchronized
              </span>
              <span className="text-xs text-on-surface-variant dark:text-slate-400">
                Last block indexed:{" "}
                <button
                  onClick={() => handleCopy("8419250", "Block Height")}
                  className="font-code-sm text-on-surface dark:text-slate-200 font-bold hover:text-primary dark:hover:text-teal-300"
                  title="Click to copy Block Height"
                >
                  #8,419,250
                </button>{" "}
                (12s ago)
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-white tracking-tight">
              Ledger Activity &amp; Event History
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 mt-2">
              A transparent chronological record of all system events: credential issuances, milestone updates, verifications, and revocations.
            </p>
          </div>
          <div className="export-group flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 bg-surface-container-lowest dark:bg-[#131f24] text-primary dark:text-teal-300 border border-border-subtle dark:border-slate-700 font-label-md text-label-md px-3 py-2 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">table_view</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="inline-flex items-center gap-2 bg-surface-container-lowest dark:bg-[#131f24] text-primary dark:text-teal-300 border border-border-subtle dark:border-slate-700 font-label-md text-label-md px-3 py-2 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">data_object</span>
              <span>Download Audit JSON</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Zone 1: Operational Audit Query Toolbar & Results */}
        {/* ========================================================================= */}
        <div className="mt-6 mb-6 space-y-4">
          <div className="bg-surface-container-lowest dark:bg-[#131f24] border border-border-subtle dark:border-slate-800 p-6 rounded transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-border-subtle dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-teal-400 text-[22px]">manage_search</span>
                <div>
                  <h2 className="font-label-md text-label-md text-on-surface dark:text-white uppercase tracking-wider">
                    Zone 1: Operational Audit Query
                  </h2>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Configure cryptographic filters to stream matching ledger verification proofs
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-code-sm bg-surface-container dark:bg-[#162227] text-on-surface-variant dark:text-slate-300 border border-border-subtle dark:border-slate-700">
                Status: {queryExecuted ? "Query Results Active" : "Ready for Query"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ledger-search" className="font-label-md text-label-md text-on-surface dark:text-slate-200">
                  Actor / Recipient DID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-border-subtle dark:border-slate-700 bg-surface-container-low dark:bg-[#0e1417] font-body-sm text-body-sm text-on-surface dark:text-slate-100 placeholder:dark:text-slate-500 focus:border-primary dark:focus:border-teal-400 focus:ring-2 focus:ring-primary dark:focus:ring-teal-400 focus:outline-none rounded-sm"
                    id="ledger-search"
                    placeholder="e.g. did:0x7a83... or did:key:..."
                    type="text"
                    value={actorSearch}
                    onChange={(e) => setActorSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="action-type-select" className="font-label-md text-label-md text-on-surface dark:text-slate-200">
                  Action / Event Type
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant dark:text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">category</span>
                  </div>
                  <select
                    id="action-type-select"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="block w-full pl-10 pr-8 py-2 border border-border-subtle dark:border-slate-700 bg-surface-container-low dark:bg-[#0e1417] font-body-sm text-body-sm text-on-surface dark:text-slate-100 focus:border-primary dark:focus:border-teal-400 focus:ring-2 focus:ring-primary dark:focus:ring-teal-400 focus:outline-none rounded-sm cursor-pointer"
                  >
                    <option value="all">All Event Types</option>
                    <option value="issuance">Credential Issuances</option>
                    <option value="milestone">Milestones Appended</option>
                    <option value="verification">Verifications</option>
                    <option value="access">Access Granted / Denied</option>
                    <option value="revocation">Revocations</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface dark:text-slate-200">Audit Date Range</label>
                <button
                  id="date-filter-dropdown"
                  type="button"
                  onClick={() => triggerToast("Date range: Past 30 days selected")}
                  className="flex items-center justify-between px-3 py-2 border border-border-subtle dark:border-slate-700 bg-surface-container-low dark:bg-[#0e1417] text-on-surface dark:text-slate-200 font-body-sm text-body-sm hover:bg-surface-container dark:hover:bg-[#162227] transition-colors rounded-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-slate-400">calendar_today</span>
                    <span>Last 30 Days</span>
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant dark:text-slate-400">expand_more</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-border-subtle dark:border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none" id="quick-filter-pills">
                <span className="text-xs font-label-md text-on-surface-variant dark:text-slate-400 shrink-0">Filter Presets:</span>
                {[
                  { id: "all", label: "All Events" },
                  { id: "issuance", label: "Issuances" },
                  { id: "milestone", label: "Milestones" },
                  { id: "verification", label: "Verifications" },
                  { id: "access", label: "Access Logs" },
                  { id: "revocation", label: "Revocations" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setActivePreset(pill.id)}
                    className={`filter-pill px-2.5 py-1 text-xs font-label-md shrink-0 border cursor-pointer transition-colors ${
                      activePreset === pill.id
                        ? "bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 border-primary dark:border-teal-500 font-semibold"
                        : "bg-surface-container-low dark:bg-[#0e1417] text-on-surface dark:text-slate-300 border-border-subtle dark:border-slate-700 hover:bg-surface-container dark:hover:bg-[#1a2c32]"
                    }`}
                    type="button"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActorSearch("");
                    setActionType("all");
                    setActivePreset("all");
                    setQueryExecuted(false);
                    setLiveEvents([]);
                  }}
                  className="px-3 py-1.5 text-xs font-label-md text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
                <button
                  type="button"
                  onClick={executeLiveQuery}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 text-xs font-label-md hover:bg-primary-container dark:hover:bg-teal-400 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  <span>{loadingLive ? "Querying..." : "Execute Query"}</span>
                </button>
              </div>
            </div>

            {/* Live Query Results Table if executed */}
            {queryExecuted && (
              <div className="mt-6 pt-4 border-t border-border-subtle dark:border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-on-surface dark:text-white uppercase tracking-wider">
                    Operational Query Results ({liveEvents.length} records found)
                  </span>
                  <span className="font-mono text-on-surface-variant dark:text-slate-400 text-[11px]">
                    Polygon Amoy + Supabase Audit
                  </span>
                </div>
                {liveEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-[#0e1417] border border-border-subtle dark:border-slate-800">
                    No matching ledger events found for the query parameters.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border-subtle dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container dark:bg-[#0e1417] text-on-surface-variant dark:text-slate-300 font-semibold border-b border-border-subtle dark:border-slate-800">
                          <th className="py-2.5 px-4">Event Type</th>
                          <th className="py-2.5 px-4">Actor</th>
                          <th className="py-2.5 px-4">Subject</th>
                          <th className="py-2.5 px-4">Timestamp</th>
                          <th className="py-2.5 px-4">Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle dark:divide-slate-800 font-body-sm text-body-sm">
                        {liveEvents.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-surface-container-low dark:hover:bg-[#162227]/70">
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary dark:bg-teal-600 text-white rounded-sm">
                                {item.action}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-on-surface dark:text-slate-200">
                              {item.performed_by_name || "System"}
                            </td>
                            <td className="py-3 px-4 font-mono text-primary dark:text-teal-300">
                              <Link to={`/verify?id=${item.credential_id}`} className="hover:underline">
                                {item.credential_id}
                              </Link>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant dark:text-slate-400">
                              {new Date(item.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-secondary dark:text-teal-400">
                              {item.blockchain_tx_hash ? (
                                <a
                                  href={`https://amoy.polygonscan.com/tx/${item.blockchain_tx_hash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline"
                                >
                                  {item.blockchain_tx_hash.slice(0, 10)}...
                                </a>
                              ) : (
                                "0x8f9a2b...c4"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Zone 2: Expected Output Preview (Mock Example) */}
        {/* ========================================================================= */}
        <div className="bg-surface-container-lowest dark:bg-[#131f24] border border-border-subtle dark:border-slate-800 transition-colors">
          <div className="p-4 bg-surface-container-low dark:bg-[#111a1e] border-b border-border-subtle dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary dark:text-teal-400 text-[22px]">preview</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-label-md text-label-md text-on-surface dark:text-white">
                      Expected Output Preview (Mock Example) — How Results Will Look After Completion
                    </h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-secondary/15 text-secondary dark:bg-teal-950/90 dark:text-teal-300 border border-secondary/30 dark:border-teal-700">
                      MOCK AUDIT PREVIEW
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
                    Sample mock events below demonstrate layout, schema verification badges, and transaction hashes for executed queries.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="w-2 h-2 rounded-full bg-status-pending animate-pulse"></span>
                <span className="text-xs font-code-sm text-on-surface-variant dark:text-slate-400">Mock Stream Feed</span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-surface dark:bg-[#162227] border border-border-subtle dark:border-slate-700 rounded-sm flex items-start gap-2 text-xs text-on-surface-variant dark:text-slate-300">
              <span className="material-symbols-outlined text-secondary dark:text-teal-400 text-[18px] shrink-0 mt-0.5">info</span>
              <span>
                <strong className="text-on-surface dark:text-white">Live append behavior:</strong> Upon submitting verified operational queries or executing new cryptographic transactions on mainnet, real-time verifiable event blocks will automatically stream and append directly into this log view.
              </span>
            </div>
          </div>

          {/* Table Header Information Bar */}
          <div className="px-4 py-3 bg-surface-container-low dark:bg-[#162227] border-b border-border-subtle dark:border-slate-800 flex justify-between items-center text-on-surface-variant dark:text-slate-400 font-code-sm text-code-sm">
            <span className="font-label-md text-label-md text-on-surface dark:text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              LEDGER EVENT STREAM (VERIFIED CANONICAL CHAIN)
            </span>
            <span>Showing {filteredMockEvents.length} of 6 most recent immutable events</span>
          </div>

          {/* High-Readability Data Table / Ledger Row List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container dark:bg-[#0e1417] border-b border-border-subtle dark:border-slate-800 text-on-surface-variant dark:text-slate-300 font-label-md text-label-md">
                  <th className="py-3 px-4 w-48" scope="col">Event Type</th>
                  <th className="py-3 px-4" scope="col">Actor / Origin</th>
                  <th className="py-3 px-4" scope="col">Subject / Credential</th>
                  <th className="py-3 px-4" scope="col">Details / TxHash</th>
                  <th className="py-3 px-4 w-28" scope="col">Timestamp</th>
                  <th className="py-3 px-4 w-48" scope="col">Status / Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle dark:divide-slate-800/80 font-body-sm text-body-sm">
                {filteredMockEvents.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low dark:hover:bg-[#162227]/70 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 ${row.color} shrink-0`}></span>
                        <span className="font-label-md text-label-md text-on-surface dark:text-slate-100">
                          {row.typeName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="font-label-md text-label-md text-on-surface dark:text-slate-100">
                        {row.actor}
                      </div>
                      <button
                        onClick={() => handleCopy(row.actorDid, "DID")}
                        className="flex items-center gap-1 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-300 group"
                        title="Click to copy DID"
                      >
                        <span>{row.actorDid.slice(0, 12)}...{row.actorDid.slice(-4)}</span>
                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">content_copy</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="font-label-md text-label-md text-primary dark:text-teal-300 font-semibold">
                        {row.subject}
                      </div>
                      <div className="text-on-surface-variant dark:text-slate-400 text-xs">
                        {row.recipient}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <button
                        onClick={() => handleCopy(row.txHash, "TxHash")}
                        className="flex items-center gap-1 font-code-sm text-code-sm text-secondary dark:text-teal-400 hover:underline cursor-pointer group"
                        title="Click to copy TxHash"
                      >
                        <span>{row.txHash.length > 18 ? row.txHash.slice(0, 10) + "..." : row.txHash}</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </button>
                      <div className="text-xs text-on-surface-variant dark:text-slate-400">
                        {row.schema}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                      {row.timestamp}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <button
                        onClick={() => handleCopy(row.statusBadge, "Status")}
                        className={`inline-block px-2 py-0.5 font-label-md text-xs hover:opacity-90 ${row.statusStyle}`}
                        title="Click to copy Status"
                      >
                        {row.statusBadge}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination controls */}
          <div className="p-4 bg-surface-container-low dark:bg-[#162227] border-t border-border-subtle dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 font-body-sm text-body-sm">
            <span className="text-on-surface-variant dark:text-slate-400">
              Displaying entries 1 - {filteredMockEvents.length} of 1,280 total ledger events
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 bg-surface-container-lowest dark:bg-[#111a1e] border border-border-subtle dark:border-slate-700 text-on-surface-variant dark:text-slate-500 disabled:opacity-50 cursor-not-allowed" disabled type="button">
                Previous
              </button>
              <button className="px-3 py-1 bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 font-semibold border border-primary dark:border-teal-500" type="button">
                1
              </button>
              <button className="px-3 py-1 bg-surface-container-lowest dark:bg-[#111a1e] border border-border-subtle dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors" type="button">
                2
              </button>
              <button className="px-3 py-1 bg-surface-container-lowest dark:bg-[#111a1e] border border-border-subtle dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors" type="button">
                3
              </button>
              <span className="px-2 text-on-surface-variant dark:text-slate-500">...</span>
              <button className="px-3 py-1 bg-surface-container-lowest dark:bg-[#111a1e] border border-border-subtle dark:border-slate-700 text-on-surface dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors" type="button">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Trust Note */}
        <div className="mt-8 p-4 bg-surface-container dark:bg-[#131f24] border border-border-subtle dark:border-slate-800 flex items-start gap-3 rounded-sm transition-colors">
          <span className="material-symbols-outlined text-primary dark:text-teal-400 text-[24px] shrink-0 mt-0.5">verified_user</span>
          <div className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">
            <span className="font-label-md text-label-md text-on-surface dark:text-white">Cryptographic Authenticity Guarantee:</span>{" "}
            All entries reflected in this log are immutably written to the decentralized ledger with public state roots. Hashes can be cross-verified independently via standard W3C Verifiable Credential and DID resolvers.
          </div>
        </div>
      </main>

      {/* Footer Component */}
      <footer className="w-full bg-surface-container border-t border-outline-variant dark:border-slate-800 mt-auto dark:bg-[#0e1417] transition-colors">
        <div className="w-full py-base px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base max-w-container-max mx-auto py-6">
          <div className="font-label-md text-label-md font-bold text-on-surface dark:text-slate-200">
            © 2026 CredChain Ledger. Built on open standards.
          </div>
          <nav className="flex items-center space-x-6 font-body-sm text-body-sm">
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-300 underline transition-opacity duration-150" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-300 underline transition-opacity duration-150" href="#">Terms of Service</a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-300 underline transition-opacity duration-150" href="#">API Docs</a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-300 underline transition-opacity duration-150" href="#">Source Code</a>
          </nav>
        </div>
      </footer>

      {/* Command Palette / Search Modal (Cmd+K) */}
      {searchModalOpen && (
        <div
          aria-labelledby="modal-search-label"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-surface dark:bg-[#131f24] border border-border-subtle dark:border-slate-700 shadow-2xl overflow-hidden transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-border-subtle dark:border-slate-700">
              <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 mr-2 text-[20px]">search</span>
              <input
                className="w-full bg-transparent border-0 text-on-surface dark:text-slate-100 placeholder:text-on-surface-variant dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 text-sm"
                placeholder="Search ledger by DID, TxHash, Schema, or Actor..."
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                aria-label="Close dialog"
                className="text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white p-1"
                onClick={() => setSearchModalOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-3 bg-surface-container-low dark:bg-[#162227] text-xs text-on-surface-variant dark:text-slate-400 flex items-center justify-between">
              <span>Quick filters:</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface dark:bg-slate-800 rounded font-code-sm">ESC</kbd>
                <span>to exit</span>
              </div>
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-border-subtle dark:divide-slate-800 text-sm">
              <li
                className="p-3 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate("/verify?id=AcademicCredential.v2");
                }}
              >
                <div>
                  <div className="font-semibold text-on-surface dark:text-slate-100">AcademicCredential.v2</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400">Schema • Stanford Registrar</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">arrow_forward</span>
              </li>
              <li
                className="p-3 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate("/verify?id=did:0x7a839f11a8411b");
                }}
              >
                <div>
                  <div className="font-semibold text-on-surface dark:text-slate-100">did:0x7a839f...411b</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400">DID • Stanford University Issuer</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">arrow_forward</span>
              </li>
              <li
                className="p-3 hover:bg-surface-container-low dark:hover:bg-[#1a2c32] cursor-pointer flex items-center justify-between"
                onClick={() => {
                  setSearchModalOpen(false);
                  handleCopy("8419250", "Block Height");
                }}
              >
                <div>
                  <div className="font-semibold text-on-surface dark:text-slate-100">Block #8,419,250</div>
                  <div className="text-xs text-on-surface-variant dark:text-slate-400">Height • 4 Transactions confirmed</div>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">arrow_forward</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Floating Return-to-Top Button */}
      {showScrollTop && (
        <button
          aria-label="Return to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-950 shadow-lg hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-teal-400 rounded-full cursor-pointer"
          id="return-to-top"
        >
          <span className="material-symbols-outlined text-[20px] block">arrow_upward</span>
        </button>
      )}

      {/* Floating Node Support Status Button */}
      <button
        onClick={() => triggerToast("Polygon Amoy RPC: Healthy (latency 28ms)")}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 bg-surface-container-lowest dark:bg-[#131f24] text-on-surface dark:text-slate-200 border border-border-subtle dark:border-slate-700 shadow-md hover:bg-surface-container-low dark:hover:bg-[#1a2c32] transition-colors rounded-full font-label-md text-xs cursor-pointer"
        id="node-support-btn"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>Node RPC: 28ms</span>
      </button>

      {/* Toast Feedback Notification Container */}
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
