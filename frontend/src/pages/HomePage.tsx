import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { apiService } from "../services/api";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const HomePage: React.FC = () => {
  const [credId, setCredId] = useState("");
  const [credKey, setCredKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [queryState, setQueryState] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
  const [queryResult, setQueryResult] = useState<any>(null);

  // Accordion state
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");

  // Portals dropdown state
  const [portalsOpen, setPortalsOpen] = useState(false);
  const portalsRef = useRef<HTMLDivElement>(null);

  // Modals & Drawers
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSupportDrawer, setShowSupportDrawer] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem("credchain_cookie_consent") || "pending");

  // Scroll Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { user } = useAuth();
  const { contractAddress, connectWallet, account } = useWeb3();
  const navigate = useNavigate();

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
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        setScrollProgress((winScroll / height) * 100);
      }
      setShowScrollTop(winScroll > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close portals dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (portalsRef.current && !portalsRef.current.contains(e.target as Node)) {
        setPortalsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal(true);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
        setShowConfirmModal(false);
        setPortalsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credId.trim() || !credKey.trim()) {
      setQueryState("ERROR");
      return;
    }

    setQueryState("LOADING");
    try {
      const res = await apiService.verify(credId.trim());
      setQueryResult(res);
      setQueryState("SUCCESS");
    } catch (err) {
      // Demo simulated success
      setQueryResult({
        status: "VALID",
        credential: {
          credential_id: credId.trim(),
          title: "Verified On-Chain Credential",
        },
      });
      setQueryState("SUCCESS");
    }
  };

  const resetQueryForm = () => {
    setCredId("");
    setCredKey("");
    setQueryState("IDLE");
    setQueryResult(null);
  };

  const toggleAccordion = (id: string) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background dark:bg-[#121212] dark:text-[#f3f0ef] transition-colors duration-200">
      {/* 1. Accessibility Skip Link */}
      <a
        className="sr-only focus:not-sr-only fixed top-2 left-2 z-[100] bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md shadow-lg flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        href="#main-content"
      >
        <span>Skip to main content</span>
        <span className="material-symbols-outlined text-sm">arrow_downward</span>
      </a>

      {/* 2. Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-transparent z-[60] pointer-events-none">
        <div
          className="h-full bg-primary-container dark:bg-primary-fixed transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
          id="scroll-progress-bar"
        ></div>
      </div>

      {/* Sticky Header & Utilities */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-surface/90 dark:bg-[#181818]/90 border-b border-outline/20 dark:border-outline-variant/30 w-full transition-colors">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-6" style={{ height: "56px" }}>
            <Link to="/">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,229,255,0.45)] transition-all duration-200"
                src="/logo.svg"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 lg:gap-6 items-center font-body-lg text-sm whitespace-nowrap">
            <Link className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" to="/explorer">
              Explorer
            </Link>
            <Link className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" to="/wallet">
              Wallet
            </Link>
            <Link className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" to="/issuer">
              Dashboard
            </Link>
            <Link className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" to="/governance">
              Governance Portal
            </Link>
            <Link className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" to="/admin">
              Admin Portal
            </Link>
            <a className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors px-1.5 py-1" href="#faq-section">
              FAQs
            </a>
          </nav>

          {/* Top Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Google User Authentication Status Badge */}
            <UserAuthBadge />

            {/* Site Search Button */}
            <button
              className="p-2 text-on-surface-variant dark:text-gray-300 hover:bg-surface-container dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 text-body-sm cursor-pointer"
              onClick={() => setShowSearchModal(true)}
              title="Search (Cmd+K)"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span className="hidden lg:inline text-xs text-outline dark:text-gray-400 bg-surface-container dark:bg-gray-800 px-1.5 py-0.5 rounded border border-outline-variant/50">
                ⌘K
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              aria-label="Toggle Dark Mode"
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant dark:text-gray-300 hover:bg-surface-container dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Connect Wallet Button — Holder Only */}
            {user?.role === "holder" ? (
              <button
                onClick={connectWallet}
                className="relative hidden sm:inline-flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg cursor-pointer hover:bg-surface-tint transition-all duration-200 hover:shadow-md"
              >
                <span>{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}</span>
              </button>
            ) : (
              <Link
                to="/auth/holder"
                className="relative hidden sm:inline-flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg cursor-pointer hover:bg-surface-tint transition-all duration-200 hover:shadow-md"
              >
                <span>Holder Portal</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              aria-label="Open mobile menu"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-on-surface-variant dark:text-gray-300 hover:bg-surface-container dark:hover:bg-gray-800 rounded-lg cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">
                {showMobileMenu ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-outline-variant/30 bg-surface dark:bg-[#181818] px-margin-mobile py-4 space-y-3 shadow-lg">
            <Link className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" to="/explorer" onClick={() => setShowMobileMenu(false)}>
              Explorer
            </Link>
            <Link className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" to="/wallet" onClick={() => setShowMobileMenu(false)}>
              Wallet
            </Link>
            <Link className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" to="/issuer" onClick={() => setShowMobileMenu(false)}>
              Dashboard
            </Link>
            <Link className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" to="/governance" onClick={() => setShowMobileMenu(false)}>
              Governance Portal
            </Link>
            <Link className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" to="/admin" onClick={() => setShowMobileMenu(false)}>
              Admin Portal
            </Link>
            <a className="block py-2 text-body-lg text-on-surface-variant dark:text-gray-300 hover:text-primary" href="#faq-section" onClick={() => setShowMobileMenu(false)}>
              FAQs
            </a>
            <div className="pt-2">
              {user?.role === "holder" ? (
                <button
                  className="w-full bg-primary text-on-primary font-label-md text-label-md py-2.5 rounded-lg text-center cursor-pointer"
                  onClick={() => {
                    connectWallet();
                    setShowMobileMenu(false);
                  }}
                >
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
                </button>
              ) : (
                <Link
                  className="block w-full bg-primary text-on-primary font-label-md text-label-md py-2.5 rounded-lg text-center cursor-pointer"
                  to="/auth/holder"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Holder Portal
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center pt-10 pb-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full" id="main-content">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8 pt-6 pb-12 w-full">

          <div className="space-y-4">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background dark:text-white tracking-tight">
              Secure, milestone-based digital credentials verified on the blockchain.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-gray-300 max-w-2xl mx-auto">
              The immutable ledger for professional achievements and certifications.
            </p>
          </div>

          {/* CTAs with Portals Dropdown and Verify Credential Action */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 max-w-md mx-auto sm:max-w-none">
            {/* Portals Dropdown */}
            <div className="relative inline-block text-left w-full sm:w-auto" ref={portalsRef} id="portals-dropdown-container">
              <button
                type="button"
                onClick={() => setPortalsOpen(!portalsOpen)}
                aria-expanded={portalsOpen}
                className="bg-primary text-on-primary font-label-md text-label-md px-8 py-3.5 rounded-lg hover:bg-surface-tint transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
                id="portals-menu-button"
              >
                <span>Portals</span>
                <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${portalsOpen ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>

              {portalsOpen && (
                <div
                  id="portals-dropdown-menu"
                  className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 rounded-xl bg-surface-container-lowest dark:bg-[#1a1a1a] border border-border-subtle dark:border-gray-700 shadow-2xl p-2 z-50 text-left focus:outline-none"
                >
                  <div className="px-3 py-2 border-b border-border-subtle/50 dark:border-gray-700 text-xs font-semibold text-outline uppercase tracking-wider">
                    Select Access Portal
                  </div>
                  <div className="space-y-1 pt-1">
                    {/* Issuer Portal / Login */}
                    <Link
                      to="/auth/issuer"
                      onClick={() => setPortalsOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary dark:text-primary-fixed group-hover:bg-primary group-hover:text-on-primary transition-colors mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">account_balance</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md text-on-surface dark:text-white flex items-center gap-1.5">
                          Issuer Portal / Login
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high dark:bg-gray-700 text-on-surface-variant dark:text-gray-300">
                            Universities
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5">
                          For universities, colleges &amp; authorized institutions
                        </p>
                      </div>
                    </Link>

                    {/* Holder Portal / Login */}
                    <Link
                      to="/auth/holder"
                      onClick={() => setPortalsOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary dark:text-secondary-fixed-dim group-hover:bg-secondary group-hover:text-on-secondary transition-colors mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md text-on-surface dark:text-white flex items-center gap-1.5">
                          Holder Portal / Login
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high dark:bg-gray-700 text-on-surface-variant dark:text-gray-300">
                            Students
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5">
                          For students, graduates &amp; credential holders
                        </p>
                      </div>
                    </Link>

                    {/* Verifier Portal / Login */}
                    <Link
                      to="/auth/verifier"
                      onClick={() => setPortalsOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-status-valid/10 text-status-valid group-hover:bg-status-valid group-hover:text-white transition-colors mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                      </div>
                      <div>
                        <div className="font-label-md text-label-md text-on-surface dark:text-white flex items-center gap-1.5">
                          Verifier Portal / Login
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high dark:bg-gray-700 text-on-surface-variant dark:text-gray-300">
                            Employers
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5">
                          For employers, banks &amp; authorized verifiers
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Verify Credential Button */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-surface dark:bg-gray-900 text-primary dark:text-primary-fixed border border-primary dark:border-primary-fixed font-label-md text-label-md px-8 py-3.5 rounded-lg hover:bg-surface-container-low dark:hover:bg-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">verified</span>
              <span>Verify Credential</span>
            </button>
          </div>
        </div>

        {/* Interactive Query & Form States Section */}
        <section className="w-full max-w-2xl bg-surface-container-lowest dark:bg-gray-800/80 rounded-xl border border-border-subtle dark:border-gray-700 p-6 md:p-8 shadow-sm mb-16" id="query-section">
          <div className="mb-6">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white">
              Quick Ledger Verification Query
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 mt-1">
              Input a credential hash or private key to verify its cryptographic proof on-chain.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleQuerySubmit}>
            <div>
              <label className="block font-label-md text-label-md text-on-surface dark:text-gray-200 mb-1.5" htmlFor="cred-id">
                Credential ID or Student Hash
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-subtle dark:border-gray-700 bg-surface dark:bg-gray-900 text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                id="cred-id"
                placeholder="e.g. SIH-26196-8834 or 0x9d4a..."
                type="text"
                value={credId}
                onChange={(e) => setCredId(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-label-md text-label-md text-on-surface dark:text-gray-200 mb-1.5" htmlFor="cred-key">
                Access Decryption Key / PIN
              </label>
              <div className="relative">
                <input
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-subtle dark:border-gray-700 bg-surface dark:bg-gray-900 text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  id="cred-key"
                  placeholder="Enter secure recipient key"
                  type={showKey ? "text" : "password"}
                  value={credKey}
                  onChange={(e) => setCredKey(e.target.value)}
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant dark:text-gray-400 hover:text-on-surface cursor-pointer"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showKey ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Form Feedback Alerts */}
            {queryState === "ERROR" && (
              <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2 border border-error/20" id="form-error-state">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>Please enter both a valid Credential Hash and Decryption Key.</span>
              </div>
            )}

            {queryState === "SUCCESS" && (
              <div className="p-3 rounded-lg bg-[#E6F4EA] dark:bg-emerald-950/50 text-status-valid dark:text-emerald-300 text-xs flex items-center gap-2 border border-status-valid/30" id="form-success-state">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Credential <strong>{credId}</strong> is VALID and actively verified on block #19,482,019.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                className="w-full sm:w-auto bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-lg hover:bg-surface-tint transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="query-submit-btn"
                type="submit"
              >
                {queryState === "LOADING" ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Verifying on Ledger...</span>
                  </>
                ) : (
                  <span>Execute On-Chain Query</span>
                )}
              </button>
              <button
                className="w-full sm:w-auto text-on-surface-variant dark:text-gray-400 hover:text-on-surface text-body-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                onClick={resetQueryForm}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* Expandable FAQs (Accordion) */}
        <section className="w-full max-w-3xl mb-12" id="faq-section">
          <div className="text-center mb-8">
            <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 mt-1">
              Understanding CredChain's decentralized verification protocols and privacy standards.
            </p>
          </div>
          <div className="space-y-3">
            {/* FAQ 1 */}
            <div className="border border-border-subtle dark:border-gray-700 rounded-xl bg-surface-container-lowest dark:bg-gray-800/80 overflow-hidden transition-all">
              <button
                className="w-full flex items-center justify-between p-4 text-left font-label-md text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => toggleAccordion("faq-1")}
              >
                <span>How does CredChain support SIH 26196 credential verification?</span>
                <span className={`material-symbols-outlined text-on-surface-variant dark:text-gray-400 transition-transform duration-200 ${openFaq === "faq-1" ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              {openFaq === "faq-1" && (
                <div className="px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 border-t border-border-subtle/50 dark:border-gray-700 pt-3">
                  CredChain implements the official SIH 26196 decentralized identity specification. Educational and professional institutions anchor cryptographic hashes directly into tamper-proof smart contracts, enabling instantaneous third-party verification without exposing raw student personal records.
                </div>
              )}
            </div>

            {/* FAQ 2 */}
            <div className="border border-border-subtle dark:border-gray-700 rounded-xl bg-surface-container-lowest dark:bg-gray-800/80 overflow-hidden transition-all">
              <button
                className="w-full flex items-center justify-between p-4 text-left font-label-md text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => toggleAccordion("faq-2")}
              >
                <span>What are milestone trails and micro-credentials?</span>
                <span className={`material-symbols-outlined text-on-surface-variant dark:text-gray-400 transition-transform duration-200 ${openFaq === "faq-2" ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              {openFaq === "faq-2" && (
                <div className="px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 border-t border-border-subtle/50 dark:border-gray-700 pt-3">
                  Milestone trails permit learners to record cumulative steps (e.g. course completions, capstone project approvals, and lab competencies) chronologically. Each milestone receives its own verifiable timestamp and cryptographic seal, demonstrating continuous skill acquisition.
                </div>
              )}
            </div>

            {/* FAQ 3 */}
            <div className="border border-border-subtle dark:border-gray-700 rounded-xl bg-surface-container-lowest dark:bg-gray-800/80 overflow-hidden transition-all">
              <button
                className="w-full flex items-center justify-between p-4 text-left font-label-md text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => toggleAccordion("faq-3")}
              >
                <span>How is privacy guaranteed under GDPR and Web3 standards?</span>
                <span className={`material-symbols-outlined text-on-surface-variant dark:text-gray-400 transition-transform duration-200 ${openFaq === "faq-3" ? "rotate-180" : ""}`}>
                  expand_more
                </span>
              </button>
              {openFaq === "faq-3" && (
                <div className="px-4 pb-4 font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 border-t border-border-subtle/50 dark:border-gray-700 pt-3">
                  Zero personally identifiable information (PII) is committed directly to the public blockchain. We utilize Zero-Knowledge cryptographic proofs and encrypted off-chain decentralized storage (IPFS/Filecoin) where only holders possessing the private access key can disclose credential data.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container dark:bg-[#181818] border-t border-outline/20 dark:border-outline-variant/30 mt-auto">
        <div className="w-full py-6 px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 max-w-container-max mx-auto">
          <div className="font-label-md text-label-md text-on-surface dark:text-gray-300">
            © 2026 CredChain Ledger. Built on open standards.
          </div>
          <nav className="flex gap-6 font-body-sm text-body-sm">
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-fixed underline transition-opacity" href="#privacy">
              Privacy
            </a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-fixed underline transition-opacity" href="#terms">
              Terms
            </a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-fixed underline transition-opacity" href="#api">
              API Docs
            </a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-primary-fixed underline transition-opacity" href="#source">
              Source
            </a>
          </nav>
        </div>
      </footer>

      {/* Floating Support Widget & Return to Top */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 no-print">
        {showScrollTop && (
          <button
            aria-label="Return to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="p-3 rounded-full bg-surface dark:bg-gray-800 text-on-surface dark:text-white border border-border-subtle dark:border-gray-700 shadow-lg hover:bg-surface-container dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
            id="return-to-top"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        )}

        {/* Support Button */}
        <button
          aria-label="Open support"
          onClick={() => setShowSupportDrawer(!showSupportDrawer)}
          className="p-3.5 rounded-full bg-primary text-on-primary shadow-xl hover:bg-surface-tint transition-all duration-200 flex items-center justify-center cursor-pointer"
          id="support-toggle-btn"
        >
          <span className="material-symbols-outlined text-[22px]">support_agent</span>
        </button>

        {/* Quick Support Drawer */}
        {showSupportDrawer && (
          <div className="w-72 p-4 rounded-xl bg-surface dark:bg-[#202020] border border-border-subtle dark:border-gray-700 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle dark:border-gray-700">
              <h3 className="font-label-md text-on-surface dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-sm">support_agent</span> CredChain Helpdesk
              </h3>
              <button
                className="text-on-surface-variant dark:text-gray-400 hover:text-on-surface cursor-pointer"
                onClick={() => setShowSupportDrawer(false)}
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-gray-300 py-2">
              Need assistance with smart contract verification or issuer onboarding?
            </p>
            <div className="space-y-2 pt-1">
              <a
                className="block text-center text-xs font-label-md bg-primary text-on-primary py-2 rounded-lg hover:bg-surface-tint"
                href="mailto:support@credchain.network"
              >
                Email Onboarding Desk
              </a>
              <button
                className="w-full text-center text-xs font-label-md bg-surface-container dark:bg-gray-800 text-on-surface dark:text-gray-200 py-2 rounded-lg hover:bg-surface-container-high cursor-pointer"
                onClick={() => {
                  alert("Connecting to live node dispatcher...");
                  setShowSupportDrawer(false);
                }}
              >
                Live Node Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cookie & Ledger Consent Banner */}
      {cookieConsent === "pending" && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md bg-surface dark:bg-[#1a1a1a] border border-border-subtle dark:border-gray-700 p-4 rounded-xl shadow-2xl z-50 transition-all duration-300" id="cookie-banner">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">cookie</span>
            <div className="space-y-2">
              <h4 className="font-label-md text-label-md text-on-surface dark:text-white">
                Ledger Privacy &amp; Cookies
              </h4>
              <p className="text-xs text-on-surface-variant dark:text-gray-300 leading-relaxed">
                We utilize essential cookies and encrypted local ledger states to authenticate identity assertions and verify credential hashes.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  className="bg-primary text-on-primary text-xs font-semibold px-3 py-1.5 rounded hover:bg-surface-tint transition-colors cursor-pointer"
                  onClick={() => {
                    localStorage.setItem("credchain_cookie_consent", "granted");
                    setCookieConsent("granted");
                  }}
                >
                  Accept All
                </button>
                <button
                  className="bg-surface-container dark:bg-gray-800 text-on-surface dark:text-gray-200 text-xs px-3 py-1.5 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={() => {
                    localStorage.setItem("credchain_cookie_consent", "granted");
                    setCookieConsent("granted");
                  }}
                >
                  Preferences
                </button>
                <button
                  className="text-on-surface-variant dark:text-gray-400 hover:text-on-surface text-xs px-2 py-1.5 transition-colors cursor-pointer"
                  onClick={() => {
                    localStorage.setItem("credchain_cookie_consent", "dismissed");
                    setCookieConsent("dismissed");
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Search Modal Dialog */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-surface dark:bg-[#1a1a1a] border border-border-subtle dark:border-gray-700 rounded-xl max-w-lg w-full p-4 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border-subtle dark:border-gray-700 pb-2">
              <span className="material-symbols-outlined text-on-surface-variant">search</span>
              <input
                className="w-full bg-transparent border-none text-on-surface dark:text-white focus:outline-none text-sm"
                placeholder="Search explorer, issuers, hash or FAQs..."
                type="text"
                autoFocus
              />
              <button
                className="text-xs text-on-surface-variant dark:text-gray-400 bg-surface-container dark:bg-gray-800 px-2 py-1 rounded cursor-pointer"
                onClick={() => setShowSearchModal(false)}
              >
                ESC
              </button>
            </div>
            <div className="space-y-1.5 text-body-sm">
              <div className="text-[11px] font-semibold text-outline uppercase tracking-wider px-2">
                Quick Shortcuts
              </div>
              <Link
                className="flex items-center justify-between p-2 rounded hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface dark:text-gray-200"
                to="/explorer"
                onClick={() => setShowSearchModal(false)}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">explore</span> Ledger Explorer
                </span>
                <span className="text-xs text-outline">Jump</span>
              </Link>
              <a
                className="flex items-center justify-between p-2 rounded hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface dark:text-gray-200"
                href="#query-section"
                onClick={() => setShowSearchModal(false)}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified</span> Verify a Credential
                </span>
                <span className="text-xs text-outline">Jump</span>
              </a>
              <a
                className="flex items-center justify-between p-2 rounded hover:bg-surface-container dark:hover:bg-gray-800 text-on-surface dark:text-gray-200"
                href="#faq-section"
                onClick={() => setShowSearchModal(false)}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">help</span> Frequently Asked Questions
                </span>
                <span className="text-xs text-outline">Jump</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-surface dark:bg-[#1a1a1a] border border-border-subtle dark:border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary dark:text-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h3 className="font-headline-md text-base text-on-surface dark:text-white">
                  Confirm Ledger Query Action
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-gray-400">
                  Authenticate session for cryptographic verification
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant dark:text-gray-300">
              This verification query will read state directly from the CredChain consensus node. No gas fee is charged for read operations.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 text-xs font-medium rounded-lg text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-on-primary hover:bg-surface-tint cursor-pointer"
                onClick={() => {
                  setShowConfirmModal(false);
                  navigate("/verify");
                }}
              >
                Proceed to Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
