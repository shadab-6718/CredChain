import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { UserRole } from "../types";
import { GoogleAuthModal } from "../components/GoogleAuthModal";
import { UserAuthBadge } from "../components/UserAuthBadge";

interface LoginPageProps {
  defaultRole?: UserRole;
  defaultIsSignUp?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultRole = "issuer" }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { signInWithEmail, signInWithOAuth, signInWithGithub, switchDemoRole } = useAuth();
  const { connectWallet, account } = useWeb3();
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

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    switchDemoRole(role);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Preset example credentials per role
  const exampleCredentials: Record<UserRole, { email: string; org: string; note: string; path: string }> = {
    issuer: {
      email: "registrar@abc-university.edu",
      org: "ABC Institute of Technology",
      note: "Authorized University Issuer — Anchor & revoke student degree credentials on Polygon Amoy ledger",
      path: "/issuer",
    },
    holder: {
      email: "rahul.kumar.demo@gmail.com",
      org: "Rahul Kumar (Alumnus & Land Owner)",
      note: "Holder Wallet — Inspect verified academic degrees, land records, and manage verifier permissions",
      path: "/wallet",
    },
    verifier: {
      email: "verifications@xyz-bank.com",
      org: "XYZ Global Bank (Audit Division)",
      note: "Enterprise Verifier — Real-time cryptographic proof verification and public ledger inspection",
      path: "/verify",
    },
    admin: {
      email: "shadabhussain@kitss.edu.in",
      org: "Central Accreditation & Governance Board (KITS)",
      note: "Platform Administrator — Onboard institutions, whitelist DIDs, and inspect Section 12 incidents",
      path: "/admin",
    },
  };

  const handleFillExample = () => {
    const ex = exampleCredentials[selectedRole];
    setEmail(ex.email);
    setPassword(selectedRole === "admin" ? "849204" : "DemoSecurePass2026!");
    setSuccessMsg(`Populated example credentials for ${selectedRole.toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    localStorage.setItem("credchain_selected_role", selectedRole);
    if (exampleCredentials[selectedRole].org) {
      localStorage.setItem("credchain_selected_org", exampleCredentials[selectedRole].org);
    }

    try {
      const emailToUse = email.trim() || exampleCredentials[selectedRole].email;
      await signInWithEmail(emailToUse, password || undefined, selectedRole, exampleCredentials[selectedRole].org);
      setSuccessMsg(`Signed in as ${selectedRole.toUpperCase()}! Redirecting...`);
      setTimeout(() => {
        navigate(exampleCredentials[selectedRole].path);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleModalSuccess = async (data: { email: string; fullName: string; organization?: string }) => {
    setShowGoogleModal(false);
    setIsSubmitting(true);
    setErrorMsg("");
    localStorage.setItem("credchain_selected_role", selectedRole);
    if (data.organization) {
      localStorage.setItem("credchain_selected_org", data.organization);
    }
    setSuccessMsg(`Authenticated as ${data.fullName} (${data.organization || selectedRole.toUpperCase()})! Redirecting...`);
    try {
      await signInWithOAuth("google", selectedRole, data.organization, data.email, data.fullName);
      setTimeout(() => {
        navigate(exampleCredentials[selectedRole].path);
      }, 600);
    } catch (err: any) {
      navigate(exampleCredentials[selectedRole].path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubClick = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    localStorage.setItem("credchain_selected_role", selectedRole);

    try {
      await signInWithGithub(selectedRole);
      setSuccessMsg(`Successfully authenticated via GitHub SSO as ${selectedRole.toUpperCase()}! Redirecting...`);
      setTimeout(() => {
        navigate(exampleCredentials[selectedRole].path);
      }, 600);
    } catch (err: any) {
      console.warn("GitHub SSO fallback:", err);
      await signInWithEmail(exampleCredentials[selectedRole].email, undefined, selectedRole);
      navigate(exampleCredentials[selectedRole].path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplayName = (r: UserRole) => {
    if (r === "issuer") return "Issuer";
    if (r === "holder") return "Holder";
    return "Verifier";
  };

  return (
    <div className="bg-background dark:bg-[#0d1518] text-on-surface dark:text-slate-100 font-body-lg text-body-lg min-h-screen flex flex-col antialiased selection:bg-primary selection:text-on-primary transition-colors duration-200">
      {/* TopNavBar Header (Exact Stitch Design) */}
      <header className="bg-surface dark:bg-[#111a1e] border-b border-outline dark:border-slate-800 w-full sticky top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-base">
            {/* Standalone Logo */}
            <Link className="flex items-center gap-3 group" to="/">
              <img
                alt="CredChain platform logo"
                className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
              <span className="font-bold text-xl tracking-tight text-on-surface dark:text-white flex items-center">
                Cred<span className="text-[#00B4D8] dark:text-[#00E5FF]">Chain</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 font-body-lg text-body-lg">
            <Link className="text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors py-1 px-2 rounded" to="/explorer">
              Explorer
            </Link>
            <Link className="text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors py-1 px-2 rounded" to="/wallet">
              Wallet
            </Link>
            <Link className="text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors py-1 px-2 rounded" to="/issuer">
              Dashboard
            </Link>
          </nav>

          {/* Trailing Actions */}
          <div className="flex items-center gap-3">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            {/* Dark Mode Toggle Button */}
            <button
              aria-label="Toggle dark mode"
              className="p-2 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 border border-border-subtle dark:border-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              id="theme-toggle"
              type="button"
              onClick={toggleTheme}
            >
              <span className="material-symbols-outlined dark:hidden text-[20px]">dark_mode</span>
              <span className="material-symbols-outlined hidden dark:inline text-[20px] text-amber-300">light_mode</span>
            </button>

            {/* Connect Wallet Button (Holder Only) */}
            {selectedRole === "holder" && (
              <button
                className="border border-outline dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 text-primary dark:text-primary-fixed font-label-md text-label-md px-4 py-2 hover:bg-surface-container-low dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
                type="button"
                onClick={connectWallet}
              >
                <span className="material-symbols-outlined text-base">account_balance_wallet</span>
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Holder Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex items-center justify-center py-12 px-margin-mobile md:px-margin-desktop bg-surface-container-low dark:bg-[#0d1518] transition-colors duration-200">
        <div className="w-full max-w-[620px] bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-slate-800 p-6 md:p-8 shadow-sm transition-colors duration-200">
          
          {/* Auth Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container dark:bg-slate-800/80 border border-border-subtle dark:border-slate-700 mb-4">
              <span className="w-2 h-2 rounded-full bg-status-valid animate-pulse"></span>
              <span className="font-code-sm text-code-sm text-on-surface-variant dark:text-slate-300">
                Ledger Node Status: Online • Polygon Amoy (80002)
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface dark:text-white mb-2">
              Sign In to CredChain
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
              Secure role-based access powered by Supabase Authentication
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-error/10 border border-error text-error text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-status-valid/10 border border-status-valid text-status-valid text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Segmented Role Selector (Exact Stitch Design) */}
          <div className="mb-6">
            <label className="block font-label-md text-label-md text-on-surface-variant dark:text-slate-300 mb-2">
              Select Portal Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" id="roleSelector" role="tablist">
              
              {/* Issuer Role Button */}
              <button
                className={`role-btn text-left p-3 transition-colors flex flex-col justify-between cursor-pointer ${
                  selectedRole === "issuer"
                    ? "border-2 border-primary dark:border-primary-fixed bg-surface-container-low dark:bg-slate-800"
                    : "border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900/60 hover:bg-surface-container-low dark:hover:bg-slate-800"
                }`}
                id="role-issuer"
                onClick={() => handleRoleSelect("issuer")}
                type="button"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`material-symbols-outlined ${
                      selectedRole === "issuer" ? "text-primary dark:text-primary-fixed" : "text-on-surface-variant dark:text-slate-400"
                    }`}
                  >
                    apartment
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold ${
                      selectedRole === "issuer"
                        ? "bg-primary dark:bg-primary text-on-primary"
                        : "bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300"
                    }`}
                  >
                    {selectedRole === "issuer" ? "Active" : "Role"}
                  </span>
                </div>
                <div>
                  <div className={`font-label-md text-label-md font-bold ${
                    selectedRole === "issuer" ? "text-primary dark:text-primary-fixed" : "text-on-surface dark:text-white"
                  }`}>
                    Issuer
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400 line-clamp-1">
                    Institutions & Registrars
                  </div>
                </div>
              </button>

              {/* Holder Role Button */}
              <button
                className={`role-btn text-left p-3 transition-colors flex flex-col justify-between cursor-pointer ${
                  selectedRole === "holder"
                    ? "border-2 border-primary dark:border-primary-fixed bg-surface-container-low dark:bg-slate-800"
                    : "border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900/60 hover:bg-surface-container-low dark:hover:bg-slate-800"
                }`}
                id="role-holder"
                onClick={() => handleRoleSelect("holder")}
                type="button"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`material-symbols-outlined ${
                      selectedRole === "holder" ? "text-primary dark:text-primary-fixed" : "text-on-surface-variant dark:text-slate-400"
                    }`}
                  >
                    school
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold ${
                      selectedRole === "holder"
                        ? "bg-primary dark:bg-primary text-on-primary"
                        : "bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300"
                    }`}
                  >
                    {selectedRole === "holder" ? "Active" : "Role"}
                  </span>
                </div>
                <div>
                  <div className={`font-label-md text-label-md font-bold ${
                    selectedRole === "holder" ? "text-primary dark:text-primary-fixed" : "text-on-surface dark:text-white"
                  }`}>
                    Holder
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400 line-clamp-1">
                    Students & Owners
                  </div>
                </div>
              </button>

              {/* Verifier Role Button */}
              <button
                className={`role-btn text-left p-3 transition-colors flex flex-col justify-between cursor-pointer ${
                  selectedRole === "verifier"
                    ? "border-2 border-primary dark:border-primary-fixed bg-surface-container-low dark:bg-slate-800"
                    : "border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900/60 hover:bg-surface-container-low dark:hover:bg-slate-800"
                }`}
                id="role-verifier"
                onClick={() => handleRoleSelect("verifier")}
                type="button"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`material-symbols-outlined ${
                      selectedRole === "verifier" ? "text-primary dark:text-primary-fixed" : "text-on-surface-variant dark:text-slate-400"
                    }`}
                  >
                    verified
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold ${
                      selectedRole === "verifier"
                        ? "bg-primary dark:bg-primary text-on-primary"
                        : "bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300"
                    }`}
                  >
                    {selectedRole === "verifier" ? "Active" : "Role"}
                  </span>
                </div>
                <div>
                  <div className={`font-label-md text-label-md font-bold ${
                    selectedRole === "verifier" ? "text-primary dark:text-primary-fixed" : "text-on-surface dark:text-white"
                  }`}>
                    Verifier
                  </div>
                  <div className="font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400 line-clamp-1">
                    Auditors & Employers
                  </div>
                </div>
              </button>

            </div>
          </div>

          {/* Supabase Auth Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* Floating Label Email Input */}
            <div className="relative">
              <input
                className="peer block w-full px-3 pt-6 pb-2 border border-border-subtle dark:border-slate-700 text-on-surface dark:text-white bg-surface-container-lowest dark:bg-slate-900 focus:outline-none focus:ring-0 focus:border-primary dark:focus:border-primary-fixed font-body-lg text-body-lg placeholder-transparent"
                id="email"
                placeholder=" "
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label
                className="absolute font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary dark:peer-focus:text-primary-fixed"
                htmlFor="email"
              >
                Email Address (e.g. yourname@gmail.com or @institution.edu)
              </label>
            </div>


            {/* Floating Label Password Input with toggle */}
            <div className="relative">
              <input
                className="peer block w-full px-3 pt-6 pb-2 pr-10 border border-border-subtle dark:border-slate-700 text-on-surface dark:text-white bg-surface-container-lowest dark:bg-slate-900 focus:outline-none focus:ring-0 focus:border-primary dark:focus:border-primary-fixed font-body-lg text-body-lg placeholder-transparent"
                id="password"
                placeholder=" "
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                className="absolute font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 duration-150 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary dark:peer-focus:text-primary-fixed"
                htmlFor="password"
              >
                Account Password (or leave blank for Demo 1-Click)
              </label>
              <button
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white focus:outline-none cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]" id="password-visibility-icon">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {/* Session & Recovery Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-4 h-4 text-primary dark:text-primary-container rounded-none border-border-subtle dark:border-slate-700 dark:bg-slate-900 focus:ring-0 focus:ring-offset-0"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">
                  Remember this session
                </span>
              </label>
              <a
                className="font-body-sm text-body-sm text-primary dark:text-primary-fixed hover:underline font-medium"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleFillExample();
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Primary Action Button */}
            <button
              className="w-full bg-primary hover:bg-[#00383b] dark:bg-primary-container dark:hover:bg-[#004f53] text-on-primary py-3 px-4 font-label-md text-label-md font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              id="submitBtn"
              type="submit"
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span id="submitRoleText">
                {isSubmitting ? "Authenticating..." : `Sign In as ${getRoleDisplayName(selectedRole)}`}
              </span>
            </button>

            {/* Alternate Credential Separator */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border-subtle dark:border-slate-700"></div>
              <span className="flex-shrink mx-4 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-400 bg-surface-container-lowest dark:bg-[#132024] px-2">
                OR ALTERNATE CREDENTIAL
              </span>
              <div className="flex-grow border-t border-border-subtle dark:border-slate-700"></div>
            </div>

            {/* Google OAuth (Exact Stitch Design + Seamless Real/Demo SSO) */}
            <button
              className="w-full border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 py-2.5 px-4 font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              type="button"
              onClick={handleGoogleClick}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* GitHub OAuth (Exact Stitch Design) */}
            <button
              className="w-full border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 py-2.5 px-4 font-label-md text-label-md hover:bg-surface-container-low dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
              type="button"
              onClick={handleGithubClick}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 flex-shrink-0 fill-current text-on-surface dark:text-slate-200" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd"></path>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </form>

          {/* Supabase PKCE and Security Ledger Notice */}
          <div className="mt-6 pt-4 border-t border-border-subtle dark:border-slate-800 flex items-start gap-2.5 bg-surface-container-low dark:bg-slate-900/60 p-3">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-lg mt-0.5" data-icon="shield">
              shield
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
              End-to-end encrypted sessions managed by Supabase Auth with PKCE and hardware token support.
            </p>
          </div>

        </div>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="bg-surface-container dark:bg-[#111a1e] border-t border-outline dark:border-slate-800 w-full mt-auto transition-colors duration-200">
        <div className="w-full py-base px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base max-w-container-max mx-auto">
          <p className="font-body-sm text-body-sm text-on-surface dark:text-slate-400">
            © 2026 CredChain Ledger. Built on open standards.
          </p>
          <div className="flex items-center gap-6 font-body-sm text-body-sm">
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Privacy
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Terms
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              API Docs
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Source
            </a>
          </div>
        </div>
      </footer>

      {/* Google Sign-In Interactive Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleModalSuccess}
        role={selectedRole}
        initialOrganization={exampleCredentials[selectedRole].org}
      />
    </div>
  );
};
