import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";
import { UserRole } from "../types";
import { CredChainLogo } from "./CredChainLogo";

export const Navbar: React.FC = () => {
  const { user, role, switchDemoRole, signOut } = useAuth();
  const { account, connectWallet, isCorrectNetwork } = useWeb3();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-border-subtle bg-surface sticky top-0 z-50">
      {/* Top Demo Judge Quick Switcher Banner */}
      <div className="bg-primary text-on-primary text-xs py-1.5 px-4 flex flex-wrap items-center justify-between gap-2 border-b border-primary-container">
        <div className="flex items-center gap-2">
          <span className="font-semibold uppercase tracking-wider text-[11px] bg-white/20 px-2 py-0.5">
            SIH 2026 LIVE DEMO
          </span>
          <span className="hidden sm:inline text-white/80">
            Network: <strong>Polygon Amoy (Chain ID 80002)</strong> | Document Proof: <strong>IPFS + SHA-256</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-[11px]">Role Switcher:</span>
          {(["issuer", "holder", "verifier"] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchDemoRole(r)}
              className={`px-2 py-0.5 text-[11px] font-semibold uppercase transition-all ${
                role === r
                  ? "bg-white text-primary font-bold shadow-sm"
                  : "bg-black/20 text-white/90 hover:bg-black/40"
              }`}
            >
              {r === "issuer"
                ? "🏛️ Issuer"
                : r === "holder"
                ? "👤 Holder"
                : "🔍 Verifier"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center group transition-transform hover:opacity-95">
          <CredChainLogo size="md" />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm">
          <Link
            to="/"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Home
          </Link>

          {role === "issuer" && (
            <>
              <Link
                to="/issuer"
                className={`px-3 py-2 border-b-2 transition-colors ${
                  isActive("/issuer")
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Issuer Dashboard
              </Link>
              <Link
                to="/issue"
                className={`px-3 py-2 border-b-2 transition-colors ${
                  isActive("/issue")
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Issue Credential
              </Link>
            </>
          )}

          {role === "holder" && (
            <>
              <Link
                to="/wallet"
                className={`px-3 py-2 border-b-2 transition-colors ${
                  isActive("/wallet")
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                My Wallet
              </Link>
              <Link
                to="/access-requests"
                className={`px-3 py-2 border-b-2 transition-colors ${
                  isActive("/access-requests")
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Access Control
              </Link>
            </>
          )}

          <Link
            to="/governance"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/governance")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Governance Portal
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/admin")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Admin Portal
          </Link>

          <Link
            to="/verify"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/verify")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Verify Credential
          </Link>

          <Link
            to="/explorer"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/explorer")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Ledger Explorer
          </Link>

          <Link
            to="/audit"
            className={`px-3 py-2 border-b-2 transition-colors ${
              isActive("/audit")
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Audit Log
          </Link>
        </nav>

        {/* Right Actions: Web3 Wallet & Auth Profile */}
        <div className="flex items-center gap-3">
          {/* Web3 Wallet Button — Holder Only */}
          {(user?.role === "holder" || window.location.pathname.startsWith("/wallet")) && (
            <button
              onClick={connectWallet}
              className={`px-3 py-1.5 text-xs font-mono font-medium border flex items-center gap-1.5 transition-all ${
                account
                  ? isCorrectNetwork
                    ? "bg-surface-container-low border-border-subtle text-on-surface"
                    : "bg-error/10 border-error text-error"
                  : "bg-primary text-white border-primary hover:bg-primary-container"
              }`}
              title={account || "Connect MetaMask"}
            >
              <span
                className={`w-2 h-2 ${
                  account
                    ? isCorrectNetwork
                      ? "bg-status-valid"
                      : "bg-error"
                    : "bg-amber-400"
                }`}
              />
              {account
                ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
                : "Connect Wallet"}
            </button>
          )}

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <div className="text-xs font-semibold text-on-surface leading-tight">
                  {user.full_name}
                </div>
                <div className="text-[10px] text-on-surface-variant font-mono uppercase">
                  {user.role}
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-2.5 py-1.5 text-xs border border-border-subtle hover:bg-surface-container text-on-surface transition-colors"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-container transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
