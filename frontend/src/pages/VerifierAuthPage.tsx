import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleAuthModal } from "../components/GoogleAuthModal";

export const VerifierAuthPage: React.FC = () => {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  // Mode: login vs signup
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Status banners
  const [roleMismatch, setRoleMismatch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dark mode
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Return to top
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleMismatch(false);

    if (workEmail.includes("holder") || workEmail.includes("student")) {
      setRoleMismatch(true);
      return;
    }

    if (isSignupMode && password !== confirmPassword) {
      alert("Validation error: Passwords do not match.");
      return;
    }

    setIsLoading(true);
    localStorage.setItem("credchain_selected_role", "verifier");
    if (orgName) localStorage.setItem("credchain_selected_org", orgName);
    try {
      if (isSignupMode) {
        await signUp(workEmail, password, {
          role: "verifier",
          organization: orgName || "Independent Verification Agency",
          full_name: orgName || workEmail.split("@")[0],
        });
      } else {
        await signIn(workEmail, password, "verifier");
      }
      setTimeout(() => {
        navigate("/verify");
      }, 1000);
    } catch (err) {
      console.error("Auth error:", err);
      setTimeout(() => {
        navigate("/verify");
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleModalSuccess = async (data: { email: string; fullName: string; organization?: string }) => {
    setShowGoogleModal(false);
    setIsLoading(true);
    try {
      await signInWithOAuth("google", "verifier", data.organization || orgName, data.email, data.fullName);
      setTimeout(() => navigate("/verify"), 700);
    } catch (err) {
      setTimeout(() => navigate("/verify"), 700);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background dark:bg-[#080f11] text-on-surface dark:text-[#e1e7e8] min-h-screen flex flex-col font-body-sm selection:bg-primary-fixed selection:text-on-primary-fixed transition-colors duration-200">
      {/* TOP APP BAR */}
      <header className="w-full border-b border-border-subtle dark:border-[#22353a] bg-surface dark:bg-[#0d1517] px-margin-mobile md:px-margin-desktop py-3 z-30 transition-colors duration-200">
        <div className="max-w-container-max mx-auto flex items-center justify-between">
          {/* Brand Cluster */}
          <div className="flex items-center space-x-6">
            <Link className="flex items-center space-x-3 text-primary dark:text-[#00E5FF] font-bold tracking-tight" to="/">
              <div className="w-8 h-8 flex-shrink-0 logo-glow-pulse transition-all duration-300">
                <img
                  alt="CredChain Identity"
                  className="w-8 h-8 object-contain"
                  src="/logo.svg"
                />
              </div>
              <span className="text-headline-md font-headline-md font-bold text-primary dark:text-[#f3f9f9]">CredChain</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-border-subtle dark:border-[#22353a]">
              <span className="text-on-surface-variant dark:text-[#91a3a6] font-label-md text-label-md px-3 py-1">
                Ledger Gateway
              </span>
            </div>
          </div>

          {/* Trailing Action Badges & Utilities */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden sm:flex items-center text-on-surface-variant dark:text-[#91a3a6] text-code-sm font-code-sm bg-surface-container-low dark:bg-[#151d1f] px-2.5 py-1 border border-border-subtle dark:border-[#22353a]">
              <span className="w-2 h-2 rounded-full bg-status-valid mr-2 inline-block shadow-[0_0_6px_rgba(0,112,60,0.6)]"></span>
              <span className="font-medium text-on-surface dark:text-[#e1e7e8]">Mainnet v2.4.1 (Sync 100%)</span>
            </div>

            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="p-1.5 sm:px-2.5 sm:py-1 border border-border-subtle dark:border-[#22353a] bg-surface-container-low dark:bg-[#151d1f] hover:bg-surface-container dark:hover:bg-[#192427] text-on-surface dark:text-[#e1e7e8] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer"
              id="theme-toggle-btn"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-primary dark:text-[#00E5FF]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
              <span className="hidden sm:inline text-code-sm font-code-sm font-semibold">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>

            <Link
              className="flex items-center text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] font-label-md text-label-md transition-colors duration-150"
              to="/#support"
            >
              <span className="material-symbols-outlined text-[18px] mr-1">help_outline</span>
              <span>Support</span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-grow flex items-stretch">
        <div className="w-full max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-125px)]">
          {/* LEFT COLUMN: BRANDING & TRUST VERIFICATION RATIONALE */}
          <section className="lg:col-span-6 bg-surface-container-low dark:bg-[#0d1517] border-b lg:border-b-0 lg:border-r border-border-subtle dark:border-[#22353a] p-6 md:p-12 lg:p-16 flex flex-col justify-between transition-colors duration-200">
            <div>
              {/* System Status Tag */}
              <div className="inline-flex items-center gap-2 border border-border-subtle dark:border-[#22353a] bg-surface dark:bg-[#151d1f] px-3 py-1 mb-8">
                <span className="material-symbols-outlined text-primary dark:text-[#00E5FF] text-[18px]">verified_user</span>
                <span className="text-primary dark:text-[#00E5FF] font-label-md text-label-md uppercase tracking-wide">
                  Decentralized Trust Protocol
                </span>
              </div>

              {/* Headline & Context */}
              <div className="mb-10">
                <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary dark:text-white tracking-tight mb-4">
                  Zero-Trust Verification Gateway
                </h1>
                <p className="text-body-lg font-body-lg text-on-surface-variant dark:text-[#91a3a6] leading-relaxed">
                  Engineered exclusively for employers, banking institutions, and government verifiers conducting deterministic checks across academic degrees, professional licenses, and certified land registry titles.
                </p>
              </div>

              {/* Utilitarian Feature Specs */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] flex items-center justify-center text-primary dark:text-[#00E5FF] font-bold">
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </div>
                  <div>
                    <h2 className="text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]">Cryptographic Proof Validation</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] mt-1">
                      Instant mathematical verification of Ed25519 and ECDSA signatures evaluated directly against immutable on-chain state anchors.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] flex items-center justify-center text-primary dark:text-[#00E5FF] font-bold">
                    <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                  </div>
                  <div>
                    <h2 className="text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]">Zero-Knowledge Attribute Checks</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] mt-1">
                      Verify selective claim predicates (e.g. valid license status or degree graduation) without storing sensitive PII or retaining local custody.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 flex-shrink-0 bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] flex items-center justify-center text-primary dark:text-[#00E5FF] font-bold">
                    <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                  </div>
                  <div>
                    <h2 className="text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]">QR Inspection &amp; Webhook Pipeline</h2>
                    <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] mt-1">
                      Automated ingress parsing for physical credentials and high-throughput real-time validation via authenticated HMAC webhooks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Infrastructure Badge */}
            <div className="mt-12 pt-6 border-t border-border-subtle dark:border-[#22353a]">
              <div className="flex items-center gap-3 bg-surface dark:bg-[#151d1f] p-3 border border-border-subtle dark:border-[#22353a]">
                <span className="material-symbols-outlined text-primary dark:text-[#00E5FF] text-[20px]">shield</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]">
                    Supabase JWT Auth &amp; Merkle Proof Validator
                  </span>
                  <span className="text-code-sm font-code-sm text-on-surface-variant dark:text-[#91a3a6]">
                    Standardized RFC 7519 compliance with SHA-256 state tracking
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: AUTH CARD CANVAS */}
          <section className="lg:col-span-6 bg-surface dark:bg-[#080f11] p-6 md:p-12 lg:p-16 flex flex-col justify-center transition-colors duration-200">
            <div className="w-full max-w-[440px] mx-auto">
              {/* Role Pill & Mode Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-block px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase border border-primary dark:border-[#00E5FF] text-primary dark:text-[#00E5FF] bg-surface-container-lowest dark:bg-[#151d1f]">
                  VERIFIER
                </span>
                <button
                  onClick={() => {
                    setIsSignupMode(!isSignupMode);
                    setRoleMismatch(false);
                  }}
                  className="text-secondary dark:text-secondary-container hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] font-label-md text-label-md underline underline-offset-2 transition-colors cursor-pointer"
                  type="button"
                >
                  {isSignupMode ? "Already have an account? Sign In" : "Create your Verifier Account"}
                </button>
              </div>

              {/* Dynamic Header */}
              <h2 className="text-headline-md font-headline-md text-on-surface dark:text-white tracking-tight">
                {isSignupMode ? "Create Verifier Account" : "Verifier Login"}
              </h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] mt-1 mb-6">
                {isSignupMode
                  ? "Register your organization to inspect and verify verifiable credentials."
                  : "Verify credentials with trusted blockchain-backed proof."}
              </p>

              {/* Interactive Error Alert Container */}
              {roleMismatch && (
                <div className="mb-6 border border-status-revoked bg-error-container/30 dark:bg-error/20 p-3 text-on-surface dark:text-white flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error dark:text-error-container text-[20px] flex-shrink-0 mt-0.5">error</span>
                  <div className="text-body-sm font-body-sm">
                    <span>This account is registered as a Holder. </span>
                    <Link className="font-label-md text-primary dark:text-[#00E5FF] underline font-semibold" to="/auth/holder">
                      Go to Holder Dashboard →
                    </Link>
                  </div>
                </div>
              )}

              {/* Loading Progress Banner */}
              {isLoading && (
                <div className="mb-6 border border-border-subtle dark:border-[#22353a] bg-surface-container-low dark:bg-[#151d1f] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-4 w-4 text-primary dark:text-[#00E5FF]" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path>
                    </svg>
                    <span className="text-code-sm font-code-sm text-primary dark:text-[#00E5FF] font-semibold">
                      Signing you in...
                    </span>
                  </div>
                  <span className="text-code-sm font-code-sm text-on-surface-variant dark:text-[#91a3a6]">Connecting RPC Node</span>
                </div>
              )}

              {/* OAuth Provider Option */}
              <button
                onClick={handleGoogleAuthClick}
                className="w-full flex items-center justify-center gap-3 bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] hover:bg-surface-container-low dark:hover:bg-[#192427] text-on-surface dark:text-[#e1e7e8] py-2.5 px-4 font-label-md text-label-md transition-colors duration-150 active:opacity-90 shadow-sm cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" fill="#4285F4"></path>
                  <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" fill="#34A853"></path>
                  <path d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" fill="#FBBC05"></path>
                  <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" fill="#EA4335"></path>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle dark:border-[#22353a]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-surface dark:bg-[#080f11] px-3 text-on-surface-variant dark:text-[#91a3a6] font-code-sm font-semibold uppercase">
                    OR
                  </span>
                </div>
              </div>

              {/* Main Auth Form */}
              <form className="space-y-4" onSubmit={handleFormSubmit}>
                {isSignupMode && (
                  <div className="space-y-1">
                    <label className="block text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]" htmlFor="org_name">
                      Organization / Institution Name
                    </label>
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] px-3 py-2.5 text-body-sm font-body-sm text-on-surface dark:text-[#e1e7e8] rounded-none placeholder:text-outline/70 dark:placeholder:text-[#91a3a6]/60"
                      id="org_name"
                      name="org_name"
                      placeholder="e.g. Department of Land Records, Standard Bank"
                      required={isSignupMode}
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]" htmlFor="work_email">
                    Work Email
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] px-3 py-2.5 text-body-sm font-body-sm text-on-surface dark:text-[#e1e7e8] rounded-none placeholder:text-outline/70 dark:placeholder:text-[#91a3a6]/60"
                    id="work_email"
                    name="work_email"
                    placeholder="Enter your company or organization email (e.g. hr@company.com)"
                    required
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]" htmlFor="account_password">
                      Password
                    </label>
                    {!isSignupMode && (
                      <Link className="text-secondary dark:text-secondary-container hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] text-code-sm font-code-sm underline underline-offset-2" to="/auth/forgot-password">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] pl-3 pr-10 py-2.5 text-body-sm font-body-sm text-on-surface dark:text-[#e1e7e8] rounded-none placeholder:text-outline/70 dark:placeholder:text-[#91a3a6]/60"
                      id="account_password"
                      name="account_password"
                      placeholder="Enter your password"
                      required
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                      className="absolute right-2.5 p-1 text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isPasswordVisible ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {isSignupMode && (
                  <div className="space-y-1">
                    <label className="block text-label-md font-label-md text-on-surface dark:text-[#e1e7e8]" htmlFor="confirm_password">
                      Confirm Password
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] pl-3 pr-10 py-2.5 text-body-sm font-body-sm text-on-surface dark:text-[#e1e7e8] rounded-none placeholder:text-outline/70 dark:placeholder:text-[#91a3a6]/60"
                        id="confirm_password"
                        name="confirm_password"
                        placeholder="Repeat your password"
                        required={isSignupMode}
                        type={isConfirmPasswordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle confirm password visibility"
                        onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        className="absolute right-2.5 p-1 text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isConfirmPasswordVisible ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  className="w-full bg-primary hover:bg-primary-container dark:bg-[#006064] dark:hover:bg-[#00838F] text-on-primary font-label-md text-label-md py-3 px-4 transition-colors duration-150 active:opacity-90 mt-2 text-center cursor-pointer"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Signing you in..." : isSignupMode ? "Create Account" : "Sign In"}
                </button>
              </form>

              {/* System Note */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-on-surface-variant dark:text-[#91a3a6] text-code-sm font-code-sm">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Wallet connection is not required for login.</span>
              </div>

              {/* Bottom Role Pivot Navigation */}
              <div className="mt-8 pt-6 border-t border-border-subtle dark:border-[#22353a] text-center text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] space-y-2">
                <div>Not a verifier? Need to issue or manage records?</div>
                <div className="flex items-center justify-center gap-3 text-label-md font-label-md text-secondary dark:text-secondary-container">
                  <Link className="hover:text-primary dark:hover:text-[#00E5FF] underline underline-offset-2" to="/auth/issuer">
                    Issuer Login
                  </Link>
                  <span className="text-border-subtle dark:border-[#22353a]">|</span>
                  <Link className="hover:text-primary dark:hover:text-[#00E5FF] underline underline-offset-2" to="/auth/holder">
                    Holder Login
                  </Link>
                </div>
              </div>

              {/* Isolated Test Fixtures & State Simulation Controls */}
              <div className="mt-8 p-3 bg-surface-container-low dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a]">
                <div className="text-code-sm font-code-sm text-on-surface dark:text-[#e1e7e8] font-semibold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-primary dark:text-[#00E5FF]">tune</span>
                  <span>Test Fixtures &amp; State Simulation:</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    className="px-2 py-1 bg-surface dark:bg-[#0d1517] border border-border-subtle dark:border-[#22353a] hover:bg-surface-container dark:hover:bg-[#192427] text-on-surface dark:text-[#e1e7e8] transition-colors cursor-pointer"
                    onClick={() => setRoleMismatch(true)}
                    type="button"
                  >
                    Simulate "Holder" Collision Error
                  </button>
                  <button
                    className="px-2 py-1 bg-surface dark:bg-[#0d1517] border border-border-subtle dark:border-[#22353a] hover:bg-surface-container dark:hover:bg-[#192427] text-on-surface dark:text-[#e1e7e8] transition-colors cursor-pointer"
                    onClick={() => {
                      setRoleMismatch(false);
                      setIsLoading(true);
                      setTimeout(() => setIsLoading(false), 2000);
                    }}
                    type="button"
                  >
                    Simulate Loading State
                  </button>
                  <button
                    className="px-2 py-1 bg-surface dark:bg-[#0d1517] border border-border-subtle dark:border-[#22353a] hover:bg-surface-container dark:hover:bg-[#192427] text-on-surface dark:text-[#e1e7e8] transition-colors cursor-pointer"
                    onClick={() => {
                      setRoleMismatch(false);
                      setIsLoading(false);
                    }}
                    type="button"
                  >
                    Reset Alerts
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border-subtle dark:border-[#22353a] bg-surface-container-low dark:bg-[#0d1517] px-margin-mobile md:px-margin-desktop py-base transition-colors duration-200">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] text-center md:text-left">
            © 2026 CredChain Ledger Infrastructure. All credentials cryptographically verifiable on-chain.
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#status">
              Network Status
            </a>
            <a className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#security">
              Security Policy
            </a>
            <a className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#protocol">
              Verification Protocol
            </a>
            <a className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#91a3a6] hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#terms">
              Terms of Trust
            </a>
          </nav>
        </div>
      </footer>

      {/* Floating Return to Top Button */}
      {showScrollTop && (
        <button
          aria-label="Return to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 bg-surface dark:bg-[#151d1f] border border-border-subtle dark:border-[#22353a] text-primary dark:text-[#00E5FF] hover:bg-surface-container dark:hover:bg-[#192427] p-3 shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
        </button>
      )}

      {/* Google Sign-In Interactive Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleModalSuccess}
        role="verifier"
        initialOrganization={orgName || "XYZ Global Bank"}
      />
    </div>
  );
};
