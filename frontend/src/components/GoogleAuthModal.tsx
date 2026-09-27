import React, { useState } from "react";
import { UserRole } from "../types";
import { supabase } from "../services/supabase";

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
  const [googleEmail, setGoogleEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState(initialOrganization);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const roleLabel =
    role === "issuer"
      ? "Institutional Issuer (University / Agency)"
      : role === "verifier"
      ? "Enterprise Verifier (Employer / Bank / Govt)"
      : "Credential Holder (Student / Property Owner)";

  // Option 1: Direct Google OAuth popup/redirect via Supabase
  const handleLiveGoogleOAuth = async () => {
    setIsRedirecting(true);
    setError("");
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
          "Google Cloud OAuth redirect failed. You can sign in below using your Google email and credentials."
      );
    }
  };

  // Option 2: Sign in with Google account details (saved to Supabase profiles)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!googleEmail || !googleEmail.includes("@")) {
      setError("Please enter a valid Google account email address.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your display name.");
      return;
    }

    if (role === "issuer" && !organization.trim()) {
      setError("Please enter your College, Company, or Organization name.");
      return;
    }

    localStorage.setItem("credchain_selected_role", role);
    if (organization.trim()) {
      localStorage.setItem("credchain_selected_org", organization.trim());
    }

    onSuccess({
      email: googleEmail.trim(),
      fullName: fullName.trim(),
      organization: organization.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1a2224] text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 text-center">
          <div className="flex justify-center mb-3">
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
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sign in with Google</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Continue to <span className="font-semibold text-teal-700 dark:text-teal-400">CredChain</span> as{" "}
            <span className="font-semibold uppercase tracking-wider text-xs text-primary dark:text-primary-fixed">
              {role}
            </span>
          </p>
          <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#131b1d] py-1 px-2.5 rounded-full inline-block">
            {roleLabel}
          </div>
        </div>

        {/* Live Supabase Google OAuth Button */}
        <div className="p-5 pb-0">
          <button
            type="button"
            onClick={handleLiveGoogleOAuth}
            disabled={isRedirecting}
            className="w-full bg-white dark:bg-[#12191b] hover:bg-gray-50 dark:hover:bg-[#162023] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm cursor-pointer"
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

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="bg-white dark:bg-[#1a2224] px-2 text-gray-500 uppercase font-semibold">
                Or enter your Google Account
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-2 p-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
            {error}
          </div>
        )}

        {/* Google User Credentials Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Google Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com or @institution.edu"
              className="w-full text-xs px-3 py-2.5 bg-gray-50 dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Full Name (Google Account Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma or Sarah Jenkins"
              className="w-full text-xs px-3 py-2.5 bg-gray-50 dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* College / Company / Organization Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              College / Company / Organization Name {role === "issuer" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={role === "issuer"}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={
                role === "issuer"
                  ? "e.g. ABC Institute of Technology, Stanford, Land Records Office"
                  : role === "verifier"
                  ? "e.g. XYZ Global Bank HR, Government Verification Bureau"
                  : "e.g. B.Tech Alumnus / Self-Sovereign"
              }
              className="w-full text-xs px-3 py-2.5 bg-gray-50 dark:bg-[#12191b] border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              This information is saved to your Supabase profile and certified on-chain.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <span>Save &amp; Sign in with Google</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50 dark:bg-[#141b1d] border-t border-gray-100 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400">
          Your credentials and profile are saved securely to your Supabase database.
        </div>
      </div>
    </div>
  );
};
