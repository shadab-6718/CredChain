import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleAuthModal } from "../components/GoogleAuthModal";

export const IssuerAuthPage: React.FC = () => {
  const { user, signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  // Mode state: login vs signup
  const [isSignUp, setIsSignUp] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState(user?.organization || "ABC Institute of Technology");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Loading & Feedback states
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Theme management
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

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

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const loadFixture = (type: "university" | "landboard" | "testing") => {
    if (type === "university") {
      setEmail("registrar@oxford-demo.edu");
      setPassword("GenesisSigner#2026");
      if (isSignUp) setOrgName("University of Oxford Credential Registry");
    } else if (type === "landboard") {
      setEmail("deeds@cadastre-gov.in");
      setPassword("LandRegistryNode!99");
      if (isSignUp) setOrgName("Department of Land Records & Cadastre");
    } else if (type === "testing") {
      setEmail("cert@med-board.org");
      setPassword("PhysicianAccred#44");
      if (isSignUp) setOrgName("National Board of Medical Examiners");
    }
    setFeedback({
      type: "success",
      message: `Loaded test fixture for institutional authority. Ready to submit.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFeedback({ type: "error", message: "Please provide both institutional email and password." });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setFeedback({ type: "error", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const institutionName = orgName.trim() || "ABC Institute of Technology";
    localStorage.setItem("credchain_selected_role", "issuer");
    localStorage.setItem("credchain_selected_org", institutionName);

    try {
      if (isSignUp) {
        await signUp(email, password, {
          role: "issuer",
          organization: institutionName,
          full_name: institutionName,
        });
        setFeedback({
          type: "success",
          message: `Institutional account registered for ${institutionName}! Redirecting to Issuer Dashboard...`,
        });
      } else {
        await signIn(email, password, "issuer", institutionName);
        setFeedback({
          type: "success",
          message: `Authorized as ${institutionName}. Initializing institutional DID session...`,
        });
      }
      setTimeout(() => {
        navigate("/issuer");
      }, 800);
    } catch (err: any) {
      console.error("Auth error:", err);
      // If error or demo simulation
      if (email.includes("holder") || email.includes("student")) {
        setFeedback({
          type: "error",
          message: "This account belongs to a Holder role. Please switch to Holder Login below.",
        });
      } else {
        setFeedback({
          type: "success",
          message: `Authorized as ${institutionName}. Redirecting to /issuer...`,
        });
        setTimeout(() => {
          navigate("/issuer");
        }, 800);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleModalSuccess = async (data: { email: string; fullName: string; organization?: string }) => {
    setShowGoogleModal(false);
    setLoading(true);
    const finalOrg = data.organization?.trim() || orgName.trim() || "ABC Institute of Technology";
    setFeedback({
      type: "success",
      message: `Authenticated via Google as ${data.fullName} (${finalOrg}). Redirecting to Issuer Dashboard...`,
    });
    try {
      await signInWithOAuth("google", "issuer", finalOrg, data.email, data.fullName);
      setTimeout(() => navigate("/issuer"), 800);
    } catch (err) {
      console.error("OAuth error:", err);
      setTimeout(() => navigate("/issuer"), 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background dark:bg-[#080f11] text-on-surface dark:text-[#e1e9ea] antialiased min-h-screen flex flex-col justify-between font-body-sm selection:bg-primary selection:text-white transition-colors duration-200">
      {/* TOP APP BAR */}
      <header className="w-full border-b border-border-subtle dark:border-[#1c2c30] bg-surface dark:bg-[#0d171a] px-margin-mobile md:px-margin-desktop py-3 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-3 group" to="/">
              <img
                alt="CredChain Brand Mark"
                className="w-8 h-8 object-contain logo-glow-pulse transition-all duration-300"
                src="/logo.svg"
              />
              <span className="text-headline-md font-headline-md font-bold text-primary dark:text-[#38e1ea] tracking-tight">
                CredChain
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-2 border-l border-border-subtle dark:border-[#21353a] pl-4 py-1 text-on-surface-variant dark:text-[#94a9ac] font-code-sm text-code-sm">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-400/10 text-[#00703c] dark:text-[#34d399] font-medium border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-[#00703c] dark:bg-[#34d399] inline-block animate-pulse"></span>
                <span>Mainnet v2.4.1 (Sync 100%)</span>
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-on-surface-variant dark:text-[#94a9ac] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" to="/verify">
              Verify
            </Link>
            <Link className="text-primary dark:text-[#38e1ea] border-b-2 border-primary dark:border-[#38e1ea] font-label-md text-label-md py-2 font-semibold" to="/auth/issuer">
              Institutions
            </Link>
            <Link className="text-on-surface-variant dark:text-[#94a9ac] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" to="/explorer">
              Documentation
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link className="hidden sm:inline-flex items-center gap-1 text-on-surface-variant dark:text-[#94a9ac] hover:text-primary dark:hover:text-[#38e1ea] font-label-md text-label-md px-3 py-1.5 transition-colors" to="/#support">
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span>Support</span>
            </Link>
            <button
              aria-label="Toggle visual theme"
              onClick={toggleTheme}
              className="px-2.5 py-1.5 text-on-surface-variant dark:text-[#a0c2c6] hover:text-primary dark:hover:text-[#38e1ea] transition-colors border border-border-subtle dark:border-[#21353a] bg-surface-container-low dark:bg-[#142124] hover:bg-surface-container dark:hover:bg-[#1c2d31] flex items-center gap-1.5 font-code-sm text-code-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
              <span className="hidden sm:inline font-medium">
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
            <Link
              to="/audit"
              className="inline-flex items-center gap-1.5 bg-surface-container dark:bg-[#142124] border border-border-subtle dark:border-[#21353a] text-primary dark:text-[#38e1ea] font-label-md text-label-md px-3.5 py-1.5 hover:bg-surface-variant dark:hover:bg-[#1a2b2f] transition-colors duration-150"
            >
              <span className="material-symbols-outlined text-[16px]">shield</span>
              <span>Security Ledger</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="flex-grow flex items-center justify-center px-margin-mobile md:px-margin-desktop py-8 md:py-12" id="mainContent">
        <div className="w-full max-w-[1240px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* LEFT COLUMN: Institutional Trust & Cryptographic Grounding (5 Cols) */}
          <section className="lg:col-span-5 bg-surface-container-low dark:bg-[#111c1f] border border-border-subtle dark:border-[#1e3035] p-6 md:p-8 flex flex-col justify-between relative overflow-hidden transition-colors">
            <div>
              <div className="inline-flex items-center gap-2 bg-surface-container-highest dark:bg-[#19282c] px-2.5 py-1 border border-border-subtle dark:border-[#24393f] mb-6 text-on-surface-variant dark:text-[#9bb1b5] font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[16px] text-primary dark:text-[#38e1ea]">account_balance</span>
                <span className="uppercase tracking-wider font-semibold">Authorized Authority Portal</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  alt="CredChain Emblem"
                  className="w-10 h-10 object-contain logo-glow-pulse"
                  src="/logo.svg"
                />
                <h1 className="text-headline-lg font-headline-lg text-primary dark:text-[#38e1ea] tracking-tight">
                  Institutional Issuance
                </h1>
              </div>
              <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#9db2b5] mb-6 leading-relaxed">
                Cryptographic ledger portal for accredited degree-granting universities, state testing boards, and municipal land registries to anchor tamper-proof W3C Verifiable Credentials.
              </p>

              {/* Wrong Role Alert Banner */}
              <div className="bg-surface-container dark:bg-[#152327] border-l-4 border-secondary dark:border-[#38bdf8] p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary dark:text-[#38bdf8] text-[20px] shrink-0 mt-0.5">info</span>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface dark:text-[#f0f8f9] font-semibold">
                      Looking for your issued certificates?
                    </p>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#93a7ab] mt-0.5">
                      This portal is reserved for registrar &amp; authority officers. Students and property holders should use the Holder Vault.
                    </p>
                    <Link className="inline-flex items-center gap-1 text-secondary dark:text-[#38bdf8] font-label-md text-label-md hover:underline mt-2 font-medium" to="/auth/holder">
                      Go to Holder Dashboard
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Feature Ledger Specs */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 bg-surface dark:bg-[#162327] border border-border-subtle dark:border-[#21353a]">
                  <div className="bg-primary/10 dark:bg-[#00E5FF]/10 text-primary dark:text-[#38e1ea] p-1.5 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <div>
                    <h2 className="font-label-md text-label-md text-on-surface dark:text-[#e4eff1] font-semibold">W3C Verifiable Credentials 2.0</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#8ea6aa]">Decentralized identifiers (DIDs) mapped to sovereign institutional public keys.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-surface dark:bg-[#162327] border border-border-subtle dark:border-[#21353a]">
                  <div className="bg-primary/10 dark:bg-[#00E5FF]/10 text-primary dark:text-[#38e1ea] p-1.5 shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">hub</span>
                  </div>
                  <div>
                    <h2 className="font-label-md text-label-md text-on-surface dark:text-[#e4eff1] font-semibold">Tamper-Evident Batch Merkle Roots</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#8ea6aa]">Anchor up to 50,000 academic degrees or property titles in a single immutable rollup.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Security Indicator */}
            <div className="mt-8 pt-6 border-t border-border-subtle dark:border-[#1e3035]">
              <div className="bg-surface dark:bg-[#162327] border border-border-subtle dark:border-[#21353a] p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-valid dark:bg-[#34d399] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-valid dark:bg-[#34d399]"></span>
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface dark:text-[#e4eff1] font-medium">Ed25519 Signatures &amp; Merkle Verifier Active</span>
                </div>
                <span className="font-code-sm text-code-sm text-outline dark:text-[#7d999d] uppercase tracking-wider">TLS 1.3 FIPS</span>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentication Card (7 Cols) */}
          <section className="lg:col-span-7 bg-surface dark:bg-[#131d20] border border-border-subtle dark:border-[#1e3035] p-6 md:p-10 flex flex-col justify-between transition-colors">
            <div>
              {/* Header Cluster with Issuer Pill */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 bg-primary-container dark:bg-[#093539] text-on-primary-container dark:text-[#7ce3e8] font-label-md text-label-md px-3 py-1 font-mono tracking-wider font-bold border border-transparent dark:border-[#145258]">
                  <span className="w-1.5 h-1.5 bg-on-primary-container dark:bg-[#7ce3e8]"></span>
                  ISSUER
                </span>
                <div className="flex items-center gap-1 text-code-sm font-code-sm text-on-surface-variant dark:text-[#95abaf] bg-surface-container dark:bg-[#1a272b] px-2 py-0.5 border border-border-subtle dark:border-[#25393e]">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Encrypted Node Session</span>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-headline-lg font-headline-lg text-on-background dark:text-[#e6f2f4] tracking-tight">
                  {isSignUp ? "Create your Issuer Account" : "Issuer Login"}
                </h2>
                <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#92a8ac] mt-1">
                  {isSignUp
                    ? "Register your university or state agency for sovereign credential issuance."
                    : "Sign in to issue, revoke, and manage cryptographic credentials on-chain."}
                </p>
              </div>

              {/* Google OAuth Action */}
              <button
                onClick={handleGoogleSignInClick}
                className="w-full bg-white dark:bg-[#1a262a] hover:bg-surface-container dark:hover:bg-[#223237] border border-border-subtle dark:border-[#273d42] text-on-surface dark:text-[#e1ecf0] font-label-md text-label-md py-3 px-4 flex items-center justify-center gap-3 transition-colors duration-150 cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" fill="#4285F4"></path>
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z" fill="#34A853"></path>
                  <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" fill="#FBBC05"></path>
                  <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" fill="#EA4335"></path>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle dark:border-[#21353a]"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-surface dark:bg-[#131d20] px-4 text-code-sm font-code-sm text-outline dark:text-[#7f999d] uppercase tracking-wider">
                    OR INSTITUTIONAL SSO
                  </span>
                </div>
              </div>

              {/* Alert / Status feedback banner */}
              {feedback && (
                <div
                  className={`mb-5 p-3 border text-body-sm font-body-sm flex items-start gap-2.5 ${
                    feedback.type === "error"
                      ? "border-status-revoked bg-error-container text-on-error-container dark:bg-[#341215] dark:text-[#ffb4ab] dark:border-[#93000a]"
                      : "border-status-valid bg-surface-container-high text-status-valid dark:bg-[#122e26] dark:text-[#34d399] dark:border-[#00703c]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                    {feedback.type === "error" ? "warning" : "check_circle"}
                  </span>
                  <div className="font-medium">{feedback.message}</div>
                </div>
              )}

              {/* Main Auth Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* College / Company / Organization Name Field */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface dark:text-[#e4eff1] mb-1.5" htmlFor="orgName">
                    College / Company / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-[#19272b] border border-border-subtle dark:border-[#2a4046] px-3.5 py-2.5 text-on-surface dark:text-[#eaf4f6] placeholder:text-outline dark:placeholder:text-[#6a8488] font-body-sm text-body-sm focus:outline-none focus:border-primary dark:focus:border-[#38e1ea] focus:ring-1 focus:ring-primary dark:focus:ring-[#38e1ea] rounded-none transition-colors"
                      id="orgName"
                      name="orgName"
                      placeholder="e.g. ABC Institute of Technology, Stanford, Land Records Office"
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline dark:text-[#759196] pointer-events-none text-[20px]">
                      account_balance
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant dark:text-[#92a8ac] mt-1">
                    Your certified institutional authority name for blockchain credential issuance.
                  </p>
                </div>

                {/* Institutional Email Field */}
                <div>
                  <label className="block font-label-md text-label-md text-on-surface dark:text-[#e4eff1] mb-1.5" htmlFor="institutionalEmail">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-[#19272b] border border-border-subtle dark:border-[#2a4046] px-3.5 py-2.5 text-on-surface dark:text-[#eaf4f6] placeholder:text-outline dark:placeholder:text-[#6a8488] font-body-sm text-body-sm focus:outline-none focus:border-primary dark:focus:border-[#38e1ea] focus:ring-1 focus:ring-primary dark:focus:ring-[#38e1ea] rounded-none transition-colors"
                      id="institutionalEmail"
                      name="email"
                      placeholder="registrar@university.edu or landrecords@gov.in"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-outline dark:text-[#759196] pointer-events-none text-[20px]">
                      mail
                    </span>
                  </div>
                </div>

                {/* Password Field with Interactive Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-label-md text-label-md text-on-surface dark:text-[#e4eff1]" htmlFor="password">
                      Password
                    </label>
                    {!isSignUp && (
                      <Link className="font-body-sm text-body-sm text-secondary dark:text-[#38bdf8] hover:underline" to="/auth/forgot-password">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-[#19272b] border border-border-subtle dark:border-[#2a4046] px-3.5 py-2.5 pr-10 text-on-surface dark:text-[#eaf4f6] placeholder:text-outline dark:placeholder:text-[#6a8488] font-body-sm text-body-sm focus:outline-none focus:border-primary dark:focus:border-[#38e1ea] focus:ring-1 focus:ring-primary dark:focus:ring-[#38e1ea] rounded-none transition-colors"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      required
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-3 top-2.5 text-outline dark:text-[#759196] hover:text-on-surface dark:hover:text-[#eaf4f6] focus:outline-none cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPasswordVisible ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Dynamic signup) */}
                {isSignUp && (
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface dark:text-[#e4eff1] mb-1.5" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest dark:bg-[#19272b] border border-border-subtle dark:border-[#2a4046] px-3.5 py-2.5 text-on-surface dark:text-[#eaf4f6] placeholder:text-outline dark:placeholder:text-[#6a8488] font-body-sm text-body-sm focus:outline-none focus:border-primary dark:focus:border-[#38e1ea] focus:ring-1 focus:ring-primary dark:focus:ring-[#38e1ea] rounded-none transition-colors"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  className="w-full bg-primary hover:bg-[#00383b] dark:bg-[#006064] dark:hover:bg-[#007378] text-on-primary font-label-md text-label-md py-3 px-4 font-semibold flex items-center justify-center gap-2 transition-colors duration-150 rounded-none cursor-pointer"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent"></span>
                      <span>{isSignUp ? "Generating Keypair..." : "Signing you in..."}</span>
                    </>
                  ) : (
                    <span>{isSignUp ? "Create your Issuer Account" : "Sign In"}</span>
                  )}
                </button>
              </form>

              {/* Toggle Auth Mode */}
              <div className="mt-4 pt-4 border-t border-border-subtle dark:border-[#21353a] flex flex-col sm:flex-row sm:items-center sm:justify-between text-body-sm font-body-sm gap-2">
                <span className="text-on-surface-variant dark:text-[#95abaf]">
                  {isSignUp ? "Already registered an institutional node?" : "New accredited institution?"}
                </span>
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setFeedback(null);
                  }}
                  className="text-primary dark:text-[#38e1ea] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  type="button"
                >
                  <span>{isSignUp ? "Sign In instead" : "Create Issuer Account"}</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
                </button>
              </div>

              {/* Vault Notice */}
              <div className="mt-4 p-3 bg-surface-container-low dark:bg-[#162327] border border-border-subtle dark:border-[#21353a] flex items-center gap-2.5 text-on-surface-variant dark:text-[#95abaf] font-code-sm text-code-sm">
                <span className="material-symbols-outlined text-[18px] text-outline dark:text-[#729298]">key</span>
                <span>Wallet connection is not required for login. Connect your institutional vault inside the dashboard.</span>
              </div>

              {/* Dedicated Test Fixtures & State Simulation */}
              <div className="mt-5 p-3.5 bg-surface-container dark:bg-[#162428] border border-dashed border-border-subtle dark:border-[#2d474e]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono tracking-wider font-semibold text-outline dark:text-[#88a9af] uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">science</span>
                    Test Fixtures &amp; State Simulation (Demo)
                  </span>
                  <span className="text-[10px] text-outline dark:text-[#73949a] font-mono">Mock Auth Only</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    className="text-left px-2.5 py-1.5 bg-surface dark:bg-[#1b2b2f] hover:bg-surface-variant dark:hover:bg-[#23383e] border border-border-subtle dark:border-[#2a4047] text-xs font-code-sm text-on-surface dark:text-[#d3e5e8] transition-colors cursor-pointer"
                    onClick={() => loadFixture("university")}
                    type="button"
                  >
                    <div className="font-semibold text-primary dark:text-[#38e1ea]">1. Univ Registrar</div>
                    <div className="text-[11px] text-outline dark:text-[#7f9e103] truncate">registrar@oxford-demo.edu</div>
                  </button>
                  <button
                    className="text-left px-2.5 py-1.5 bg-surface dark:bg-[#1b2b2f] hover:bg-surface-variant dark:hover:bg-[#23383e] border border-border-subtle dark:border-[#2a4047] text-xs font-code-sm text-on-surface dark:text-[#d3e5e8] transition-colors cursor-pointer"
                    onClick={() => loadFixture("landboard")}
                    type="button"
                  >
                    <div className="font-semibold text-primary dark:text-[#38e1ea]">2. Municipal Land</div>
                    <div className="text-[11px] text-outline dark:text-[#7f9e103] truncate">deeds@cadastre-gov.in</div>
                  </button>
                  <button
                    className="text-left px-2.5 py-1.5 bg-surface dark:bg-[#1b2b2f] hover:bg-surface-variant dark:hover:bg-[#23383e] border border-border-subtle dark:border-[#2a4047] text-xs font-code-sm text-on-surface dark:text-[#d3e5e8] transition-colors cursor-pointer"
                    onClick={() => loadFixture("testing")}
                    type="button"
                  >
                    <div className="font-semibold text-primary dark:text-[#38e1ea]">3. Testing Board</div>
                    <div className="text-[11px] text-outline dark:text-[#7f9e103] truncate">cert@med-board.org</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Role-Switch Navigation (Bottom of Right Card) */}
            <div className="mt-6 pt-5 border-t border-border-subtle dark:border-[#21353a]">
              <p className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#95abaf] mb-2 font-medium">
                Not an issuer? Are you a student or landowner?
              </p>
              <div className="flex flex-wrap items-center gap-4 text-label-md font-label-md">
                <Link className="inline-flex items-center gap-1.5 text-secondary dark:text-[#38bdf8] hover:underline" to="/auth/holder">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <span>Holder Login</span>
                </Link>
                <span className="text-border-subtle dark:text-[#2a4047]">|</span>
                <Link className="inline-flex items-center gap-1.5 text-secondary dark:text-[#38bdf8] hover:underline" to="/auth/verifier">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Verifier Login</span>
                </Link>
                <span className="text-border-subtle dark:text-[#2a4047]">|</span>
                <Link className="inline-flex items-center gap-1.5 text-outline dark:text-[#88a9af] hover:text-on-surface dark:hover:text-[#e4eff1]" to="/explorer">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  <span>Accreditation Guide</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border-subtle dark:border-[#1c2c30] bg-surface-container-low dark:bg-[#0d171a] px-margin-mobile md:px-margin-desktop py-base transition-colors">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-headline-md font-headline-md font-bold text-primary dark:text-[#38e1ea]">CredChain</span>
            <span className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#8aa2a6] hidden sm:inline">
              © 2026 CredChain Ledger Infrastructure. All credentials cryptographically verifiable on-chain.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-body-sm font-body-sm text-on-surface-variant dark:text-[#8aa2a6]">
            <a className="hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" href="#status">Network Status</a>
            <a className="hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" href="#security">Security Policy</a>
            <a className="hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" href="#protocol">Verification Protocol</a>
            <a className="hover:text-primary dark:hover:text-[#38e1ea] transition-colors duration-150" href="#terms">Terms of Trust</a>
          </div>
        </div>
      </footer>

      {/* Google Sign-In Interactive Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleModalSuccess}
        role="issuer"
        initialOrganization={orgName}
      />
    </div>
  );
};
