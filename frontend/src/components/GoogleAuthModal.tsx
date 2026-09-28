import React, { useState, useEffect } from "react";
import { UserRole } from "../types";
import { supabase, getSupabaseUrl, getSupabaseAnonKey, updateSupabaseCredentials } from "../services/supabase";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (googleData: {
    email: string;
    fullName: string;
    organization?: string;
  }) => void;
  role: UserRole;
  initialOrganization?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  initialOrganization = "",
}) => {
  const currentSupabaseUrl = getSupabaseUrl();
  const isLiveSupabase = Boolean(
    currentSupabaseUrl &&
      !currentSupabaseUrl.includes("placeholder-project") &&
      !currentSupabaseUrl.includes("your-project") &&
      !currentSupabaseUrl.includes("example.com")
  );

  const getRolePreset = (currentRole: UserRole) => {
    switch (currentRole) {
      case "issuer":
        return {
          email: "registrar.google@abc-university.edu",
          fullName: "Dr. Rajesh Sharma (Registrar)",
          organization: initialOrganization || "ABC Institute of Technology",
        };
      case "verifier":
        return {
          email: "verifications.google@xyz-bank.com",
          fullName: "Sarah Jenkins (Senior Verifier)",
          organization: initialOrganization || "XYZ Global Bank",
        };
      case "holder":
      default:
        return {
          email: "rahul.kumar.google@gmail.com",
          fullName: "Rahul Kumar",
          organization: initialOrganization || "Credential Holder",
        };
    }
  };

  const preset = getRolePreset(role);
  const [googleEmail, setGoogleEmail] = useState(preset.email);
  const [fullName, setFullName] = useState(preset.fullName);
  const [organization, setOrganization] = useState(preset.organization);
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(!isLiveSupabase);
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(
    currentSupabaseUrl.includes("your-project") ? "" : currentSupabaseUrl
  );
  const [customAnonKey, setCustomAnonKey] = useState(getSupabaseAnonKey());
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Sync defaults when role or modal opens
  useEffect(() => {
    const currentPreset = getRolePreset(role);
    setGoogleEmail(currentPreset.email);
    setFullName(currentPreset.fullName);
    setOrganization(initialOrganization || currentPreset.organization);
    setError("");
    setIsRedirecting(false);
  }, [role, initialOrganization, isOpen]);

  if (!isOpen) return null;

  const roleLabel =
    role === "issuer"
      ? "Institutional Issuer (University / Agency)"
      : role === "verifier"
      ? "Enterprise Verifier (Employer / Bank / Govt)"
      : "Credential Holder (Student / Property Owner)";

  // Execute 1-Click / Demo Google Authentication
  const executeInstantAuth = (emailToUse: string, nameToUse: string, orgToUse: string) => {
    const cleanEmail = emailToUse.trim();
    const cleanName = nameToUse.trim();
    const cleanOrg = orgToUse.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please provide a valid Google account email address.");
      return;
    }

    if (!cleanName) {
      setError("Please provide your account display name.");
      return;
    }

    if (role === "issuer" && !cleanOrg) {
      setError("Please enter your College, Company, or Organization name.");
      return;
    }

    localStorage.setItem("credchain_selected_role", role);
    if (cleanOrg) {
      localStorage.setItem("credchain_selected_org", cleanOrg);
    }

    onSuccess({
      email: cleanEmail,
      fullName: cleanName,
      organization: cleanOrg,
    });
  };

  // Launch Live Google OAuth via Supabase
  const handleLiveOAuth = async (forceRedirect: boolean = false) => {
    setError("");

    // Check if URL is still placeholder
    const activeUrl = getSupabaseUrl();
    const isPlaceholder =
      !activeUrl ||
      activeUrl.includes("placeholder-project") ||
      activeUrl.includes("your-project") ||
      activeUrl.includes("example.com");

    if (isPlaceholder && !forceRedirect) {
      setShowConfigDrawer(true);
      setError(
        "Live Google OAuth requires a real Supabase Project URL. Enter your Supabase Project URL below, or use 1-Click Instant Login."
      );
      return;
    }

    setIsRedirecting(true);
    try {
      localStorage.setItem("credchain_selected_role", role);
      const targetOrg = (organization || initialOrganization || "").trim();
      if (targetOrg) {
        localStorage.setItem("credchain_selected_org", targetOrg);
      }

      const redirectUrl =
        role === "issuer"
          ? `${window.location.origin}/issuer`
          : role === "verifier"
          ? `${window.location.origin}/verify`
          : `${window.location.origin}/wallet`;

      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthErr) throw oauthErr;
    } catch (err: any) {
      console.warn("Live Google OAuth error:", err);
      setIsRedirecting(false);
      setError(
        err.message ||
          "Could not reach Supabase Google OAuth endpoint. Check your Supabase URL or use 1-Click Login below."
      );
    }
  };

  // Save custom Supabase credentials from UI
  const handleSaveCredentialsAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSupabaseUrl || !customSupabaseUrl.startsWith("http")) {
      setError("Please enter a valid Supabase URL starting with https://");
      return;
    }
    updateSupabaseCredentials(customSupabaseUrl, customAnonKey);
    setError("");
    await handleLiveOAuth(true);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1a2224] text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 text-center shrink-0">
          <div className="flex justify-center mb-2">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sign in with Google</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Continue to <span className="font-semibold text-teal-700 dark:text-teal-400">CredChain</span> as{" "}
            <span className="font-semibold uppercase tracking-wider text-xs text-primary dark:text-primary-fixed">
              {role}
            </span>
          </p>
          <div className="mt-1.5 text-[11px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#131b1d] py-0.5 px-3 rounded-full inline-block">
            {roleLabel}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Error Banner */}
          {error && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* OPTION 1: LIVE GOOGLE OAUTH 2.0 */}
          {/* ============================================================ */}
          <div className="border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lock</span>
                Option 1: Google OAuth 2.0 (Live Redirect)
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isLiveSupabase
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                }`}
              >
                {isLiveSupabase ? "Supabase URL Connected" : "Supabase Config Needed"}
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
              Redirects your browser to Google Cloud Accounts to select your real Google profile.
            </p>

            <button
              type="button"
              onClick={() => handleLiveOAuth(false)}
              disabled={isRedirecting}
              className="w-full bg-white dark:bg-[#12191b] hover:bg-gray-100 dark:hover:bg-[#192427] text-gray-800 dark:text-gray-100 font-semibold text-xs py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2.5 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-70"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>{isRedirecting ? "Connecting to Google Cloud..." : "Launch Google OAuth Pop-up / Redirect"}</span>
            </button>

            {/* Collapsible Supabase live configuration if URL is placeholder */}
            {showConfigDrawer && (
              <form
                onSubmit={handleSaveCredentialsAndLaunch}
                className="mt-3 pt-3 border-t border-blue-200/70 dark:border-blue-900/50 space-y-2.5 animate-fadeIn"
              >
                <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 leading-relaxed">
                  ⚠️ Google OAuth needs your live Supabase project to handle Google's redirect. Paste your Supabase URL &amp; Anon Key below:
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={customSupabaseUrl}
                    onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                    placeholder="https://xyzprojectid.supabase.co"
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Supabase Anon Key (optional)
                  </label>
                  <input
                    type="text"
                    value={customAnonKey}
                    onChange={(e) => setCustomAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save &amp; Connect Google OAuth
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLiveOAuth(true)}
                    className="py-1.5 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-lg transition-colors cursor-pointer"
                    title="Attempt redirect anyway with current URL"
                  >
                    Redirect Anyway
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Divider */}
          <div className="relative text-center my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white dark:bg-[#1a2224] px-3 text-gray-500 uppercase font-bold tracking-wider">
                OR Instant Demo Authentication
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* OPTION 2: 1-CLICK INSTANT DEMO LOGIN */}
          {/* ============================================================ */}
          <div className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl p-4 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">flash_on</span>
                Option 2: 1-Click Instant Login (Demo Mode)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
                Zero Configuration
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-[#12191b] p-3 rounded-lg border border-gray-200/80 dark:border-gray-700/80 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                {fullName.charAt(0) || "G"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {fullName}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {googleEmail}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => executeInstantAuth(googleEmail, fullName, organization)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>1-Click Continue as {fullName.split(" ")[0]}</span>
            </button>

            {/* Toggle Custom Account Details */}
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setShowCustomInputs(!showCustomInputs)}
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {showCustomInputs ? "Hide Custom Details" : "Customize Google Email or Display Name"}
              </button>
            </div>

            {/* Custom Account Inputs */}
            {showCustomInputs && (
              <div className="mt-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-900/40 space-y-2.5 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Google Email Address
                  </label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Full Name (Google Account Display Name)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Organization / Entity {role === "issuer" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. ABC Institute of Technology"
                    className="w-full text-xs px-3 py-1.5 bg-white dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => executeInstantAuth(googleEmail, fullName, organization)}
                  className="w-full py-1.5 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Apply &amp; Sign in as {googleEmail || "Google User"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-[#141b1d] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Cancel
          </button>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            CredChain Decentralized Identity
          </span>
        </div>
      </div>
    </div>
  );
};

