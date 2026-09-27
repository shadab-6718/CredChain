import { Request, Response } from "express";
import { SupabaseService } from "../services/supabaseService";

export class AuthController {
  public static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const profile = await SupabaseService.getProfile(req.user.id);
      res.json({
        profile: profile || req.user,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  }

  public static async listVerifiers(req: Request, res: Response): Promise<void> {
    try {
      const verifiers = await SupabaseService.getAllVerifiers();
      res.json({ verifiers });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch verifiers", message: error.message });
    }
  }

  public static async saveGoogleUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName, role, organization, walletAddress } = req.body;
      if (!email || !fullName || !role) {
        res.status(400).json({ error: "Missing required fields (email, fullName, role)" });
        return;
      }
      const profile = await SupabaseService.saveGoogleUser({
        email,
        fullName,
        role,
        organization,
        walletAddress,
      });
      res.json({ success: true, profile });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to save Google profile", message: error.message });
    }
  }

  public static async updateRole(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { role, organization, fullName } = req.body;
      if (!role || !["issuer", "holder", "verifier"].includes(role)) {
        res.status(400).json({ error: "Invalid role specified. Must be 'issuer', 'holder', or 'verifier'." });
        return;
      }

      const updated = await SupabaseService.updateProfileRole(
        req.user.id,
        role,
        organization,
        fullName
      );

      req.user.role = role;
      if (organization) req.user.organization = organization;
      if (fullName) req.user.full_name = fullName;

      res.json({ success: true, profile: updated });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to update role", message: error.message });
    }
  }
}

