import React from "react";
import { Link } from "react-router-dom";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border-subtle bg-surface-container-low text-on-surface py-10 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary text-white flex items-center justify-center font-bold text-sm">
                C
              </div>
              <span className="font-bold tracking-tight text-base">CredChain</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Decentralized proof registry for credentials and land records. Anchored to Polygon Amoy testnet with IPFS off-chain storage.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Platform Utilities
            </div>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              <li>
                <Link to="/verify" className="hover:text-primary transition-colors">
                  Instant Verification
                </Link>
              </li>
              <li>
                <Link to="/explorer" className="hover:text-primary transition-colors">
                  Blockchain Ledger Explorer
                </Link>
              </li>
              <li>
                <Link to="/audit" className="hover:text-primary transition-colors">
                  Audit History Timeline
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Smart Contract (Amoy)
            </div>
            <ul className="space-y-2 text-xs text-on-surface-variant font-mono">
              <li>Chain ID: 80002</li>
              <li>Network: Polygon Amoy</li>
              <li>Hash: SHA-256 (32-byte)</li>
              <li>Proof Layer: Event Log Anchors</li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Privacy & Security
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              No private identity details or raw certificate PDFs are exposed on the public blockchain. Only cryptographic proofs and timestamps are stored on-chain.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div>© 2026 CredChain • Smart India Hackathon Prototype</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-status-valid rounded-full animate-pulse"></span>
              Polygon Amoy Node: Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
