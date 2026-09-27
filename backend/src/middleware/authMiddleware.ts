import { Request, Response, NextFunction } from "express";
import { SupabaseService } from "../services/supabaseService";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "issuer" | "holder" | "verifier" | "admin";
  full_name: string;
  wallet_address?: string;
  organization?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // 1. Check for Demo user simulation header (for easy demo testing without logging in via full Supabase Auth)
  const demoRole = req.headers["x-demo-role"] as string;
  const demoUserId = req.headers["x-demo-user-id"] as string;

  if (demoRole || demoUserId) {
    const id = demoUserId || (demoRole === "admin"
      ? "00000000-0000-0000-0000-000000000000"
      : demoRole === "issuer"
      ? "11111111-1111-1111-1111-111111111111"
      : demoRole === "verifier"
      ? "33333333-3333-3333-3333-333333333333"
      : "22222222-2222-2222-2222-222222222222");

    const profile = await SupabaseService.getProfile(id);
    req.user = {
      id,
      email: profile?.email || (demoRole === "admin" ? "shadabhussain@kitss.edu.in" : `${demoRole || "user"}@credchain.io`),
      role: (demoRole || profile?.role || "holder") as any,
      full_name: profile?.full_name || (demoRole === "admin" ? "Shadab Hussain" : "CredChain User"),
      wallet_address: profile?.wallet_address,
      organization: profile?.organization || (demoRole === "admin" ? "Central Accreditation & Governance Board (KITS)" : undefined),
    };
    return next();
  }

  // 2. Real Supabase JWT validation
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication token required.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const client = SupabaseService.getAdminClient() || SupabaseService.getClient();
    if (client) {
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({
          error: "Unauthorized",
          message: "Invalid or expired session token.",
        });
        return;
      }

      const profile = await SupabaseService.getProfile(user.id);
      const requestedRole = (req.headers["x-demo-role"] || req.headers["x-role"]) as string;
      const validRoles = ["issuer", "holder", "verifier", "admin"];
      const effectiveRole = (
        validRoles.includes(requestedRole)
          ? requestedRole
          : profile?.role || user.user_metadata?.role || "holder"
      ) as any;

      req.user = {
        id: user.id,
        email: user.email || "",
        role: effectiveRole,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        wallet_address: profile?.wallet_address,
        organization: profile?.organization,
      };

      return next();
    }

    // Default fallback
    req.user = {
      id: "22222222-2222-2222-2222-222222222222",
      email: "rahul.kumar.demo@gmail.com",
      role: "holder",
      full_name: "Rahul Kumar",
    };
    return next();
  } catch (err: any) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authentication verification failed.",
    });
  }
};
