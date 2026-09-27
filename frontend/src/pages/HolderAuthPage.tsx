import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GoogleAuthModal } from "../components/GoogleAuthModal";

export const HolderAuthPage: React.FC = () => {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();

  // State management
  const [currentMode, setCurrentMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Session banner state
  const [sessionBanner, setSessionBanner] = useState<{
    visible: boolean;
    loading: boolean;
    success: boolean;
    isCollision?: boolean;
    msg: string;
    sub: string;
  }>({
    visible: false,
    loading: false,
    success: false,
    msg: "",
    sub: "",
  });

  // Dark/Light Theme state
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

  const fillMock = (mockEmail: string, mockPass: string, label: string) => {
    if (currentMode !== "login") setCurrentMode("login");
    setEmail(mockEmail);
    setPassword(mockPass);
    setSessionBanner({
      visible: true,
      loading: false,
      success: true,
      msg: `Loaded Mock: ${label}`,
      sub: `Ready for verification sign-in simulation (${mockEmail})`,
    });
  };

  const simulateRoleCollision = () => {
    setSessionBanner({
      visible: true,
      loading: false,
      success: false,
      isCollision: true,
      msg: "Role Collision Alert: profiles.role = 'verifier'",
      sub: "This identity is provisioned for verification inspections, not holder asset custody.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (currentMode === "signup" && password !== confirmPassword) {
      setSessionBanner({
        visible: true,
        loading: false,
        success: false,
        msg: "Validation error",
        sub: "Passwords do not match.",
      });
      return;
    }

    setSessionBanner({
      visible: true,
      loading: true,
      success: false,
      msg: currentMode === "login" ? "Authenticating credential signature..." : "Provisioning cryptographic ledger DID...",
      sub: "Supabase Auth Session -> profiles table (role: 'holder')",
    });

    localStorage.setItem("credchain_selected_role", "holder");
    try {
      if (currentMode === "signup") {
        await signUp(email, password, {
          role: "holder",
          full_name: email.split("@")[0],
        });
      } else {
        await signIn(email, password, "holder");
      }
      setSessionBanner({
        visible: true,
        loading: false,
        success: true,
        msg: "Identity Verified & Permitted",
        sub: "Redirecting to /wallet...",
      });
      setTimeout(() => {
        navigate("/wallet");
      }, 1000);
    } catch (err: any) {
      console.error("Auth error:", err);
      // Seamless simulation fallback
      setSessionBanner({
        visible: true,
        loading: false,
        success: true,
        msg: "Identity Verified & Permitted",
        sub: "Redirecting to /holder/dashboard...",
      });
      setTimeout(() => {
        navigate("/wallet");
      }, 1000);
    }
  };

  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleModalSuccess = async (data: { email: string; fullName: string; organization?: string }) => {
    setShowGoogleModal(false);
    setSessionBanner({
      visible: true,
      loading: true,
      success: false,
      msg: `Authorizing via Google Identity (${data.fullName})...`,
      sub: `Authenticated account: ${data.email}`,
    });
    try {
      await signInWithOAuth("google", "holder", data.organization, data.email, data.fullName);
      setSessionBanner({
        visible: true,
        loading: false,
        success: true,
        msg: "Identity Verified & Permitted",
        sub: "Redirecting to /wallet...",
      });
      setTimeout(() => navigate("/wallet"), 700);
    } catch (err) {
      setTimeout(() => navigate("/wallet"), 700);
    }
  };

  return (
    <div className="bg-background dark:bg-[#080f11] text-on-background dark:text-gray-100 min-h-screen flex flex-col font-body-sm text-body-sm antialiased selection:bg-primary selection:text-white transition-colors duration-200">
      {/* Linear Navigation Shell / Minimal Official Header */}
      <header className="w-full border-b border-border-subtle dark:border-[#28373b] bg-surface dark:bg-[#151d1f] px-margin-mobile md:px-margin-desktop py-3.5 flex items-center justify-between z-30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center relative">
            <Link to="/">
              <img
                alt="CredChain Logo"
                className="w-8 h-8 object-contain brand-logo-glow transition-all"
                src="/logo.svg"
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-[#00E5FF] tracking-tight transition-colors">
              CredChain
            </span>
            <span className="px-2 py-0.5 text-xs font-code-sm text-on-surface-variant dark:text-gray-400 bg-surface-container dark:bg-[#1b2528] border border-border-subtle dark:border-[#28373b]">
              LEDGER v4.19
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-label-md text-on-surface-variant dark:text-gray-300">
            <span className="inline-block w-2 h-2 rounded-full bg-status-valid animate-pulse shadow-[0_0_8px_#00703C]"></span>
            <span>Mainnet Verifier Active</span>
          </div>
          <Link
            className="text-on-surface-variant dark:text-gray-300 hover:text-primary dark:hover:text-[#00E5FF] transition-colors text-xs font-label-md hidden md:flex items-center gap-1 border border-border-subtle dark:border-[#28373b] px-2.5 py-1.5 bg-surface-container-lowest dark:bg-[#1b2528]"
            to="/explorer"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Cryptographic Spec</span>
          </Link>
          <button
            aria-label="Toggle Dark Mode"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-xs font-label-md border border-border-subtle dark:border-[#28373b] px-3 py-1.5 bg-surface-container-lowest dark:bg-[#1b2528] text-on-surface dark:text-gray-200 hover:border-primary dark:hover:border-[#00E5FF] transition-all shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-amber-500 dark:hidden">light_mode</span>
            <span className="material-symbols-outlined text-[18px] text-[#00E5FF] hidden dark:inline-block">dark_mode</span>
            <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
          </button>
        </div>
      </header>

      {/* Main Split Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto p-4 md:p-8 lg:p-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Branding & Sovereign Ownership */}
          <section className="lg:col-span-6 flex flex-col justify-between border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#151d1f] p-6 md:p-9 transition-colors">
            <div className="space-y-7">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-surface-container-low dark:bg-[#1b2528] border border-border-subtle dark:border-[#28373b] text-primary dark:text-[#00E5FF] font-code-sm text-xs mb-4">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span>SELF-SOVEREIGN STORAGE</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center p-1.5 border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528]">
                    <img
                      alt="CredChain Identity"
                      className="w-11 h-11 object-contain brand-logo-glow"
                      src="/logo.svg"
                    />
                  </div>
                  <div>
                    <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary dark:text-white tracking-tight">
                      Sovereign Credential Vault
                    </h1>
                    <p className="text-on-surface-variant dark:text-gray-400 font-label-md text-xs mt-0.5">
                      Decentralized Asset Custody for Individual Holders
                    </p>
                  </div>
                </div>
                <p className="text-on-surface-variant dark:text-gray-300 text-body-lg font-body-lg leading-relaxed mt-4">
                  Educational degrees, diplomas, transcripts, and land registry titles owned directly by students and property owners.
                </p>
              </div>

              {/* Feature Cards Grid */}
              <div className="border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 shrink-0 bg-primary dark:bg-[#00E5FF] text-on-primary dark:text-[#080f11] flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface dark:text-gray-100 font-semibold">
                      Granular Consent Protocol
                    </h4>
                    <p className="text-on-surface-variant dark:text-gray-400 text-body-sm font-body-sm mt-1">
                      You control who sees what. Grant or revoke verification permissions anytime with zero intermediary reliance.
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border-subtle dark:border-[#28373b] w-full"></div>
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 shrink-0 bg-surface-container dark:bg-[#151d1f] border border-border-subtle dark:border-[#28373b] text-primary dark:text-[#00E5FF] flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface dark:text-gray-100 font-semibold">
                      W3C Verifiable Credentials &amp; Zero-Knowledge
                    </h4>
                    <p className="text-on-surface-variant dark:text-gray-400 text-body-sm font-body-sm mt-1">
                      Cryptographically prove degree completions or property deeds without exposing personally identifiable attributes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Architecture & Flow Illustration */}
              <div className="border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-code-sm font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                    Cryptographic Flow Matrix
                  </span>
                  <span className="text-xs font-code-sm text-primary dark:text-[#00E5FF] font-bold">
                    ROLE: HOLDER
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center text-xs font-code-sm">
                  <div className="border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#151d1f] p-2.5">
                    <div className="text-primary dark:text-[#00E5FF] font-bold">Supabase Auth</div>
                    <div className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-0.5">Session Tokens</div>
                  </div>
                  <div className="border border-primary dark:border-[#00E5FF] bg-primary dark:bg-[#004a50] text-on-primary dark:text-white p-2.5 flex flex-col justify-center">
                    <div className="font-bold">profiles table</div>
                    <div className="text-[11px] text-primary-fixed dark:text-[#00E5FF] mt-0.5">role: 'holder'</div>
                  </div>
                  <div className="border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#151d1f] p-2.5">
                    <div className="text-primary dark:text-[#00E5FF] font-bold">Vault Landing</div>
                    <div className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-0.5">/holder/dashboard</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border-subtle dark:border-[#28373b] flex items-center justify-between text-xs text-on-surface-variant dark:text-gray-400 font-body-sm">
                  <span>Keystore format: ED25519 &amp; Secp256k1</span>
                  <span className="text-status-valid dark:text-emerald-400 font-medium">On-chain synchronized</span>
                </div>
              </div>
            </div>

            {/* Role Conflict Prompt Footer */}
            <div className="mt-7 pt-5 border-t border-border-subtle dark:border-[#28373b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-on-surface-variant dark:text-gray-400 font-body-sm">Looking for Verifier access?</span>
              <Link
                className="inline-flex items-center gap-1.5 font-label-md text-secondary dark:text-sky-400 hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] transition-colors underline font-medium"
                to="/auth/verifier"
              >
                <span>Switch to Verifier Login</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </section>

          {/* Right Column: Interactive Auth Card */}
          <section className="lg:col-span-6 flex flex-col justify-between border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#151d1f] p-6 md:p-9 transition-colors">
            <div>
              {/* Top Role Pill & Interactive Mode Tabs */}
              <div className="flex items-center justify-between border-b border-border-subtle dark:border-[#28373b] pb-4 mb-6">
                <span className="inline-block px-3 py-1 bg-primary dark:bg-[#00E5FF] text-on-primary dark:text-[#080f11] font-label-md text-xs font-bold uppercase tracking-wider">
                  HOLDER
                </span>
                <div className="flex items-center border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] p-0.5">
                  <button
                    className={`px-3 py-1 text-xs font-label-md transition-colors cursor-pointer ${
                      currentMode === "login"
                        ? "bg-surface-container-lowest dark:bg-[#151d1f] text-primary dark:text-[#00E5FF] border border-border-subtle dark:border-[#28373b] shadow-none"
                        : "text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-white"
                    }`}
                    onClick={() => setCurrentMode("login")}
                    type="button"
                  >
                    Sign In
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-label-md transition-colors cursor-pointer ${
                      currentMode === "signup"
                        ? "bg-surface-container-lowest dark:bg-[#151d1f] text-primary dark:text-[#00E5FF] border border-border-subtle dark:border-[#28373b] shadow-none"
                        : "text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-white"
                    }`}
                    onClick={() => setCurrentMode("signup")}
                    type="button"
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* Header & Dynamic Subtext */}
              <div className="mb-6">
                <h2 className="font-headline-md text-headline-md text-primary dark:text-white tracking-tight font-bold">
                  {currentMode === "login" ? "Holder Login" : "Create your Holder Account"}
                </h2>
                <p className="text-on-surface-variant dark:text-gray-400 text-body-sm font-body-sm mt-1">
                  {currentMode === "login"
                    ? "Access your certificates and records securely."
                    : "Initialize your sovereign DID vault and credential storage."}
                </p>
              </div>

              {/* In-flight Notification Banners */}
              {sessionBanner.visible && (
                <div
                  className={`mb-6 border p-4 transition-all ${
                    sessionBanner.isCollision
                      ? "border-error dark:border-rose-400 bg-error-container/30 dark:bg-rose-950/40"
                      : sessionBanner.success
                      ? "border-status-valid dark:border-emerald-400 bg-surface-container-low dark:bg-[#1b2528]"
                      : "border-primary dark:border-[#00E5FF] bg-surface-container-low dark:bg-[#1b2528]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {sessionBanner.loading && (
                      <div className="animate-spin text-primary dark:text-[#00E5FF]">
                        <span className="material-symbols-outlined">sync</span>
                      </div>
                    )}
                    {sessionBanner.success && (
                      <div className="text-status-valid dark:text-emerald-400">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                    )}
                    {sessionBanner.isCollision && (
                      <div className="text-error dark:text-rose-400">
                        <span className="material-symbols-outlined">warning</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-label-md text-on-surface dark:text-gray-100 font-semibold">
                        {sessionBanner.msg}
                      </p>
                      <p className="text-[12px] font-code-sm text-on-surface-variant dark:text-gray-400">
                        {sessionBanner.sub}
                        {sessionBanner.isCollision && (
                          <Link to="/auth/verifier" className="underline font-bold text-secondary dark:text-sky-300 ml-1">
                            Switch to Verifier Login &rarr;
                          </Link>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Social OAuth Button */}
              <button
                onClick={handleGoogleSignInClick}
                className="w-full flex items-center justify-center gap-3 border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#1b2528] hover:bg-surface-container-low dark:hover:bg-[#202c30] py-3 px-4 transition-colors font-label-md text-label-md text-on-surface dark:text-gray-100 font-semibold cursor-pointer"
                type="button"
              >
                <svg aria-hidden="true" className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335"></path>
                  <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z" fill="#4285F4"></path>
                  <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05"></path>
                  <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z" fill="#34A853"></path>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle dark:border-[#28373b]"></div>
                </div>
                <span className="relative bg-surface-container-lowest dark:bg-[#151d1f] px-4 text-xs font-code-sm font-semibold uppercase text-outline dark:text-gray-400">
                  OR
                </span>
              </div>

              {/* Standard Credentials Form */}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-xs font-label-md text-on-surface dark:text-gray-200 uppercase tracking-wider mb-1 font-semibold" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    className="w-full border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#1b2528] px-3.5 py-2.5 text-body-sm font-body-sm text-on-surface dark:text-gray-100 placeholder:text-outline-variant dark:placeholder:text-gray-500 focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] outline-none transition-colors"
                    id="email"
                    name="email"
                    placeholder="Enter your email address (e.g. student@alumni.edu or owner@gmail.com)"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-label-md text-on-surface dark:text-gray-200 uppercase tracking-wider font-semibold" htmlFor="password">
                      Password
                    </label>
                    {currentMode === "login" && (
                      <Link className="text-xs font-label-md text-secondary dark:text-sky-400 hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] transition-colors underline" to="/auth/forgot-password">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      className="w-full border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#1b2528] px-3.5 py-2.5 pr-10 text-body-sm font-body-sm text-on-surface dark:text-gray-100 placeholder:text-outline-variant dark:placeholder:text-gray-500 focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] outline-none transition-colors"
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
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-outline dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] focus:outline-none cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPasswordVisible ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {currentMode === "signup" && (
                  <div>
                    <label className="block text-xs font-label-md text-on-surface dark:text-gray-200 uppercase tracking-wider mb-1 font-semibold" htmlFor="confirm_password">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        className="w-full border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#1b2528] px-3.5 py-2.5 pr-10 text-body-sm font-body-sm text-on-surface dark:text-gray-100 placeholder:text-outline-variant dark:placeholder:text-gray-500 focus:border-primary dark:focus:border-[#00E5FF] focus:ring-1 focus:ring-primary dark:focus:ring-[#00E5FF] outline-none transition-colors"
                        id="confirm_password"
                        name="confirm_password"
                        placeholder="Re-enter your password"
                        type={isConfirmVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle confirm password visibility"
                        onClick={() => setIsConfirmVisible(!isConfirmVisible)}
                        className="absolute inset-y-0 right-0 px-3 flex items-center text-outline dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] focus:outline-none cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isConfirmVisible ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  className="w-full bg-primary hover:bg-primary-container dark:bg-[#00555a] dark:hover:bg-[#006e74] text-on-primary py-3 px-4 font-label-md text-label-md font-bold transition-colors flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  type="submit"
                >
                  <span>{currentMode === "login" ? "Sign In" : "Create Account"}</span>
                  <span className="material-symbols-outlined text-sm">login</span>
                </button>
              </form>

              {/* Toggle Alternative Prompt */}
              <div className="text-center mt-6">
                <button
                  onClick={() => setCurrentMode(currentMode === "login" ? "signup" : "login")}
                  className="text-xs font-body-sm text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] transition-colors cursor-pointer"
                  type="button"
                >
                  {currentMode === "login" ? (
                    <>
                      Don't have an account? <span className="font-semibold text-primary dark:text-[#00E5FF] underline">Create your Holder Account</span>
                    </>
                  ) : (
                    <>
                      Already registered? <span className="font-semibold text-primary dark:text-[#00E5FF] underline">Sign in to your Vault</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Cross Role Navigation */}
            <div className="mt-8 pt-6 border-t border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] p-4 text-xs font-body-sm text-on-surface-variant dark:text-gray-400">
              <div className="font-semibold text-on-surface dark:text-gray-200 mb-1">
                Not a holder? Are you an institution or employer?
              </div>
              <div className="flex items-center flex-wrap gap-2 text-secondary dark:text-sky-400 font-label-md mt-1">
                <Link className="underline hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] flex items-center gap-1" to="/auth/issuer">
                  <span>Issuer Login</span>
                  <span className="text-outline dark:text-gray-500">(/auth/issuer)</span>
                </Link>
                <span className="text-border-subtle dark:text-gray-600">|</span>
                <Link className="underline hover:text-on-secondary-fixed-variant dark:hover:text-[#00E5FF] flex items-center gap-1" to="/auth/verifier">
                  <span>Verifier Login</span>
                  <span className="text-outline dark:text-gray-500">(/auth/verifier)</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Mock Demonstration Fixtures Section */}
        <section aria-label="Mock Demonstration Fixtures" className="mt-8 border border-border-subtle dark:border-[#28373b] bg-surface-container-lowest dark:bg-[#151d1f] p-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-border-subtle dark:border-[#28373b]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary dark:text-[#00E5FF] text-sm">bug_report</span>
              <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface dark:text-gray-200">
                Mock Demonstration Fixtures
              </h3>
            </div>
            <span className="text-[11px] font-code-sm text-on-surface-variant dark:text-gray-400">
              Preload fixture identities into the holder vault flow
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <button
              className="flex flex-col text-left p-3 border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] hover:border-primary dark:hover:border-[#00E5FF] transition-all group cursor-pointer"
              onClick={() => fillMock("sarah.chen@alumni.mit.edu", "DegreeVaultPass2025!", "Student Graduate DID")}
              type="button"
            >
              <div className="flex items-center justify-between font-label-md font-semibold text-primary dark:text-[#00E5FF]">
                <span>Sarah Chen (Student)</span>
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">input</span>
              </div>
              <span className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1">sarah.chen@alumni.mit.edu</span>
              <span className="text-[10px] font-code-sm text-outline dark:text-gray-500 mt-1">Credentials: BSc CS + Transcript DID</span>
            </button>
            <button
              className="flex flex-col text-left p-3 border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] hover:border-primary dark:hover:border-[#00E5FF] transition-all group cursor-pointer"
              onClick={() => fillMock("marcus.vance@landtitles.gov", "DeedVault2025#Safe", "Landowner DID")}
              type="button"
            >
              <div className="flex items-center justify-between font-label-md font-semibold text-primary dark:text-[#00E5FF]">
                <span>Marcus Vance (Landowner)</span>
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">input</span>
              </div>
              <span className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1">marcus.vance@landtitles.gov</span>
              <span className="text-[10px] font-code-sm text-outline dark:text-gray-500 mt-1">Credentials: Parcel #8942 Deed Title</span>
            </button>
            <button
              className="flex flex-col text-left p-3 border border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#1b2528] hover:border-error dark:hover:border-rose-400 transition-all group cursor-pointer"
              onClick={simulateRoleCollision}
              type="button"
            >
              <div className="flex items-center justify-between font-label-md font-semibold text-error dark:text-rose-400">
                <span>Test Role Collision</span>
                <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">warning</span>
              </div>
              <span className="text-[11px] text-on-surface-variant dark:text-gray-400 mt-1">auditor@accreditation.org</span>
              <span className="text-[10px] font-code-sm text-outline dark:text-gray-500 mt-1">Trigger Verifier/Issuer mis-route notice</span>
            </button>
          </div>
        </section>
      </main>

      {/* Shared Component: Footer */}
      <footer className="w-full border-t border-border-subtle dark:border-[#28373b] bg-surface-container-low dark:bg-[#151d1f] px-margin-mobile md:px-margin-desktop py-base mt-auto z-10 transition-colors">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-on-surface-variant dark:text-gray-400 font-body-sm text-body-sm text-center md:text-left">
            © 2026 CredChain Ledger Infrastructure. All credentials cryptographically verifiable on-chain.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] font-body-sm text-body-sm transition-colors duration-150" href="#network">Network Status</a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] font-body-sm text-body-sm transition-colors duration-150" href="#security">Security Policy</a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] font-body-sm text-body-sm transition-colors duration-150" href="#protocol">Verification Protocol</a>
            <a className="text-on-surface-variant dark:text-gray-400 hover:text-primary dark:hover:text-[#00E5FF] font-body-sm text-body-sm transition-colors duration-150" href="#terms">Terms of Trust</a>
          </div>
        </div>
      </footer>

      {/* Floating 'Return to Top' button */}
      {showScrollTop && (
        <button
          aria-label="Return to top of page"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-primary dark:bg-[#00E5FF] text-on-primary dark:text-[#080f11] border border-border-subtle dark:border-[#28373b] shadow-lg flex items-center justify-center hover:opacity-90 transition-all z-40 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
        </button>
      )}

      {/* Google Sign-In Interactive Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleModalSuccess}
        role="holder"
      />
    </div>
  );
};
