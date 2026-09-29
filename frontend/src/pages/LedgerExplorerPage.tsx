import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/api";
import { Credential } from "../types";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

export const LedgerExplorerPage: React.FC = () => {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { contractAddress, connectWallet, account } = useWeb3();

  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

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

  useEffect(() => {
    apiService
      .listCredentials()
      .then((res) => setCredentials(Array.isArray(res?.credentials) ? res.credentials : []))
      .catch((err) => {
        console.error("Explorer load error:", err);
        setCredentials([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const safeCredentials = Array.isArray(credentials) ? credentials : [];
  const filtered = safeCredentials.filter(
    (c) =>
      !c ? false :
      (c.credential_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.document_hash || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.blockchain_tx_hash && c.blockchain_tx_hash.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-[#fcf9f8] dark:bg-[#0b1315] text-[#191c1d] dark:text-[#e0e3e3] font-body-lg antialiased flex flex-col min-h-screen transition-colors duration-200">
      {/* TopNavBar (Exact Stitch Design) */}
      <header className="bg-white/90 dark:bg-[#101b1e]/90 backdrop-blur border-b border-gray-200 dark:border-[#1e2f34] w-full px-4 sm:px-margin-desktop h-16 sticky top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center max-w-container-max mx-auto h-full gap-4">
          <div className="flex items-center gap-3" style={{ height: "56px" }}>
            <Link to="/">
              <img
                alt="CredChain"
                className="h-10 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
          </div>

          <nav className="hidden md:flex gap-8 items-center h-full">
            <Link
              className="font-body-lg text-body-lg font-semibold text-primary dark:text-[#4dd0e1] border-b-2 border-primary dark:border-[#4dd0e1] h-full flex items-center pt-[2px] transition-colors"
              to="/explorer"
            >
              Explorer
            </Link>
            <Link
              className="font-body-lg text-body-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors h-full flex items-center"
              to="/wallet"
            >
              Wallet
            </Link>
            <Link
              className="font-body-lg text-body-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors h-full flex items-center"
              to="/issuer"
            >
              Dashboard
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              aria-label="Toggle theme"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#16272c] border border-transparent hover:border-gray-200 rounded transition-all duration-200 cursor-pointer"
              id="theme-toggle"
              onClick={toggleTheme}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {user?.role === "holder" && (
              <button
                className="bg-primary dark:bg-[#006064] text-white font-label-md text-label-md px-3.5 sm:px-gutter py-2 border border-primary dark:border-[#00838f] hover:bg-opacity-90 transition-all shadow-xs whitespace-nowrap cursor-pointer"
                onClick={connectWallet}
                type="button"
              >
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-4 sm:px-margin-desktop py-6 md:py-10">
        <div className="mb-6 md:mb-margin-desktop flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> Polygon Amoy Node Syncing
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">Chain ID: 80002 • Block #4,891,024</span>
            </div>
            <div className="flex items-center flex-wrap gap-3 mb-base">
              <h1 className="font-headline-lg text-headline-lg font-bold text-gray-900 dark:text-white">
                Ledger Explorer
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:text-[#4dd0e1] border border-primary/30">
                <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-[#4dd0e1]"></span>Zone 1 &amp; Zone 2 Separation
              </span>
            </div>
            <p className="font-body-lg text-body-lg text-gray-500 dark:text-gray-400 max-w-3xl">
              A live, read-only log of immutable on-chain events across the CredChain network.
            </p>
          </div>

          {/* Zone 1: Operational Ledger Query */}
          <div className="w-full bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] p-4 rounded shadow-sm transition-colors" id="search-filter-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-gray-100 dark:border-[#1c2d32]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-[#4dd0e1] text-[20px]">tune</span>
                <span className="font-headline-md text-sm font-semibold text-gray-900 dark:text-white">
                  Operational Ledger Query (Top Zone 1)
                </span>
              </div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/40 text-teal-700 dark:text-teal-300 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                <span>Live Node Connection: Ready to Query</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 dark:text-gray-500 pointer-events-none">
                  search
                </span>
                <input
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-[#0f191c] border border-gray-200 dark:border-[#25393f] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-[#00838f] transition-colors"
                  id="search-input"
                  placeholder="Search block height, epoch, transaction hash, or DID..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  className="w-full md:w-auto px-4 py-2 bg-primary dark:bg-[#006064] text-white text-xs font-semibold rounded hover:bg-opacity-90 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                  <span>Query Ledger</span>
                </button>
                {searchQuery && (
                  <button
                    className="w-full md:w-auto px-3 py-2 border border-gray-200 dark:border-[#25393f] text-gray-600 dark:text-gray-300 text-xs rounded hover:bg-gray-50 dark:hover:bg-[#16272c] transition-colors whitespace-nowrap cursor-pointer"
                    onClick={() => setSearchQuery("")}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: High-density Data Table Container with Mock Stream Preview Banner */}
        <div className="mb-4 p-4 rounded bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-0">
              preview
            </span>
            <div>
              <div className="font-semibold text-sm tracking-wide flex items-center gap-2 flex-wrap">
                <span>Expected Output Preview (Mock Example) — How Results Will Look After Completion</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Notice: Real blocks and transactions stream dynamically across Polygon Amoy as new events occur. The rows below include live database proofs and verified sample completed blocks.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center self-start sm:self-auto px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-[#0b1315] border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 shadow-xs whitespace-nowrap">
            MOCK STREAM PREVIEW
          </span>
        </div>

        {/* Table */}
        <div className="print-full-table bg-white dark:bg-[#132024] border border-gray-200 dark:border-[#22353a] shadow-sm overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-[#16272c] border-b border-gray-200 dark:border-[#22353a] transition-colors">
                <tr>
                  <th className="py-3 px-gutter font-label-md text-label-md text-gray-700 dark:text-gray-200 w-48">
                    Timestamp (UTC)
                  </th>
                  <th className="py-3 px-gutter font-label-md text-label-md text-gray-700 dark:text-gray-200 w-40">
                    Event Type
                  </th>
                  <th className="py-3 px-gutter font-label-md text-label-md text-gray-700 dark:text-gray-200">
                    Actor / Hash
                  </th>
                  <th className="py-3 px-gutter font-label-md text-label-md text-gray-700 dark:text-gray-200 w-32 text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm divide-y divide-gray-100 dark:divide-[#1c2d32]" id="event-table-body">
                {/* Live items if any */}
                {filtered.map((c) => (
                  <tr key={c.id || c.credential_id} className="hover:bg-gray-50/60 dark:hover:bg-[#17272c] transition-colors">
                    <td className="py-3 px-gutter whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-xs">
                      {new Date(c.issued_at).toISOString().replace("T", " ").substring(0, 19)}
                    </td>
                    <td className="py-3 px-gutter">
                      <span className="inline-block bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 font-semibold text-[11px] uppercase tracking-wider rounded">
                        {c.credential_type || "Issuance"}
                      </span>
                    </td>
                    <td className="py-3 px-gutter font-code-sm text-code-sm text-gray-800 dark:text-gray-200 font-mono break-all text-xs">
                      <div>
                        <strong>{c.title}</strong>
                      </div>
                      <span className="text-on-surface-variant dark:text-slate-400 truncate block max-w-lg">
                        Hash: {c.document_hash}
                      </span>
                    </td>
                    <td className="py-3 px-gutter text-right whitespace-nowrap">
                      <span className="text-status-valid dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Simulated Historical Rows from Stitch */}
                <tr className="hover:bg-gray-50/60 dark:hover:bg-[#17272c] transition-colors">
                  <td className="py-3 px-gutter whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-xs">
                    2026-03-30 14:32:01
                  </td>
                  <td className="py-3 px-gutter">
                    <span className="inline-block bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 font-semibold text-[11px] uppercase tracking-wider rounded">
                      Issuance
                    </span>
                  </td>
                  <td className="py-3 px-gutter font-code-sm text-code-sm text-gray-800 dark:text-gray-200 font-mono break-all text-xs">
                    0x7a2b9c1d4e5f8a0b3c6d9e2f5a8b1c4d7e0f3a6b (CRED-2026-ENG-0891)
                  </td>
                  <td className="py-3 px-gutter text-right whitespace-nowrap">
                    <span className="text-status-valid dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/60 dark:hover:bg-[#17272c] transition-colors">
                  <td className="py-3 px-gutter whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-xs">
                    2026-03-29 11:15:20
                  </td>
                  <td className="py-3 px-gutter">
                    <span className="inline-block bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 font-semibold text-[11px] uppercase tracking-wider rounded">
                      Access-Grant
                    </span>
                  </td>
                  <td className="py-3 px-gutter font-code-sm text-code-sm text-gray-800 dark:text-gray-200 font-mono break-all text-xs">
                    XYZ_Bank_Enterprise_Node (0x976E...0aa9)
                  </td>
                  <td className="py-3 px-gutter text-right whitespace-nowrap">
                    <span className="text-status-valid dark:text-emerald-400 font-semibold inline-flex items-center gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Confirmed
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-50/60 dark:hover:bg-[#17272c] transition-colors">
                  <td className="py-3 px-gutter whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-xs">
                    2026-03-25 09:40:12
                  </td>
                  <td className="py-3 px-gutter">
                    <span className="inline-block bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 px-2 py-0.5 font-semibold text-[11px] uppercase tracking-wider rounded">
                      Revocation
                    </span>
                  </td>
                  <td className="py-3 px-gutter font-code-sm text-code-sm text-gray-800 dark:text-gray-200 font-mono break-all text-xs">
                    0x992b11d3...e3a1 (CRED-2025-ARCH-0412 — Superseded)
                  </td>
                  <td className="py-3 px-gutter text-right whitespace-nowrap">
                    <span className="text-status-revoked font-semibold inline-flex items-center gap-1 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Revoked
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="mt-auto border-t border-gray-200 dark:border-[#1e2f34] bg-white dark:bg-[#101b1e] py-6 px-4 sm:px-margin-desktop transition-colors duration-200">
        <div className="max-w-container-max mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div>© 2026 CredChain Ledger. Built on open standards.</div>
          <div className="flex items-center gap-6">
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Terms of Service
            </a>
            <a className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors" href="#">
              Polygon Amoy Registry: {contractAddress.substring(0, 10)}...
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
