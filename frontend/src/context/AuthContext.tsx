import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { UserProfile, UserRole } from "../types";
import { setAuthToken, apiService } from "../services/api";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signInWithEmail: (email: string, password?: string, role?: UserRole, organization?: string) => Promise<void>;
  signInWithGoogle: (role?: UserRole, organization?: string, customEmail?: string, customName?: string) => Promise<void>;
  signInWithGithub: (role?: UserRole) => Promise<void>;
  signUpWithEmail: (email: string, password?: string, fullName?: string, role?: UserRole, organization?: string) => Promise<void>;
  signIn: (email: string, password?: string, role?: UserRole, organization?: string) => Promise<void>;
  signUp: (email: string, password?: string, metadata?: any) => Promise<void>;
  signInWithOAuth: (provider: "google" | "github", role?: UserRole, organization?: string, customEmail?: string, customName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  issuer: {
    id: "11111111-1111-1111-1111-111111111111",
    full_name: "ABC Institute of Technology",
    email: "registrar@abc-university.edu",
    role: "issuer",
    wallet_address: "0x71C80F25A0B2C79b8aE133F2e41a94371fa7D619",
    organization: "ABC University (Authorized Issuer)",
  },
  holder: {
    id: "22222222-2222-2222-2222-222222222222",
    full_name: "Rahul Kumar",
    email: "rahul.kumar.demo@gmail.com",
    role: "holder",
    wallet_address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4df",
    organization: "B.Tech Computer Science Alumnus",
  },
  verifier: {
    id: "33333333-3333-3333-3333-333333333333",
    full_name: "XYZ Global Bank HR & Verifications",
    email: "verifications@xyz-bank.com",
    role: "verifier",
    wallet_address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    organization: "XYZ Bank (Enterprise Verifier)",
  },
  admin: {
    id: "00000000-0000-0000-0000-000000000000",
    full_name: "Shadab Hussain",
    email: "shadabhussain@kitss.edu.in",
    role: "admin",
    wallet_address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    organization: "Central Accreditation & Governance Board (KITS)",
  },
};

export const ADMIN_CREDENTIALS = {
  email: "shadabhussain@kitss.edu.in",
  password: "849204",
};

export const isAdminEmail = (email?: string | null): boolean => {
  return !!email && email.trim().toLowerCase() === "shadabhussain@kitss.edu.in";
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("credchain_user") || localStorage.getItem("credchain_demo_user");
    if (!saved) return null;
    try {
      const parsed: UserProfile = JSON.parse(saved);
      if (parsed && isAdminEmail(parsed.email)) {
        parsed.role = "admin";
        parsed.organization = parsed.organization || "Central Accreditation & Governance Board (KITS)";
        localStorage.setItem("credchain_user", JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedRole = (localStorage.getItem("credchain_selected_role") as UserRole) || null;
        const savedOrg = localStorage.getItem("credchain_selected_org") || undefined;

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsDemoMode(false);
          const email = session.user.email || "";
          const activeRole: UserRole = isAdminEmail(email)
            ? "admin"
            : (savedRole || (session.user.user_metadata?.role as UserRole) || "holder");
          setAuthToken(session.access_token, activeRole, session.user.id);

          const fallbackProfile: UserProfile = {
            id: session.user.id,
            email,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            role: activeRole,
            organization: savedOrg || session.user.user_metadata?.organization || "",
          };

          let currentProfile: UserProfile = fallbackProfile;
          try {
            if (savedRole && !isAdminEmail(email)) {
              const updateRes = await apiService.updateProfileRole(savedRole, savedOrg);
              if (updateRes?.profile) currentProfile = updateRes.profile;
            } else {
              const res = await apiService.getProfile();
              if (res?.profile) currentProfile = res.profile;
            }
          } catch {
            currentProfile = fallbackProfile;
          }

          if (!currentProfile || !currentProfile.id) {
            currentProfile = fallbackProfile;
          }

          if (isAdminEmail(currentProfile.email)) {
            currentProfile.role = "admin";
            currentProfile.organization = currentProfile.organization || "Central Accreditation & Governance Board (KITS)";
          }

          setUser(currentProfile);
          localStorage.setItem("credchain_user", JSON.stringify(currentProfile));
        } else if (user) {
          const activeRole: UserRole = isAdminEmail(user.email)
            ? "admin"
            : (savedRole || user.role || "holder");
          const updated = {
            ...user,
            role: activeRole,
            organization: isAdminEmail(user.email)
              ? (user.organization || "Central Accreditation & Governance Board (KITS)")
              : user.organization,
          };
          setUser(updated);
          localStorage.setItem("credchain_user", JSON.stringify(updated));
          setAuthToken(undefined, activeRole, user.id);
        }
      } catch (err) {
        console.warn("Supabase Auth session check:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsDemoMode(false);
        const savedRole = (localStorage.getItem("credchain_selected_role") as UserRole) || null;
        const savedOrg = localStorage.getItem("credchain_selected_org") || undefined;
        const email = session.user.email || "";
        const activeRole: UserRole = isAdminEmail(email)
          ? "admin"
          : (savedRole || (session.user.user_metadata?.role as UserRole) || "holder");

        setAuthToken(session.access_token, activeRole, session.user.id);
        const fallbackProfile: UserProfile = {
          id: session.user.id,
          email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          role: activeRole,
          organization: savedOrg || session.user.user_metadata?.organization || "",
        };

        let profileToSet: UserProfile = fallbackProfile;
        try {
          if (savedRole && !isAdminEmail(email)) {
            const updateRes = await apiService.updateProfileRole(savedRole, savedOrg);
            if (updateRes?.profile) profileToSet = updateRes.profile;
          } else {
            const res = await apiService.getProfile();
            if (res?.profile) profileToSet = res.profile;
          }
        } catch {
          profileToSet = fallbackProfile;
        }

        if (!profileToSet || !profileToSet.id) profileToSet = fallbackProfile;
        if (isAdminEmail(profileToSet.email)) profileToSet.role = "admin";
        setUser(profileToSet);
        localStorage.setItem("credchain_user", JSON.stringify(profileToSet));
      } else {
        if (!isDemoMode && !localStorage.getItem("credchain_user")) {
          setUser(null);
          setAuthToken(undefined);
        }
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const switchDemoRole = async (role: UserRole) => {
    setIsDemoMode(true);
    localStorage.setItem("credchain_selected_role", role);
    const baseProfile = DEMO_PROFILES[role];
    const newProfile: UserProfile = user
      ? {
          ...user,
          id: baseProfile.id,
          role,
          email: baseProfile.email,
          full_name: baseProfile.full_name,
          organization: baseProfile.organization,
          wallet_address: baseProfile.wallet_address || user.wallet_address,
        }
      : baseProfile;

    setUser(newProfile);
    localStorage.setItem("credchain_user", JSON.stringify(newProfile));
    localStorage.setItem("credchain_demo_user", JSON.stringify(newProfile));
    setAuthToken(undefined, role, newProfile.id);

    try {
      await apiService.updateProfileRole(role, newProfile.organization);
    } catch {}
  };

  const signInWithEmail = async (
    email: string,
    password?: string,
    role: UserRole = "holder",
    organization?: string
  ) => {
    setLoading(true);
    try {
      localStorage.setItem("credchain_selected_role", role);
      if (organization) localStorage.setItem("credchain_selected_org", organization);

      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
          setIsDemoMode(false);
          setAuthToken(data.session.access_token, role, data.session.user.id);
          try {
            const updateRes = await apiService.updateProfileRole(role, organization);
            if (updateRes?.profile) {
              setUser(updateRes.profile);
              localStorage.setItem("credchain_user", JSON.stringify(updateRes.profile));
              return;
            }
          } catch (syncErr) {
            console.warn("Backend updateProfileRole sync warning:", syncErr);
          }

          const { profile } = await apiService.getProfile().catch(() => ({
            profile: {
              id: data.session.user.id,
              email,
              full_name: organization || email.split("@")[0],
              role,
              organization: organization || "",
            },
          }));
          const finalProfile = { ...profile, role, ...(organization ? { organization } : {}) };
          setUser(finalProfile);
          localStorage.setItem("credchain_user", JSON.stringify(finalProfile));
          return;
        }

        // Seamless fallback for demo fixtures or unconfirmed accounts
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: organization || email.split("@")[0],
              role,
              organization: organization || "",
            },
          },
        });

        if (!signUpErr && signUpData.session) {
          setIsDemoMode(false);
          setAuthToken(signUpData.session.access_token, role, signUpData.session.user.id);
          try {
            await apiService.updateProfileRole(role, organization);
          } catch {}
          const userProfile: UserProfile = {
            id: signUpData.session.user.id,
            email,
            full_name: organization || email.split("@")[0],
            role,
            organization: organization || DEMO_PROFILES[role]?.organization || "",
            wallet_address: DEMO_PROFILES[role]?.wallet_address,
          };
          setUser(userProfile);
          localStorage.setItem("credchain_user", JSON.stringify(userProfile));
          return;
        }
      }

      // Demo simulated login
      const demoProfile: UserProfile = {
        id: `demo_${Date.now()}`,
        email,
        full_name: email.split("@")[0].toUpperCase(),
        role,
        organization: organization || DEMO_PROFILES[role]?.organization || `${role.toUpperCase()} Organization`,
        wallet_address: DEMO_PROFILES[role]?.wallet_address,
      };
      setUser(demoProfile);
      localStorage.setItem("credchain_user", JSON.stringify(demoProfile));
      localStorage.setItem("credchain_demo_user", JSON.stringify(demoProfile));
      setAuthToken(undefined, role, demoProfile.id);

      // Save to Supabase
      try {
        await supabase.from("profiles").upsert(
          {
            id: demoProfile.id,
            email: demoProfile.email,
            full_name: demoProfile.full_name,
            role: demoProfile.role,
            organization: demoProfile.organization,
            wallet_address: demoProfile.wallet_address,
          },
          { onConflict: "id" }
        );
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (
    role: UserRole = "holder",
    organization?: string,
    customEmail?: string,
    customName?: string
  ) => {
    localStorage.setItem("credchain_selected_role", role);
    if (organization) localStorage.setItem("credchain_selected_org", organization);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const isLiveSupabase =
      supabaseUrl && !supabaseUrl.includes("placeholder-project") && !supabaseUrl.includes("your-project");

    if (isLiveSupabase && !customEmail) {
      const redirectUrl =
        role === "issuer"
          ? `${window.location.origin}/issuer`
          : role === "verifier"
          ? `${window.location.origin}/verify`
          : `${window.location.origin}/wallet`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
      return;
    }

    const resolvedEmail =
      customEmail ||
      (role === "issuer"
        ? "registrar.google@abc-university.edu"
        : role === "holder"
        ? "rahul.kumar.google@gmail.com"
        : "verifications.google@xyz-bank.com");

    const resolvedName =
      customName ||
      (role === "issuer"
        ? (organization ? `${organization} Registrar` : "ABC University Registrar")
        : role === "holder"
        ? "Rahul Kumar"
        : "XYZ Bank Verifications");

    const resolvedOrg =
      organization ||
      (role === "issuer"
        ? "ABC Institute of Technology"
        : role === "verifier"
        ? "XYZ Global Bank"
        : "Credential Holder");

    const walletAddress =
      role === "issuer"
        ? DEMO_PROFILES.issuer.wallet_address
        : role === "holder"
        ? DEMO_PROFILES.holder.wallet_address
        : DEMO_PROFILES.verifier.wallet_address;

    const effectiveRole: UserRole = isAdminEmail(resolvedEmail) ? "admin" : role;
    const effectiveOrg = isAdminEmail(resolvedEmail)
      ? (organization || "Central Accreditation & Governance Board (KITS)")
      : resolvedOrg;

    let savedProfile: UserProfile;

    try {
      // Persist directly to Supabase via backend Admin Service
      const res = await apiService.saveGoogleUser({
        email: resolvedEmail,
        fullName: resolvedName,
        role: effectiveRole,
        organization: effectiveOrg,
        walletAddress,
      });
      savedProfile = res.profile;
      if (isAdminEmail(savedProfile.email)) savedProfile.role = "admin";
    } catch (err) {
      console.warn("Backend Google sync fallback:", err);
      savedProfile = {
        id: customEmail ? `google_${Date.now()}` : `google_${effectiveRole}`,
        email: resolvedEmail,
        full_name: resolvedName,
        role: effectiveRole,
        organization: effectiveOrg,
        wallet_address: walletAddress,
      };
    }

    setUser(savedProfile);
    setIsDemoMode(false);
    localStorage.setItem("credchain_user", JSON.stringify(savedProfile));
    setAuthToken(undefined, effectiveRole, savedProfile.id);
  };


  const signInWithGithub = async (role: UserRole = "holder") => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const isLiveSupabase = supabaseUrl && !supabaseUrl.includes("placeholder-project") && !supabaseUrl.includes("your-project");

    if (isLiveSupabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      return;
    }

    // Seamless GitHub OAuth demo simulation:
    const githubProfile: UserProfile = {
      id: role === "issuer" ? DEMO_PROFILES.issuer.id : role === "holder" ? DEMO_PROFILES.holder.id : DEMO_PROFILES.verifier.id,
      email: role === "issuer" ? "registrar.github@abc-university.edu" : role === "holder" ? "rahul.kumar.github@gmail.com" : "verifications.github@xyz-bank.com",
      full_name: role === "issuer" ? "ABC University Registrar (GitHub SSO)" : role === "holder" ? "Rahul Kumar (GitHub SSO)" : "XYZ Bank Verifier (GitHub SSO)",
      role,
      organization: DEMO_PROFILES[role].organization,
    };
    setUser(githubProfile);
    setIsDemoMode(true);
    localStorage.setItem("credchain_demo_user", JSON.stringify(githubProfile));
    setAuthToken(undefined, role, githubProfile.id);
  };

  const signUpWithEmail = async (
    email: string,
    password?: string,
    fullName?: string,
    role: UserRole = "holder",
    organization?: string
  ) => {
    setLoading(true);
    try {
      if (password) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split("@")[0],
              role,
              organization: organization || "",
            },
          },
        });
        if (error) throw error;
      } else {
        await signInWithEmail(email, undefined, role, organization);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    localStorage.removeItem("credchain_user");
    localStorage.removeItem("credchain_demo_user");
    localStorage.removeItem("credchain_selected_role");
    localStorage.removeItem("credchain_selected_org");
    setUser(null);
    setAuthToken(undefined);
  };

  const signIn = async (
    email: string,
    password?: string,
    role: UserRole = "holder",
    organization?: string
  ) => {
    return signInWithEmail(email, password, role, organization);
  };

  const signUp = async (email: string, password?: string, metadata?: any) => {
    const role: UserRole = metadata?.role || "holder";
    const fullName: string = metadata?.full_name || metadata?.organization || email.split("@")[0];
    const org: string = metadata?.organization || "";
    return signUpWithEmail(email, password, fullName, role, org);
  };

  const signInWithOAuth = async (
    provider: "google" | "github",
    role: UserRole = "holder",
    organization?: string,
    customEmail?: string,
    customName?: string
  ) => {
    if (provider === "google") {
      return signInWithGoogle(role, organization, customEmail, customName);
    }
    return signInWithGithub(role);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("credchain_demo_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "holder",
        loading,
        signInWithEmail,
        signInWithGoogle,
        signInWithGithub,
        signUpWithEmail,
        signIn,
        signUp,
        signInWithOAuth,
        signOut,
        switchDemoRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
