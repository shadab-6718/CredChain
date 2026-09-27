import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserAuthBadge } from "../components/UserAuthBadge";

interface AdminPageProps {
  initialTab?: "issuers" | "incidents" | "telemetry";
  mode?: "admin" | "governance";
}

export const AdminPage: React.FC<AdminPageProps> = ({ initialTab, mode }) => {
  const { user, signInWithEmail, switchDemoRole } = useAuth();
  const location = useLocation();

  const isGovernance = mode === "governance" || location.pathname === "/governance";
  const isAdmin = !isGovernance;

  const isAuthorizedAdmin = user?.role === "admin" && user?.email === "shadabhussain@kitss.edu.in";

  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    const email = adminEmailInput.trim().toLowerCase();
    const password = adminPasswordInput.trim();

    if (email !== "shadabhussain@kitss.edu.in" || password !== "849204") {
      setAuthError("Access Denied: Invalid credentials. This portal is strictly restricted to authorized platform administrators only.");
      setIsAuthenticating(false);
      return;
    }

    try {
      await signInWithEmail("shadabhussain@kitss.edu.in", "849204", "admin", "Central Accreditation & Governance Board (KITS)");
      setToastMessage("Administrative clearance verified. Welcome, Shadab Hussain.");
      setTimeout(() => setToastMessage(""), 5000);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLockAdminSession = () => {
    switchDemoRole("holder");
    setAdminPasswordInput("");
    setToastMessage("Admin session locked. Switched to public holder role.");
    setTimeout(() => setToastMessage(""), 4000);
  };

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const defaultTab = initialTab || (isGovernance ? "incidents" : "issuers");
  const [activeTab, setActiveTab] = useState<"issuers" | "incidents" | "telemetry">(defaultTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (location.pathname === "/governance") {
      setActiveTab("incidents");
    } else if (location.pathname === "/admin") {
      setActiveTab("issuers");
    }
  }, [location.pathname, initialTab]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  const initialIssuers = [
    {
      id: "did:cred:iitdelhi",
      name: "Indian Institute of Technology Delhi",
      category: "Higher Education / University",
      registeredAt: "2024-01-15",
      credentialsIssued: 1420,
      status: "ACCREDITED",
      governingBody: "Ministry of Education / UGC",
    },
    {
      id: "did:cred:abc-institute",
      name: "ABC Institute of Technology",
      category: "Higher Education / University",
      registeredAt: "2024-03-20",
      credentialsIssued: 840,
      status: "ACCREDITED",
      governingBody: "AICTE / State Board",
    },
    {
      id: "did:cred:landrecords-dl",
      name: "Directorate of Land Records & Surveys",
      category: "Municipal & Property Registry",
      registeredAt: "2024-06-10",
      credentialsIssued: 512,
      status: "ACCREDITED",
      governingBody: "Dept of Revenue",
    },
    {
      id: "did:cred:globaltech",
      name: "Global Tech Institute",
      category: "Professional Certification",
      registeredAt: "2024-08-01",
      credentialsIssued: 2150,
      status: "ACCREDITED",
      governingBody: "ISO 27001 Body",
    },
  ];

  const [issuersList, setIssuersList] = useState(initialIssuers);
  const [issuerSearch, setIssuerSearch] = useState("");
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // New Institution Form state
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDid, setNewOrgDid] = useState("");
  const [newOrgCategory, setNewOrgCategory] = useState("Higher Education / University");
  const [newOrgGoverningBody, setNewOrgGoverningBody] = useState("AICTE / UGC");

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgDid.trim()) return;

    const newEntry = {
      id: newOrgDid.trim().startsWith("did:") ? newOrgDid.trim() : `did:cred:${newOrgDid.trim().toLowerCase().replace(/\s+/g, "-")}`,
      name: newOrgName.trim(),
      category: newOrgCategory,
      registeredAt: new Date().toISOString().split("T")[0],
      credentialsIssued: 0,
      status: "ACCREDITED",
      governingBody: newOrgGoverningBody.trim() || "National Accreditation Council",
    };

    setIssuersList([newEntry, ...issuersList]);
    setShowOnboardModal(false);
    setNewOrgName("");
    setNewOrgDid("");
    setToastMessage(`Successfully onboarded & whitelisted ${newEntry.name} on Polygon Amoy.`);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const toggleAccreditation = (id: string) => {
    setIssuersList(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, status: item.status === "ACCREDITED" ? "SUSPENDED" : "ACCREDITED" }
          : item
      )
    );
  };

  const filteredIssuers = issuersList.filter(
    (iss) =>
      iss.name.toLowerCase().includes(issuerSearch.toLowerCase()) ||
      iss.id.toLowerCase().includes(issuerSearch.toLowerCase()) ||
      iss.category.toLowerCase().includes(issuerSearch.toLowerCase())
  );

  const incidents = [
    {
      incidentId: "INC-2026-SEC12-01",
      credentialId: "BTECH-2026-FORGED",
      targetName: "Bachelor of Technology in CSE",
      detectedAt: "Just now",
      threatType: "Section 12 Forged Degree — Prerequisite Milestone Trail Absent",
      details: "Certificate presented with valid format but missing cryptographic prerequisite milestone trail (Sem 1-4, Capstone). Final degree detached from antecedent academic records.",
      verdict: "BLOCKED AT CONSENSUS",
      severity: "CRITICAL",
    },
    {
      incidentId: "INC-2026-SEC12-02",
      credentialId: "LAND-DEED-SYNTH-99",
      targetName: "Commercial Land Title Deed (Plot 4B)",
      detectedAt: "2 hours ago",
      threatType: "Severed Title Conveyance Link",
      details: "Prior deed event ID referenced nonexistent parent hash. Double-pledge attempt intercepted.",
      verdict: "BLOCKED AT CONSENSUS",
      severity: "HIGH",
    },
    {
      incidentId: "INC-2026-TAMPER-03",
      credentialId: "BTECH-2026-001 (Modified PDF)",
      targetName: "Bachelor of Technology",
      detectedAt: "Yesterday",
      threatType: "SHA-256 Bit-Flip Tamper",
      details: "Candidate modified GPA from 7.8 to 9.8. Hash mismatch against Polygon Amoy anchor.",
      verdict: "HASH INTEGRITY FAILED",
      severity: "CRITICAL",
    },
  ];

  return (
    <div className="bg-background dark:bg-[#0b1315] text-on-surface dark:text-slate-100 font-body-lg text-body-lg min-h-screen flex flex-col antialiased transition-colors duration-200">
      {/* TopNavBar */}
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
            <nav className="hidden md:flex items-center gap-6 font-body-lg text-body-lg text-xs">
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1" to="/explorer">
                Explorer
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1" to="/wallet">
                Wallet
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1" to="/dashboard">
                Dashboard
              </Link>
              <Link
                className={
                  isGovernance
                    ? "text-primary dark:text-teal-400 border-b-2 border-primary dark:border-teal-400 font-semibold pb-1 py-1"
                    : "text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1"
                }
                to="/governance"
              >
                Governance Portal
              </Link>
              <Link
                className={
                  isAdmin
                    ? "text-primary dark:text-teal-400 border-b-2 border-primary dark:border-teal-400 font-semibold pb-1 py-1"
                    : "text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1"
                }
                to="/admin"
              >
                Admin Portal
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors py-1" to="/audit">
                Audit
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <UserAuthBadge />
            <button
              aria-label="Toggle color mode"
              className="p-2 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#162428] hover:bg-surface-container dark:hover:bg-[#1e3238] text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-teal-400 transition-colors flex items-center justify-center cursor-pointer"
              onClick={toggleTheme}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-10">
        {isAdmin && !isAuthorizedAdmin ? (
          /* Admin Security Challenge Card */
          <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 bg-surface dark:bg-[#121c1f] border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-xl shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 mb-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                PRD 7.1 Administrative Clearance
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-white">
                Platform Administrator Login
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-400 mt-2 leading-relaxed">
                The Platform Admin Portal is restricted to designated governance authorities. Enter your administrator ID and security PIN to proceed.
              </p>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Administrator Gmail / ID
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">mail</span>
                  <input
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="shadabhussain@kitss.edu.in"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded-lg text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Security Passcode / Random Numbers PIN
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">key</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="Enter 6-digit numeric passcode"
                    className="w-full pl-10 pr-10 py-2.5 text-sm font-mono tracking-wider bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded-lg text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>



              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">lock_open</span>
                    <span>Authenticate &amp; Access Admin Portal</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/governance"
                  className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-teal-400 transition-colors"
                >
                  ← Return to Section 12 Public Governance Portal
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <>
            {isAdmin && isAuthorizedAdmin && (
              <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-indigo-900 dark:text-indigo-200">
                    Active Administrator Session: <strong>shadabhussain@kitss.edu.in</strong> (Central Accreditation &amp; Governance Board - KITS)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLockAdminSession}
                  className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-surface dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer text-on-surface dark:text-gray-300 font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Lock Admin Session
                </button>
              </div>
            )}
            {/* Title & Badge */}
            <div className="mb-8 pb-6 border-b border-border-subtle dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isAdmin ? "bg-indigo-700 text-white" : "bg-teal-800 text-white"}`}>
                {isAdmin ? "Platform Administration" : "Governance & Security"}
              </span>
              <span className="text-xs font-mono text-on-surface-variant dark:text-slate-400">
                {isAdmin ? "PRD Section 7.1 Institutional Whitelist & Authority Management" : "PRD Section 12 Consensus Smart Trust Registry & Incident Monitor"}
              </span>
            </div>
            <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-on-surface dark:text-white">
              {isAdmin ? "Platform Admin Portal" : "Section 12 Governance & Trust Registry"}
            </h1>
            <p className="font-body-sm text-xs md:text-sm text-on-surface-variant dark:text-slate-400 mt-1">
              {isAdmin
                ? "Manage accredited university and land registry DIDs, review institutional accreditations, and onboard new certifying authorities."
                : "Decentralized ecosystem monitoring: track cryptographic anti-forgery consensus defenses and inspect intercepted forged milestone attacks in real time."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowOnboardModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                + Onboard Institution (PRD 7.1)
              </button>
            )}
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ALL SYSTEMS HEALTHY
            </span>
          </div>
        </div>

        {/* Telemetry Architecture Row (4 Key Anchors) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <div className="p-4 bg-surface dark:bg-[#121c1f] border border-border-subtle dark:border-[#223138] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px]">Consensus Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-base text-on-surface dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-lg">deployed_code</span>
              Polygon Amoy
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle dark:border-[#223138] text-[11px] font-mono text-gray-500 dark:text-gray-400 space-y-0.5">
              <div>Chain ID: 80002</div>
              <div>Block Time: 2.1s • Finality: Instant</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-4 bg-surface dark:bg-[#121c1f] border border-border-subtle dark:border-[#223138] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px]">Off-Chain Vault</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-base text-on-surface dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">cloud_done</span>
              IPFS Pinata Gateway
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle dark:border-[#223138] text-[11px] font-mono text-gray-500 dark:text-gray-400 space-y-0.5">
              <div>AES-256 GCM Two-Zone Vault</div>
              <div>SLA: 99.99% • Zero-Knowledge CIDs</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-4 bg-surface dark:bg-[#121c1f] border border-border-subtle dark:border-[#223138] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px]">Anti-Forgery Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-base text-on-surface dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-lg">shield</span>
              Section 12 Defense
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle dark:border-[#223138] text-[11px] font-mono text-gray-500 dark:text-gray-400 space-y-0.5">
              <div>Progressive Milestone Validator</div>
              <div>Orphaned Degrees: AUTO-REJECT</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-4 bg-surface dark:bg-[#121c1f] border border-border-subtle dark:border-[#223138] rounded-lg shadow-xs">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 dark:text-gray-400 font-semibold uppercase text-[10px]">Consent Handshake</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-bold text-base text-on-surface dark:text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-lg">handshake</span>
              Bilateral Time-Box
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle dark:border-[#223138] text-[11px] font-mono text-gray-500 dark:text-gray-400 space-y-0.5">
              <div>Auto-Expiring Grants (24h-30d)</div>
              <div>Zero Persistent PII Storage</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border-subtle dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("issuers")}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "issuers"
                ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            Accredited Issuer Registry ({issuersList.length})
            {isAdmin && (
              <span className="ml-1 text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold">
                PRD 7.1
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("incidents")}
            className={`pb-3 px-4 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "incidents"
                ? "text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">gpp_bad</span>
            Section 12 Incident Monitor ({incidents.length})
            {isGovernance && (
              <span className="ml-1 text-[10px] bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">
                PRD 12
              </span>
            )}
          </button>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage("")} className="text-emerald-600 hover:text-emerald-800 text-sm font-bold">×</button>
          </div>
        )}

        {/* TAB 1: Section 12 Incidents */}
        {activeTab === "incidents" && (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">warning</span>
              <div>
                <span className="font-bold">Section 12 Anti-Forgery Protocol Enforcement: </span>
                Every attempt to present a degree certificate or title deed without an unbroken, on-chain signed antecedent milestone trail triggers an instant consensus veto. Below is the live ledger security feed.
              </div>
            </div>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.incidentId}
                  className="p-5 bg-surface dark:bg-[#121c1f] border border-red-500/40 rounded-lg shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                        {inc.incidentId}
                      </span>
                      <span className="font-mono text-xs font-bold text-on-surface dark:text-white">
                        {inc.credentialId}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({inc.targetName})</span>
                    </div>

                    <h3 className="font-bold text-sm text-red-600 dark:text-red-400">
                      {inc.threatType}
                    </h3>

                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {inc.details}
                    </p>

                    <div className="text-[11px] font-mono text-gray-400 flex items-center gap-3 pt-1">
                      <span>Detected: {inc.detectedAt}</span>
                      <span>•</span>
                      <span>Protocol: Section 12 Recursive Validator</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    <span className="px-3 py-1 rounded bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                      {inc.verdict}
                    </span>
                    <Link
                      to={`/verify?id=${inc.credentialId.split(" ")[0]}`}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      Inspect Audit Trail →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Accredited Issuer Registry */}
        {activeTab === "issuers" && (
          <div className="space-y-4">
            {/* Header controls: Search & Onboard Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface dark:bg-[#121c1f] p-4 border border-border-subtle dark:border-slate-800 rounded-lg">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">search</span>
                <input
                  type="text"
                  placeholder="Search accredited universities, registries, or DIDs..."
                  value={issuerSearch}
                  onChange={(e) => setIssuerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 text-xs text-on-surface dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-base">add_moderator</span>
                + Onboard New Institution (PRD 7.1)
              </button>
            </div>

            <div className="overflow-x-auto border border-border-subtle dark:border-slate-800 rounded-lg bg-surface dark:bg-[#121c1f]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low dark:bg-slate-900 border-b border-border-subtle dark:border-slate-800 text-on-surface-variant dark:text-slate-400">
                    <th className="py-3 px-4 font-semibold">Institutional Entity</th>
                    <th className="py-3 px-4 font-semibold">DID Subject</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Credentials Anchored</th>
                    <th className="py-3 px-4 font-semibold">Regulatory Body</th>
                    <th className="py-3 px-4 font-semibold">Registry Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Governance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle dark:divide-slate-800">
                  {filteredIssuers.map((iss) => (
                    <tr key={iss.id} className="hover:bg-surface-container-low/40 dark:hover:bg-[#192b30]/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-on-surface dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-600 dark:text-teal-400 text-base">account_balance</span>
                        {iss.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-teal-600 dark:text-teal-300">
                        {iss.id}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                        {iss.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-on-surface dark:text-white">
                        {iss.credentialsIssued.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-medium">
                        {iss.governingBody}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          iss.status === "ACCREDITED"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        }`}>
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => toggleAccreditation(iss.id)}
                          className="text-[11px] text-gray-500 hover:text-red-500 underline font-medium cursor-pointer"
                          title="Toggle accreditation state"
                          type="button"
                        >
                          {iss.status === "ACCREDITED" ? "Suspend" : "Reinstate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredIssuers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No institutions match "{issuerSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONBOARD MODAL */}
        {showOnboardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-surface dark:bg-[#121f24] border border-border-subtle dark:border-slate-700 w-full max-w-lg rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500 text-xl">domain_add</span>
                  <h3 className="font-bold text-base text-on-surface dark:text-white">
                    Onboard New Institution (PRD 7.1)
                  </h3>
                </div>
                <button
                  onClick={() => setShowOnboardModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Institution / University Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Institute of Technology Karnataka"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full p-2.5 bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Decentralized Identifier (DID) / Public Key *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. did:cred:nitk-surathkal or 0x71C80F25A0B2C..."
                    value={newOrgDid}
                    onChange={(e) => setNewOrgDid(e.target.value)}
                    className="w-full p-2.5 font-mono bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">This DID is anchored into the smart contract whitelist.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Classification
                    </label>
                    <select
                      value={newOrgCategory}
                      onChange={(e) => setNewOrgCategory(e.target.value)}
                      className="w-full p-2.5 bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="Higher Education / University">Higher Education / University</option>
                      <option value="Municipal & Property Registry">Municipal & Property Registry</option>
                      <option value="State Examination Board">State Examination Board</option>
                      <option value="Vocational & Skill Council">Vocational & Skill Council</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Regulatory Body
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AICTE / UGC / State Dept"
                      value={newOrgGoverningBody}
                      onChange={(e) => setNewOrgGoverningBody(e.target.value)}
                      className="w-full p-2.5 bg-surface-container-lowest dark:bg-[#18262b] border border-border-subtle dark:border-slate-700 rounded text-on-surface dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded text-teal-800 dark:text-teal-200 text-[11px]">
                  ✓ Whitelists institution's cryptographic key on Polygon Amoy for milestone & credential issuance.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowOnboardModal(false)}
                    className="px-4 py-2 border border-border-subtle dark:border-slate-700 text-gray-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Confirm & Whitelist DID
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )}
  </main>
    </div>
  );
};
