import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

export const AuthHubPage: React.FC = () => {
  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();

  // Dark/Light Mode state with persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Simulation tab state: 'issuer' | 'holder' | 'verifier'
  const [previewRole, setPreviewRole] = useState<"issuer" | "holder" | "verifier">("issuer");

  // Return to top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const previewData = {
    issuer: {
      route: "/auth/issuer",
      dashboard: "/issuer/dashboard",
      perm: "ISSUANCE_WRITE",
      msg: (
        <>
          <p>
            <span className="text-secondary dark:text-cyan-400">POST /api/v1/auth/exchange:</span> Validating institutional SSO & domain registry
          </p>
          <p>
            <span className="text-status-valid dark:text-emerald-400">[200 OK]</span> Session token created. Zero-Knowledge session minted.
          </p>
          <p className="text-on-surface dark:text-white font-semibold">
            -&gt; Target Gateway: /issuer/dashboard (Permission: ISSUANCE_WRITE)
          </p>
        </>
      ),
    },
    holder: {
      route: "/auth/holder",
      dashboard: "/holder/dashboard",
      perm: "CREDENTIAL_STORAGE",
      msg: (
        <>
          <p>
            <span className="text-secondary dark:text-cyan-400">POST /api/v1/vault/resolve:</span> Decrypting client-side credential storage with OAuth
          </p>
          <p>
            <span className="text-status-valid dark:text-emerald-400">[200 OK]</span> Passkey authenticated. Local biometric envelope accessible.
          </p>
          <p className="text-on-surface dark:text-white font-semibold">
            -&gt; Target Gateway: /holder/dashboard (Permission: SOVEREIGN_OWNER)
          </p>
        </>
      ),
    },
    verifier: {
      route: "/auth/verifier",
      dashboard: "/verifier/dashboard",
      perm: "PROOF_INSPECT",
      msg: (
        <>
          <p>
            <span className="text-secondary dark:text-cyan-400">POST /api/v1/verifier/session:</span> Handshake with decentralized Merkle node
          </p>
          <p>
            <span className="text-status-valid dark:text-emerald-400">[200 OK]</span> Verification engine loaded with live smart contract cache.
          </p>
          <p className="text-on-surface dark:text-white font-semibold">
            -&gt; Target Gateway: /verifier/dashboard (Permission: PUBLIC_INSPECTOR)
          </p>
        </>
      ),
    },
  };

  return (
    <div className="bg-background dark:bg-[#080f11] text-on-background dark:text-[#f1f5f9] antialiased min-h-screen flex flex-col font-body-sm transition-colors duration-200" id="top">
      {/* TopNavBar (Shared Component Execution) */}
      <header className="w-full border-b border-border-subtle dark:border-cyan-900/30 bg-surface/95 dark:bg-[#0d1517]/95 backdrop-blur-md px-margin-mobile md:px-margin-desktop sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-[1280px] mx-auto h-16 flex items-center justify-between">
          {/* Brand Logo / Anchor */}
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-3 group" to="/" title="CredChain Decentralized Identity Hub">
              <img
                alt="CredChain Identity Symbol"
                className="w-9 h-9 object-contain transform transition-transform group-hover:scale-105 logo-pulse-glow"
                src="/logo.svg"
              />
              <span className="font-headline-md text-headline-md font-bold text-primary dark:text-[#00E5FF] tracking-tight">
                CredChain
              </span>
            </Link>
            {/* Live System Ledger Indicator Badge */}
            <div className="hidden sm:flex items-center gap-2 border border-border-subtle dark:border-cyan-900/50 px-2.5 py-1 bg-surface-container-lowest dark:bg-[#151d1f]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-valid dark:bg-emerald-400"></span>
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] font-mono">
                POLYGON AMOY &amp; BASE: SYNCED
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-on-surface-variant dark:text-[#94a3b8] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" to="/verify">
              Verify
            </Link>
            <Link className="text-on-surface-variant dark:text-[#94a3b8] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" to="/auth/issuer">
              Institutions
            </Link>
            <Link className="text-on-surface-variant dark:text-[#94a3b8] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" to="/explorer">
              Documentation
            </Link>
          </nav>

          {/* Trailing Action Cluster */}
          <div className="flex items-center gap-3">
            {/* Dark/Light Mode Toggle Button */}
            <button
              aria-label="Toggle visual theme"
              onClick={toggleTheme}
              className="p-2 border border-border-subtle dark:border-cyan-900/40 text-on-surface dark:text-slate-200 hover:bg-surface-container dark:hover:bg-[#1b2629] transition-all flex items-center justify-center cursor-pointer rounded"
              id="themeToggle"
              title="Toggle Light / Dark mode"
            >
              <span className="material-symbols-outlined block dark:hidden text-amber-500">dark_mode</span>
              <span className="material-symbols-outlined hidden dark:block text-[#00E5FF]">light_mode</span>
            </button>
            {/* Security Protocol Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container dark:bg-[#151d1f] border border-border-subtle dark:border-cyan-900/40 text-on-surface-variant dark:text-[#94a3b8] font-label-md text-label-md">
              <span className="material-symbols-outlined text-primary dark:text-[#00E5FF]">shield</span>
              <span>W3C DID/VC</span>
            </div>
            <Link
              className="hidden sm:inline-flex items-center gap-1 text-on-surface-variant dark:text-[#94a3b8] hover:text-primary dark:hover:text-[#00E5FF] font-label-md text-label-md px-3 py-2 border border-border-subtle dark:border-cyan-900/40 hover:bg-surface-container dark:hover:bg-[#1b2629] transition-colors"
              to="/#support"
            >
              <span className="material-symbols-outlined">help_outline</span>
              <span>Support</span>
            </Link>
            {/* Connect Wallet Button — Holder Only */}
            {(user?.role === "holder" || previewRole === "holder") && (
              <button
                onClick={connectWallet}
                className="bg-primary dark:bg-[#006064] text-on-primary hover:opacity-90 dark:hover:bg-[#00838F] font-label-md text-label-md px-4 py-2 flex items-center gap-2 transition-all border border-transparent dark:border-cyan-500/30 cursor-pointer"
              >
                <span className="material-symbols-outlined">account_balance_wallet</span>
                <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 ledger-grid bg-background dark:bg-[#080f11]">
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pt-16 pb-12 border-b border-border-subtle dark:border-cyan-900/30 bg-surface/90 dark:bg-[#0d1517]/90 backdrop-blur-sm">
          <div className="max-w-3xl">
            {/* Supabase + DID Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 border border-border-subtle dark:border-cyan-900/40 bg-surface-container-low dark:bg-[#151d1f]">
              <span className="inline-block w-2 h-2 bg-secondary dark:bg-[#00E5FF]"></span>
              <span className="font-label-md text-label-md text-on-surface dark:text-[#e2e8f0]">
                Protected by Supabase Auth &amp; W3C DID Standard
              </span>
            </div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface dark:text-white uppercase tracking-tight mb-4">
              Trusted Credentials. Verified in Seconds.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-[#94a3b8] max-w-2xl leading-relaxed">
              Issue, own, and verify certificates and records with tamper-evident blockchain proof. Built upon sovereign cryptography and immutable distributed registers.
            </p>
            {/* Frictionless Auth Notice */}
            <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-on-surface-variant dark:text-[#94a3b8] font-code-sm text-code-sm">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-valid dark:text-emerald-400 text-base">check_circle</span>
                <span>Zero wallet required on signup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-valid dark:text-emerald-400 text-base">check_circle</span>
                <span>Institutional Google &amp; SSO Auth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-status-valid dark:text-emerald-400 text-base">check_circle</span>
                <span>ERC-734 / Merkle Multi-Anchor</span>
              </div>
            </div>
          </div>
        </section>

        {/* Role Hub Interactive Grid (3 Distinct Pillars) */}
        <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border-subtle dark:border-cyan-900/30 gap-4">
            <div>
              <span className="font-label-md text-label-md text-primary dark:text-[#00E5FF] tracking-widest uppercase block mb-1">
                Select Access Portal
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white">
                Choose Your Operational Role
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
              Strict role-based redirection to authenticated dashboard environments.
            </p>
          </div>

          {/* Bento Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CARD 1: ISSUER */}
            <div className="bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-cyan-900/30 p-6 flex flex-col justify-between hover:border-primary dark:hover:border-[#00E5FF] transition-all duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle dark:border-cyan-900/30">
                  <span className="bg-primary dark:bg-[#006064] text-on-primary font-label-md text-label-md px-2.5 py-1 tracking-wider uppercase">
                    ISSUER
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] font-mono">
                    PORTAL: 01
                  </span>
                </div>
                <div className="w-10 h-10 bg-surface-container dark:bg-[#1b2629] flex items-center justify-center mb-4 text-primary dark:text-[#00E5FF] border border-border-subtle dark:border-cyan-900/40">
                  <span className="material-symbols-outlined">corporate_fare</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white mb-2">
                  Issue Credentials
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8] mb-6 leading-relaxed">
                  For universities, colleges &amp; authorized institutions (Educational degrees, land registry titles, accreditations).
                </p>
                <div className="border-t border-border-subtle dark:border-cyan-900/30 pt-4 mb-6">
                  <span className="font-label-md text-label-md text-on-surface dark:text-[#e2e8f0] block mb-3 uppercase tracking-wider">
                    Core Capabilities
                  </span>
                  <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary dark:bg-[#00E5FF] mt-2 flex-shrink-0"></span>
                      <span>Issue verifiable credentials conforming to W3C standards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary dark:bg-[#00E5FF] mt-2 flex-shrink-0"></span>
                      <span>Upload &amp; batch hash documents via SHA-256 Merkle trees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary dark:bg-[#00E5FF] mt-2 flex-shrink-0"></span>
                      <span>Manage cryptographic revocations on registry smart contracts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-primary dark:bg-[#00E5FF] mt-2 flex-shrink-0"></span>
                      <span>Complete auditable institutional issuance history ledger</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-border-subtle dark:border-cyan-900/30">
                <Link
                  className="w-full bg-primary dark:bg-[#006064] hover:bg-primary-container dark:hover:bg-[#00838F] text-on-primary font-label-md text-label-md py-3 px-4 flex items-center justify-between transition-colors"
                  to="/auth/issuer"
                >
                  <span>Continue as Issuer</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <div className="mt-2 text-center">
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8]">
                    Redirects: /issuer/dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: HOLDER */}
            <div className="bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-cyan-900/30 p-6 flex flex-col justify-between hover:border-secondary dark:hover:border-cyan-400 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle dark:border-cyan-900/30">
                  <span className="bg-secondary dark:bg-[#0284c7] text-on-secondary font-label-md text-label-md px-2.5 py-1 tracking-wider uppercase">
                    HOLDER
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] font-mono">
                    PORTAL: 02
                  </span>
                </div>
                <div className="w-10 h-10 bg-surface-container dark:bg-[#1b2629] flex items-center justify-center mb-4 text-secondary dark:text-cyan-400 border border-border-subtle dark:border-cyan-900/40">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white mb-2">
                  Own Credentials
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8] mb-6 leading-relaxed">
                  For students, graduates &amp; record holders (Store, curate, and share verified achievements and property rights).
                </p>
                <div className="border-t border-border-subtle dark:border-cyan-900/30 pt-4 mb-6">
                  <span className="font-label-md text-label-md text-on-surface dark:text-[#e2e8f0] block mb-3 uppercase tracking-wider">
                    Core Capabilities
                  </span>
                  <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-secondary dark:bg-cyan-400 mt-2 flex-shrink-0"></span>
                      <span>Personal decentralized identity vault &amp; asset storage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-secondary dark:bg-cyan-400 mt-2 flex-shrink-0"></span>
                      <span>Instant selective disclosure with zero attribute leakage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-secondary dark:bg-cyan-400 mt-2 flex-shrink-0"></span>
                      <span>Cryptographically controlled verifier access tokens</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-secondary dark:bg-cyan-400 mt-2 flex-shrink-0"></span>
                      <span>Time-limited verifiable proof URLs &amp; self-signed claims</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-border-subtle dark:border-cyan-900/30">
                <Link
                  className="w-full bg-secondary dark:bg-[#0284c7] hover:bg-secondary-container hover:text-on-secondary-container dark:hover:bg-[#0369a1] text-on-secondary font-label-md text-label-md py-3 px-4 flex items-center justify-between transition-colors"
                  to="/auth/holder"
                >
                  <span>Continue as Holder</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <div className="mt-2 text-center">
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8]">
                    Redirects: /holder/dashboard
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: VERIFIER */}
            <div className="bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-cyan-900/30 p-6 flex flex-col justify-between hover:border-status-valid dark:hover:border-emerald-400 transition-all duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle dark:border-cyan-900/30">
                  <span className="bg-status-valid dark:bg-emerald-600 text-on-primary font-label-md text-label-md px-2.5 py-1 tracking-wider uppercase">
                    VERIFIER
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] font-mono">
                    PORTAL: 03
                  </span>
                </div>
                <div className="w-10 h-10 bg-surface-container dark:bg-[#1b2629] flex items-center justify-center mb-4 text-status-valid dark:text-emerald-400 border border-border-subtle dark:border-cyan-900/40">
                  <span className="material-symbols-outlined">fact_check</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white mb-2">
                  Verify Credentials
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8] mb-6 leading-relaxed">
                  For employers, banks &amp; authorized verifiers (Instant mathematical verification with zero-trust cryptographic certainty).
                </p>
                <div className="border-t border-border-subtle dark:border-cyan-900/30 pt-4 mb-6">
                  <span className="font-label-md text-label-md text-on-surface dark:text-[#e2e8f0] block mb-3 uppercase tracking-wider">
                    Core Capabilities
                  </span>
                  <ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-valid dark:bg-emerald-400 mt-2 flex-shrink-0"></span>
                      <span>Scan dynamic QR codes &amp; verify verifiable presentations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-valid dark:bg-emerald-400 mt-2 flex-shrink-0"></span>
                      <span>Verify cryptographic signatures directly against on-chain Merkle root</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-valid dark:bg-emerald-400 mt-2 flex-shrink-0"></span>
                      <span>Zero-knowledge attribute inspection without third-party phone home</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-status-valid dark:bg-emerald-400 mt-2 flex-shrink-0"></span>
                      <span>Automated batch background checking API &amp; webhook alerts</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-border-subtle dark:border-cyan-900/30">
                <Link
                  className="w-full bg-surface-container-highest dark:bg-[#1b2629] text-on-surface dark:text-[#e2e8f0] border border-border-subtle dark:border-cyan-900/40 hover:bg-status-valid dark:hover:bg-emerald-600 hover:text-white font-label-md text-label-md py-3 px-4 flex items-center justify-between transition-colors"
                  to="/auth/verifier"
                >
                  <span>Continue as Verifier</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <div className="mt-2 text-center">
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8]">
                    Redirects: /verifier/dashboard
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Simulation & Protocol Specification Section */}
        <section className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-12 border-t border-border-subtle dark:border-cyan-900/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Dual Anchor Protocol Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border-l-4 border-primary dark:border-[#00E5FF] pl-4">
                <h3 className="font-headline-md text-headline-md text-on-surface dark:text-white">
                  Dual-Anchor Verification Framework
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8] mt-1">
                  Purpose-built schemas tailored for academic tenure and legal land title rights.
                </p>
              </div>
              <div className="space-y-4">
                {/* Academic Anchor */}
                <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface-container-lowest dark:bg-[#151d1f]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary dark:text-[#00E5FF]">school</span>
                    <h4 className="font-label-md text-label-md text-on-surface dark:text-white">
                      Higher Education Degrees &amp; Micro-credentials
                    </h4>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
                    Implements the OpenCerts schema &amp; ELMO European standards. Eliminates diploma mills through institutional DID signing keys.
                  </p>
                  <div className="mt-3 flex items-center gap-4 font-code-sm text-code-sm font-mono text-on-surface-variant dark:text-[#94a3b8]">
                    <span>FORMAT: JSON-LD / VC</span>
                    <span>PROOF: Ed25519Signature2020</span>
                  </div>
                </div>

                {/* Land Anchor */}
                <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface-container-lowest dark:bg-[#151d1f]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary dark:text-cyan-400">holiday_village</span>
                    <h4 className="font-label-md text-label-md text-on-surface dark:text-white">
                      Land Registry &amp; Cadastral Titles
                    </h4>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#94a3b8]">
                    State-level cadastral parcel identification tied directly to decentralized timestamp proofs, ensuring absolute chain-of-custody.
                  </p>
                  <div className="mt-3 flex items-center gap-4 font-code-sm text-code-sm font-mono text-on-surface-variant dark:text-[#94a3b8]">
                    <span>FORMAT: GeoJSON + Merkle Hash</span>
                    <span>ANCHOR: Block 21,940,302</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Role Routing & Auth Architecture Interactive Tester */}
            <div className="lg:col-span-7">
              <div className="border border-border-subtle dark:border-cyan-900/30 bg-surface-container-lowest dark:bg-[#151d1f] p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-subtle dark:border-cyan-900/30 mb-6">
                  <div>
                    <span className="font-code-sm text-code-sm font-mono text-primary dark:text-[#00E5FF] block">
                      SUPABASE AUTH ENGINE
                    </span>
                    <h4 className="font-headline-md text-headline-md text-on-surface dark:text-white">
                      Role Redirection Engine
                    </h4>
                  </div>
                  <div className="flex border border-border-subtle dark:border-cyan-900/40">
                    {(["issuer", "holder", "verifier"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setPreviewRole(r)}
                        className={`px-3 py-1.5 font-label-md text-label-md capitalize cursor-pointer transition-colors ${
                          previewRole === r
                            ? "bg-primary dark:bg-[#006064] text-on-primary"
                            : "text-on-surface-variant dark:text-[#94a3b8] hover:bg-surface-container dark:hover:bg-[#1b2629]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulation Terminal Box */}
                <div className="bg-surface-container-low dark:bg-[#0d1517] p-4 border border-border-subtle dark:border-cyan-900/40 font-mono text-xs text-on-surface-variant dark:text-[#94a3b8] space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50 dark:border-cyan-900/30">
                    <span className="text-status-valid dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-status-valid dark:bg-emerald-400 animate-pulse"></span>
                      READY FOR HANDSHAKE
                    </span>
                    <span className="text-primary dark:text-[#00E5FF] font-bold">
                      ROUTE: {previewData[previewRole].route}
                    </span>
                  </div>
                  <div className="pt-2">{previewData[previewRole].msg}</div>
                </div>

                {/* Dynamic Capabilities Inspection */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-3 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#1b2629]">
                    <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] block">
                      AUTHENTICATION PROVIDER
                    </span>
                    <span className="font-label-md text-label-md text-on-surface dark:text-white mt-1 block">
                      Google Workspace / Supabase JWT
                    </span>
                  </div>
                  <div className="p-3 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#1b2629]">
                    <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8] block">
                      WALLET LINKING STEP
                    </span>
                    <span className="font-label-md text-label-md text-on-surface dark:text-white mt-1 block">
                      Deferred until batch transaction
                    </span>
                  </div>
                </div>

                {/* Live Verification Ledger Preview */}
                <div className="mt-4 pt-4 border-t border-border-subtle dark:border-cyan-900/30 flex items-center justify-between font-code-sm text-code-sm text-on-surface-variant dark:text-[#94a3b8]">
                  <span>Cryptographic Root: 0x9f4a...e12d</span>
                  <span className="text-status-valid dark:text-emerald-400 font-mono">MERKLE VALIDATED</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Markers & Proof Standards */}
        <section className="border-t border-border-subtle dark:border-cyan-900/30 bg-surface-container-low dark:bg-[#0d1517] py-10">
          <div className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#151d1f]">
                <span className="block font-headline-lg text-headline-lg text-primary dark:text-[#00E5FF] font-mono">1.4M+</span>
                <span className="font-label-md text-label-md text-on-surface-variant dark:text-[#94a3b8] mt-1 block">
                  Verifiable Credentials
                </span>
              </div>
              <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#151d1f]">
                <span className="block font-headline-lg text-headline-lg text-primary dark:text-[#00E5FF] font-mono">320+</span>
                <span className="font-label-md text-label-md text-on-surface-variant dark:text-[#94a3b8] mt-1 block">
                  Accredited Issuers
                </span>
              </div>
              <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#151d1f]">
                <span className="block font-headline-lg text-headline-lg text-status-valid dark:text-emerald-400 font-mono">&lt; 0.2s</span>
                <span className="font-label-md text-label-md text-on-surface-variant dark:text-[#94a3b8] mt-1 block">
                  Mathematical Proof Latency
                </span>
              </div>
              <div className="p-4 border border-border-subtle dark:border-cyan-900/30 bg-surface dark:bg-[#151d1f]">
                <span className="block font-headline-lg text-headline-lg text-primary dark:text-[#00E5FF] font-mono">100%</span>
                <span className="font-label-md text-label-md text-on-surface-variant dark:text-[#94a3b8] mt-1 block">
                  Open W3C Standard
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Shared Component Execution) */}
      <footer className="w-full border-t border-border-subtle dark:border-cyan-900/30 bg-surface-container-low dark:bg-[#0d1517] px-margin-mobile md:px-margin-desktop py-base transition-colors duration-200">
        <div className="max-w-[1280px] mx-auto py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border-subtle dark:border-cyan-900/30">
            <div className="flex items-center gap-3">
              <img
                alt="CredChain Identity Symbol"
                className="w-7 h-7 object-contain logo-pulse-glow"
                src="/logo.svg"
              />
              <span className="text-headline-md font-headline-md font-bold text-primary dark:text-[#00E5FF]">CredChain</span>
              <span className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#94a3b8] border-l border-border-subtle dark:border-cyan-900/50 pl-3 ml-2">
                Open Trust Ledger Infrastructure
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <a className="text-on-surface-variant dark:text-[#94a3b8] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#network-status">
                Network Status
              </a>
              <a className="text-on-surface-variant dark:text-[#94a3b8] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#security-policy">
                Security Policy
              </a>
              <a className="text-on-surface-variant dark:text-[#94a3b8] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#verification-protocol">
                Verification Protocol
              </a>
              <a className="text-on-surface-variant dark:text-[#94a3b8] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#terms-of-trust">
                Terms of Trust
              </a>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-body-sm font-body-sm text-on-surface-variant dark:text-[#94a3b8] gap-4">
            <p>© 2026 CredChain Ledger Infrastructure. All credentials cryptographically verifiable on-chain.</p>
            <p className="font-code-sm text-code-sm font-mono">Consensus Anchor: SHA-256 // W3C Verifiable Credentials 2.0</p>
          </div>
        </div>
      </footer>

      {/* Floating Return to Top Button */}
      {showScrollTop && (
        <button
          aria-label="Return to top of page"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 bg-surface-container-lowest dark:bg-[#151d1f] text-primary dark:text-[#00E5FF] border border-border-subtle dark:border-cyan-900/50 shadow-lg hover:shadow-cyan-500/20 hover:border-primary dark:hover:border-[#00E5FF] transition-all duration-300 rounded cursor-pointer"
          id="returnToTopBtn"
        >
          <span className="material-symbols-outlined text-2xl block">arrow_upward</span>
        </button>
      )}
    </div>
  );
};
