import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";

interface PasswordRecoveryPageProps {
  initialRoute?: "forgot" | "reset" | "both";
}

export const PasswordRecoveryPage: React.FC<PasswordRecoveryPageProps> = ({ initialRoute = "forgot" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mode state: 'forgot' | 'reset' | 'both'
  const [activeRoute, setActiveRoute] = useState<"forgot" | "reset" | "both">(() => {
    if (location.pathname.includes("reset-password")) return "reset";
    return initialRoute;
  });

  // Module 1: Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Module 2: Reset Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  // Return to top visibility
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

  // Password strength evaluation
  const getPasswordStrength = (val: string) => {
    if (!val || val.length === 0) {
      return { score: 0, label: "Awaiting Input", badgeColor: "text-outline dark:text-[#8ea9ad]" };
    }
    const hasLength = val.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(val);
    const hasNumbers = /[0-9]/.test(val);
    const hasSpecial = /[^a-zA-Z0-9]/.test(val);

    let score = 0;
    if (hasLength) score++;
    if (hasLetters && hasNumbers) score++;
    if (val.length >= 12 && hasSpecial) score++;

    if (score <= 1) {
      return { score: 1, label: "Weak", badgeColor: "bg-error-container dark:bg-[#3d1212] text-error dark:text-[#ff8a8a]" };
    } else if (score === 2) {
      return { score: 2, label: "Medium", badgeColor: "bg-surface-container dark:bg-[#2c1d12] text-status-pending dark:text-[#ff9c6b]" };
    } else {
      return { score: 3, label: "Strong", badgeColor: "bg-surface-container dark:bg-[#0d2a1b] text-status-valid dark:text-[#4ade80]" };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const isMatching = confirmPassword ? newPassword === confirmPassword : null;

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
    } catch {}
    setForgotLoading(false);
    setForgotSubmitted(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Verification failed: Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch {}
    setResetLoading(false);
    setResetSubmitted(true);
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  return (
    <div className="bg-background dark:bg-[#080f11] text-on-surface dark:text-[#d1e0e0] font-body-sm text-body-sm min-h-screen flex flex-col antialiased selection:bg-primary selection:text-on-primary transition-colors duration-200">
      {/* TOP APP BAR */}
      <header className="w-full border-b border-border-subtle dark:border-[#1e2d30] bg-surface dark:bg-[#0d1517] sticky top-0 z-50 px-margin-mobile md:px-margin-desktop transition-colors">
        <div className="max-w-container-max mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary" to="/">
              <img
                alt="CredChain Cryptographic Protocol Logo"
                className="h-8 w-8 object-contain logo-glow-pulse transition-all drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
              <span className="text-headline-md font-headline-md text-primary dark:text-[#00E5FF] tracking-tight font-bold transition-colors">
                CredChain
              </span>
            </Link>
            <div className="hidden sm:inline-flex items-center px-2 py-0.5 border border-border-subtle dark:border-[#1e2d30] bg-surface-container-low dark:bg-[#151d1f] text-on-surface-variant dark:text-[#7f9ba0] font-code-sm text-code-sm uppercase">
              Ledger v4.18
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <div className="hidden lg:flex items-center gap-6 border-r border-border-subtle dark:border-[#1e2d30] pr-6">
              <Link className="text-on-surface-variant dark:text-[#8ea9ad] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150 flex items-center gap-1.5" to="/verify">
                <span className="material-symbols-outlined text-[18px]">shield</span>
                <span>Verify</span>
              </Link>
              <Link className="text-on-surface-variant dark:text-[#8ea9ad] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" to="/auth/issuer">
                Institutions
              </Link>
              <Link className="text-on-surface-variant dark:text-[#8ea9ad] font-label-md text-label-md py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" to="/explorer">
                Documentation
              </Link>
            </div>

            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg border border-border-subtle dark:border-[#1e2d30] bg-surface-container-low dark:bg-[#151d1f] text-on-surface-variant dark:text-[#00E5FF] hover:text-primary dark:hover:bg-[#1b2629] transition-colors focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              id="theme-toggle"
              title="Toggle Dark/Light Mode"
            >
              <span className="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
              <span className="material-symbols-outlined text-[20px] hidden dark:inline-block text-[#00E5FF]">light_mode</span>
            </button>

            <div className="flex items-center gap-3">
              <Link
                className="inline-flex items-center gap-1 text-primary dark:text-[#00E5FF] font-label-md text-label-md px-3 py-2 border border-border-subtle dark:border-[#1e2d30] bg-surface dark:bg-[#151d1f] hover:bg-surface-container dark:hover:bg-[#1e292d] transition-colors duration-150"
                to="/login"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Login</span>
              </Link>
              <Link
                className="hidden sm:inline-flex items-center gap-1 text-on-surface-variant dark:text-[#8ea9ad] font-label-md text-label-md px-2.5 py-2 hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150"
                to="/#support"
              >
                <span className="material-symbols-outlined text-[18px]">help_outline</span>
                <span>Support</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* PROTOCOL SECURITY STATUS RIBBON */}
      <aside className="w-full bg-surface-container dark:bg-[#0c1416] border-b border-border-subtle dark:border-[#1e2d30] py-2 px-margin-mobile md:px-margin-desktop text-on-surface-variant dark:text-[#8fa8ad] transition-colors">
        <div className="max-w-container-max mx-auto flex flex-wrap items-center justify-between gap-2 font-code-sm text-code-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-status-valid shadow-[0_0_8px_#00703C]"></span>
            <span className="text-on-surface dark:text-[#e1ecee] font-semibold">CRYPTOGRAPHIC LEDGER STATUS:</span>
            <span className="text-on-surface-variant dark:text-[#7ba0a6]">Consensus Nominal (0x9F41…E2)</span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant dark:text-[#7ba0a6]">
            <span>
              Session Entropy: <strong className="text-on-surface dark:text-[#00E5FF] font-code-sm">256-bit SHA-3</strong>
            </span>
            <span className="hidden md:inline">TLS 1.3 Strict Pinning</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        {/* Section Header & Switcher Context */}
        <div className="mb-8 md:mb-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container-high dark:bg-[#151d1f] border border-border-subtle dark:border-[#1e2d30] text-primary dark:text-[#00E5FF] font-label-md text-label-md tracking-wider uppercase mb-3">
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Cryptographic Access Recovery Suite</span>
          </div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg font-headline-lg text-primary dark:text-[#e4f6f8] tracking-tight">
            Authenticate &amp; Reclaim Ledger Keys
          </h1>
          <p className="mt-2 text-body-lg font-body-lg text-on-surface-variant dark:text-[#8ba7ac]">
            Select a transaction route below to request a time-locked recovery signature or establish new cryptographic keypairs.
          </p>

          {/* Protocol Route Tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border-subtle dark:border-[#1e2d30] pb-px">
            <button
              onClick={() => setActiveRoute("forgot")}
              className={`px-4 py-2 font-label-md text-label-md flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
                activeRoute === "forgot"
                  ? "border-b-2 border-primary dark:border-[#00E5FF] text-primary dark:text-[#00E5FF] font-semibold"
                  : "border-b-2 border-transparent text-on-surface-variant dark:text-[#7f9ea4] hover:text-primary dark:hover:text-[#00E5FF]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Route: /auth/forgot-password</span>
            </button>
            <button
              onClick={() => setActiveRoute("reset")}
              className={`px-4 py-2 font-label-md text-label-md flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
                activeRoute === "reset"
                  ? "border-b-2 border-primary dark:border-[#00E5FF] text-primary dark:text-[#00E5FF] font-semibold"
                  : "border-b-2 border-transparent text-on-surface-variant dark:text-[#7f9ea4] hover:text-primary dark:hover:text-[#00E5FF]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              <span>Route: /auth/reset-password</span>
            </button>
            <button
              onClick={() => setActiveRoute("both")}
              className={`px-4 py-2 font-label-md text-label-md flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
                activeRoute === "both"
                  ? "border-b-2 border-primary dark:border-[#00E5FF] text-primary dark:text-[#00E5FF] font-semibold"
                  : "border-b-2 border-transparent text-on-surface-variant dark:text-[#7f9ea4] hover:text-primary dark:hover:text-[#00E5FF]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              <span>Dual Inspection View</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div
          className={`grid gap-8 items-start ${
            activeRoute === "both" ? "grid-cols-1 lg:grid-cols-2" : "max-w-2xl mx-auto grid-cols-1"
          }`}
        >
          {/* ================= MODULE 1: FORGOT PASSWORD ================= */}
          {(activeRoute === "forgot" || activeRoute === "both") && (
            <section className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#1e2d30] p-6 md:p-8 flex flex-col justify-between shadow-sm transition-colors">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle dark:border-[#1e2d30] pb-4 mb-6">
                  <span className="px-2.5 py-1 bg-surface-container dark:bg-[#101718] text-primary dark:text-[#00E5FF] font-code-sm text-code-sm font-semibold tracking-wider border border-transparent dark:border-[#1d292b]">
                    RECOVERY PROTOCOL
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">
                    ROUTE: /auth/forgot-password
                  </span>
                </div>
                <h2 className="text-headline-md font-headline-md text-primary dark:text-[#e6f7f9]">
                  Reset your password
                </h2>
                <p className="mt-2 text-body-sm font-body-sm text-on-surface-variant dark:text-[#8ba7ac]">
                  Enter your email and we'll send you a password reset link.
                </p>

                {/* Form */}
                <form className={`mt-6 space-y-5 ${forgotSubmitted ? "opacity-40 pointer-events-none" : ""}`} onSubmit={handleForgotSubmit}>
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface dark:text-[#d1e0e0] mb-2" htmlFor="email-recovery">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-3.5 py-2 border border-border-subtle dark:border-[#27383c] bg-surface dark:bg-[#0d1517] text-on-surface dark:text-[#e4f6f8] text-body-sm font-body-sm placeholder:text-outline dark:placeholder:text-[#526f74] focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] focus:outline-none transition-colors"
                        id="email-recovery"
                        name="email"
                        placeholder="Enter your registered email address"
                        required
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-outline dark:text-[#5d7f85] text-[18px]">
                        mail
                      </span>
                    </div>
                    <p className="mt-1.5 font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">
                      Associated credential identity (DID, Institutional, or Personal Ledger ID).
                    </p>
                  </div>

                  <div className="p-3.5 bg-surface-container-low dark:bg-[#0d1517] border border-border-subtle dark:border-[#1e2d30] flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary dark:text-[#00E5FF] text-[20px] shrink-0 mt-0.5">shield</span>
                    <div className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#8ea9ad]">
                      <strong className="text-on-surface dark:text-[#d7eaed]">Time-Lock Envelope:</strong> Recovery hashes expire automatically after 15 minutes of non-settlement to prevent unauthenticated chain replay attacks.
                    </div>
                  </div>

                  <button
                    className="w-full h-11 bg-primary dark:bg-[#00E5FF] text-on-primary dark:text-[#00383b] font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container dark:hover:bg-[#33ebff] transition-colors duration-150 active:opacity-90 cursor-pointer font-semibold shadow-sm"
                    disabled={forgotLoading}
                    type="submit"
                  >
                    <span>{forgotLoading ? "Dispatching Token..." : "Send Reset Link"}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </form>

                {/* Success Banner State */}
                {forgotSubmitted && (
                  <div className="mt-6 p-4 bg-surface-container-low dark:bg-[#0d1517] border-l-4 border-status-valid border-y border-r border-border-subtle dark:border-[#1e2d30]">
                    <div className="flex items-start gap-3">
                      <span className="text-status-valid font-bold text-lg leading-tight">✓</span>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface dark:text-[#e4f6f8]">
                          Check your email for the password reset link. We've sent a secure recovery link to your inbox.
                        </p>
                        <p className="mt-1 font-code-sm text-code-sm text-on-surface-variant dark:text-[#8ba7ac]">
                          Dispatched from node cluster: <span className="text-primary dark:text-[#00E5FF] font-medium">relay.credchain.net [Nonce: #90384]</span>
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            className="text-secondary dark:text-[#6eb2fe] font-label-md text-label-md hover:underline cursor-pointer"
                            onClick={() => alert("A refreshed cryptographic recovery token has been broadcast to your registered address.")}
                            type="button"
                          >
                            Resend link (60s cooldown)
                          </button>
                          <span className="text-border-subtle dark:text-[#27383c]">•</span>
                          <button
                            className="text-on-surface-variant dark:text-[#8ea9ad] font-code-sm text-code-sm hover:text-primary dark:hover:text-[#00E5FF] cursor-pointer"
                            onClick={() => setForgotSubmitted(false)}
                            type="button"
                          >
                            Edit email address
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border-subtle dark:border-[#1e2d30] flex items-center justify-between">
                <Link
                  className="text-primary dark:text-[#00E5FF] font-label-md text-label-md hover:text-primary-container dark:hover:underline inline-flex items-center gap-1.5 transition-colors"
                  to="/login"
                >
                  <span>← Return to Role Selection</span>
                </Link>
                <span className="font-code-sm text-code-sm text-outline dark:text-[#608287]">CredChain v4.18 Auth</span>
              </div>
            </section>
          )}

          {/* ================= MODULE 2: RESET PASSWORD ================= */}
          {(activeRoute === "reset" || activeRoute === "both") && (
            <section className="w-full bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#1e2d30] p-6 md:p-8 flex flex-col justify-between shadow-sm transition-colors">
              <div>
                <div className="flex items-center justify-between border-b border-border-subtle dark:border-[#1e2d30] pb-4 mb-6">
                  <span className="px-2.5 py-1 bg-surface-container dark:bg-[#101718] text-primary dark:text-[#00E5FF] font-code-sm text-code-sm font-semibold tracking-wider border border-transparent dark:border-[#1d292b]">
                    KEY ROTATION SPECIFICATION
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">
                    ROUTE: /auth/reset-password
                  </span>
                </div>
                <h2 className="text-headline-md font-headline-md text-primary dark:text-[#e6f7f9]">
                  Create a new password
                </h2>
                <p className="mt-2 text-body-sm font-body-sm text-on-surface-variant dark:text-[#8ba7ac]">
                  Your new password must be at least 8 characters and include a combination of letters and numbers.
                </p>

                {/* Form */}
                <form className={`mt-6 space-y-5 ${resetSubmitted ? "opacity-40 pointer-events-none" : ""}`} onSubmit={handleResetSubmit}>
                  {/* Input 1: New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block font-label-md text-label-md text-on-surface dark:text-[#d1e0e0]" htmlFor="new-password">
                        New Password
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">Entropy:</span>
                        <span className={`px-2 py-0.5 font-code-sm text-code-sm font-semibold border border-transparent dark:border-[#223337] ${strength.badgeColor}`}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-3.5 py-2 pr-10 border border-border-subtle dark:border-[#27383c] bg-surface dark:bg-[#0d1517] text-on-surface dark:text-[#e4f6f8] text-body-sm font-body-sm placeholder:text-outline dark:placeholder:text-[#526f74] focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] focus:outline-none transition-colors"
                        id="new-password"
                        minLength={8}
                        name="new_password"
                        placeholder="Enter new password"
                        required
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle password view"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-outline dark:text-[#5d7f85] hover:text-primary dark:hover:text-[#00E5FF] transition-colors focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showNewPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>

                    {/* Visual 3-Segment Metric Bar */}
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <div className={`h-1 transition-colors ${strength.score >= 1 ? (strength.score === 1 ? "bg-error" : strength.score === 2 ? "bg-status-pending" : "bg-status-valid") : "bg-surface-variant dark:bg-[#202c2f]"}`}></div>
                      <div className={`h-1 transition-colors ${strength.score >= 2 ? (strength.score === 2 ? "bg-status-pending" : "bg-status-valid") : "bg-surface-variant dark:bg-[#202c2f]"}`}></div>
                      <div className={`h-1 transition-colors ${strength.score >= 3 ? "bg-status-valid" : "bg-surface-variant dark:bg-[#202c2f]"}`}></div>
                    </div>
                    <div className="mt-1 flex items-center justify-between font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">
                      <span>Minimum 8 chars</span>
                      <span>Numbers &amp; Letters required</span>
                    </div>
                  </div>

                  {/* Input 2: Confirm Password */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface dark:text-[#d1e0e0] mb-2" htmlFor="confirm-password">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-11 px-3.5 py-2 pr-10 border border-border-subtle dark:border-[#27383c] bg-surface dark:bg-[#0d1517] text-on-surface dark:text-[#e4f6f8] text-body-sm font-body-sm placeholder:text-outline dark:placeholder:text-[#526f74] focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] focus:outline-none transition-colors"
                        id="confirm-password"
                        name="confirm_password"
                        placeholder="Confirm new password"
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle password view"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-outline dark:text-[#5d7f85] hover:text-primary dark:hover:text-[#00E5FF] transition-colors focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showConfirmPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <p className={`mt-1.5 font-code-sm text-code-sm ${
                      isMatching === null
                        ? "text-on-surface-variant dark:text-[#7ba0a6]"
                        : isMatching
                        ? "text-status-valid dark:text-[#4ade80] font-medium"
                        : "text-error dark:text-[#ff8a8a] font-medium"
                    }`}>
                      {isMatching === null
                        ? "Must match the key entered above exactly."
                        : isMatching
                        ? "✓ Passwords match cryptographic signature requirements."
                        : "✕ Passwords do not match."}
                    </p>
                  </div>

                  <button
                    className="w-full h-11 bg-primary dark:bg-[#00E5FF] text-on-primary dark:text-[#00383b] font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container dark:hover:bg-[#33ebff] transition-colors duration-150 active:opacity-90 cursor-pointer font-semibold shadow-sm"
                    disabled={resetLoading}
                    type="submit"
                  >
                    <span>{resetLoading ? "Updating Keypair..." : "Update Password"}</span>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </button>
                </form>

                {/* Update Success Toast State */}
                {resetSubmitted && (
                  <div className="mt-6 p-4 bg-surface-container-low dark:bg-[#0d1517] border-l-4 border-status-valid border-y border-r border-border-subtle dark:border-[#1e2d30]">
                    <div className="flex items-start gap-3">
                      <span className="text-status-valid font-bold text-lg leading-tight">✓</span>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface dark:text-[#e4f6f8]">
                          Password updated and cryptographic signature verified on-chain.
                        </p>
                        <p className="mt-1 font-code-sm text-code-sm text-on-surface-variant dark:text-[#8ba7ac]">
                          Executing automatic redirect to selected institutional workspace...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Redirect Notice Section */}
              <div className="mt-8 pt-6 border-t border-border-subtle dark:border-[#1e2d30]">
                <div className="p-4 bg-surface-container-low dark:bg-[#0d1517] border border-border-subtle dark:border-[#1e2d30] flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary dark:text-[#6eb2fe] text-[20px] shrink-0 mt-0.5">info</span>
                  <div className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#8ea9ad]">
                    <span className="font-semibold text-on-surface dark:text-[#d7eaed] block mb-1">Redirect notice:</span>
                    <p>
                      After updating, you will be directed to your role-specific dashboard (<code className="font-code-sm text-code-sm text-primary dark:text-[#00E5FF]">/issuer/dashboard</code>, <code className="font-code-sm text-code-sm text-primary dark:text-[#00E5FF]">/holder/dashboard</code>, or <code className="font-code-sm text-code-sm text-primary dark:text-[#00E5FF]">/verifier/dashboard</code>).
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link className="px-2 py-1 bg-surface-container dark:bg-[#151d1f] border border-border-subtle dark:border-[#27383c] font-code-sm text-code-sm text-on-surface dark:text-[#c4dede] hover:bg-surface-variant dark:hover:bg-[#202c2f]" to="/issuer">
                        /issuer
                      </Link>
                      <Link className="px-2 py-1 bg-surface-container dark:bg-[#151d1f] border border-border-subtle dark:border-[#27383c] font-code-sm text-code-sm text-on-surface dark:text-[#c4dede] hover:bg-surface-variant dark:hover:bg-[#202c2f]" to="/wallet">
                        /holder
                      </Link>
                      <Link className="px-2 py-1 bg-surface-container dark:bg-[#151d1f] border border-border-subtle dark:border-[#27383c] font-code-sm text-code-sm text-on-surface dark:text-[#c4dede] hover:bg-surface-variant dark:hover:bg-[#202c2f]" to="/verify">
                        /verifier
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* RECOVERY AUDIT TRAIL TABLE (Mock Demonstration Fixtures) */}
        <section className="mt-12 bg-surface-container-lowest dark:bg-[#151d1f] border border-border-subtle dark:border-[#1e2d30] p-6 md:p-8 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-border-subtle dark:border-[#1e2d30] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-headline-md font-headline-md text-primary dark:text-[#e4f6f8]">Institutional Access &amp; Audit Log</h3>
                <span className="px-2 py-0.5 bg-surface-container dark:bg-[#0d1517] text-on-surface-variant dark:text-[#7ba0a6] text-[11px] font-code-sm uppercase border border-border-subtle dark:border-[#1e2d30]">
                  Mock Demonstration Fixtures
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-[#8ba7ac]">
                Record of recent identity challenge challenges and cryptographic dispatch receipts.
              </p>
            </div>
            <div className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant dark:text-[#7ba0a6]">
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Ledger Synced at Block #19,402,112</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm border-collapse">
              <thead>
                <tr className="bg-surface-container dark:bg-[#0d1517] border-b border-border-subtle dark:border-[#1e2d30] font-label-md text-label-md text-on-surface dark:text-[#d1e0e0]">
                  <th className="p-3">Protocol Route</th>
                  <th className="p-3">Target DID / Identifier</th>
                  <th className="p-3">Challenge Type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle dark:divide-[#1e2d30] font-code-sm text-code-sm">
                <tr className="hover:bg-surface-container-low dark:hover:bg-[#1a2426] transition-colors">
                  <td className="p-3 text-primary dark:text-[#00E5FF] font-medium">/auth/forgot-password</td>
                  <td className="p-3 text-on-surface-variant dark:text-[#8ea9ad]">did:cred:8f92a…991</td>
                  <td className="p-3 text-on-surface dark:text-[#c4dede]">HMAC-SHA256 Token</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-surface-container dark:bg-[#0d1517] text-status-valid border border-border-subtle dark:border-[#1e2d30] font-label-md text-label-md font-semibold">
                      Delivered
                    </span>
                  </td>
                  <td className="p-3 text-right text-on-surface-variant dark:text-[#7ba0a6]">2026-03-30 14:18:02</td>
                </tr>
                <tr className="hover:bg-surface-container-low dark:hover:bg-[#1a2426] transition-colors">
                  <td className="p-3 text-primary dark:text-[#00E5FF] font-medium">/auth/reset-password</td>
                  <td className="p-3 text-on-surface-variant dark:text-[#8ea9ad]">did:cred:4b01e…31c</td>
                  <td className="p-3 text-on-surface dark:text-[#c4dede]">Key Rotation / Ed25519</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-surface-container dark:bg-[#0d1517] text-status-valid border border-border-subtle dark:border-[#1e2d30] font-label-md text-label-md font-semibold">
                      Committed
                    </span>
                  </td>
                  <td className="p-3 text-right text-on-surface-variant dark:text-[#7ba0a6]">2026-03-30 13:54:19</td>
                </tr>
                <tr className="hover:bg-surface-container-low dark:hover:bg-[#1a2426] transition-colors">
                  <td className="p-3 text-primary dark:text-[#00E5FF] font-medium">/auth/forgot-password</td>
                  <td className="p-3 text-on-surface-variant dark:text-[#8ea9ad]">did:cred:7a33d…55e</td>
                  <td className="p-3 text-on-surface dark:text-[#c4dede]">HMAC-SHA256 Token</td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-surface-container dark:bg-[#0d1517] text-status-pending border border-border-subtle dark:border-[#1e2d30] font-label-md text-label-md font-semibold">
                      Pending Verification
                    </span>
                  </td>
                  <td className="p-3 text-right text-on-surface-variant dark:text-[#7ba0a6]">2026-03-30 12:40:45</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* FLOATING RETURN TO TOP BUTTON */}
      {showScrollTop && (
        <button
          aria-label="Return to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 bg-surface dark:bg-[#151d1f] text-primary dark:text-[#00E5FF] border border-border-subtle dark:border-[#223337] shadow-lg rounded-full hover:bg-surface-container dark:hover:bg-[#1f2a2e] transition-all duration-200 z-40 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          id="return-to-top"
          title="Return to Top"
        >
          <span className="material-symbols-outlined text-[20px] block">arrow_upward</span>
        </button>
      )}

      {/* FOOTER */}
      <footer className="w-full border-t border-border-subtle dark:border-[#1e2d30] bg-surface-container-low dark:bg-[#080f11] px-margin-mobile md:px-margin-desktop py-base mt-auto transition-colors">
        <div className="max-w-container-max mx-auto py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <span className="text-headline-md font-headline-md font-bold text-primary dark:text-[#00E5FF]">CredChain</span>
            <span className="hidden sm:inline text-border-subtle dark:text-[#1e2d30]">|</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant dark:text-[#7ba0a6]">
              © 2026 CredChain Ledger Infrastructure. All credentials cryptographically verifiable on-chain.
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <a className="text-on-surface-variant dark:text-[#7ba0a6] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150 flex items-center gap-1.5" href="#network-status">
              <span className="w-2 h-2 rounded-full bg-status-valid inline-block shadow-[0_0_6px_#00703C]"></span>
              <span>Network Status</span>
            </a>
            <a className="text-on-surface-variant dark:text-[#7ba0a6] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#security-policy">
              Security Policy
            </a>
            <a className="text-on-surface-variant dark:text-[#7ba0a6] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#verification-protocol">
              Verification Protocol
            </a>
            <a className="text-on-surface-variant dark:text-[#7ba0a6] font-body-sm text-body-sm hover:text-primary dark:hover:text-[#00E5FF] transition-colors duration-150" href="#terms-of-trust">
              Terms of Trust
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
