import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

export const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();
  const navigate = useNavigate();
  const [recordId, setRecordId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordId.trim()) {
      navigate(`/verify?id=${encodeURIComponent(recordId.trim())}`);
    }
  };

  return (
    <div className="bg-[#fcf9f8] dark:bg-[#0b1315] text-[#1a2327] dark:text-slate-100 font-body-lg text-body-lg min-h-screen flex flex-col antialiased selection:bg-primary-container selection:text-white transition-colors">
      {/* TopNavBar */}
      <header className="w-full bg-surface dark:bg-[#0e171a]/90 border-b border-outline-variant dark:border-slate-800 z-50 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-20">
          <div className="flex items-center gap-3">
            <Link className="flex items-center gap-3" to="/">
              <img
                alt="CredChain"
                className="h-12 w-12 object-contain transition-all dark:drop-shadow-[0_0_14px_rgba(0,229,255,0.45)]"
                src="/logo.svg"
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#132024] px-2 py-1 transition-colors" to="/explorer">
              Explorer
            </Link>
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#132024] px-2 py-1 transition-colors" to="/wallet">
              Wallet
            </Link>
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-[#132024] px-2 py-1 transition-colors" to="/dashboard">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user?.role === "holder" && (
              account ? (
                <button
                  onClick={connectWallet}
                  className="bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-900 dark:hover:bg-teal-400 font-label-md text-label-md px-4 py-2.5 transition-colors hover:bg-primary-container active:opacity-80 font-semibold font-mono text-xs cursor-pointer"
                  type="button"
                >
                  {account.slice(0, 6)}...{account.slice(-4)}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-900 dark:hover:bg-teal-400 font-label-md text-label-md px-4 py-2.5 transition-colors hover:bg-primary-container active:opacity-80 font-semibold cursor-pointer"
                  type="button"
                >
                  Connect Holder Wallet
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full bg-surface-container-low dark:bg-[#0e171a] border-b border-outline-variant dark:border-slate-800">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-3">
          <ol className="flex items-center space-x-2 font-body-sm text-body-sm text-on-surface-variant">
            <li>
              <Link className="hover:text-primary dark:hover:text-teal-400 flex items-center gap-1 text-on-surface-variant dark:text-slate-400" to="/">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Home</span>
              </Link>
            </li>
            <li className="flex items-center text-outline dark:text-slate-600">
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </li>
            <li aria-current="page" className="font-semibold text-primary dark:text-teal-400">
              404 Not Found
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Error Section */}
          <section className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 md:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container text-error dark:bg-rose-950/50 dark:text-rose-300 border border-transparent dark:border-rose-900/50 font-label-md text-label-md mb-6">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>HTTP 404: RECORD_UNRESOLVED</span>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-slate-100 tracking-tight mb-4">
              404 - Page Not Found
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 max-w-2xl mb-8">
              The requested ledger record, page, or milestone trail could not be located on the CredChain network.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link
                className="inline-flex items-center justify-center gap-2 bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-900 font-label-md text-label-md px-6 py-3 hover:bg-primary-container dark:hover:bg-teal-400 transition-colors active:opacity-80 font-semibold"
                to="/"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Return to Home</span>
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 border border-primary dark:border-teal-800 text-primary dark:text-teal-300 dark:bg-[#16272c] font-label-md text-label-md px-6 py-3 hover:bg-surface-container-low dark:hover:bg-[#1c3239] transition-colors active:opacity-80"
                to="/explorer"
              >
                <span className="material-symbols-outlined text-[18px]">travel_explore</span>
                <span>Explore Ledger</span>
              </Link>
            </div>

            {/* Ledger Node Trace Diagnostics Container */}
            <div className="border-t border-border-subtle dark:border-[#22353a] pt-6">
              <h2 className="font-label-md text-label-md text-on-surface dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">database</span>
                <span>Ledger Inquiry Diagnostics</span>
              </h2>
              <div className="bg-surface-container-low dark:bg-[#0e1a1d] border border-border-subtle dark:border-[#22353a] p-4 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-300 overflow-x-auto space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-outline dark:text-slate-400">Network State:</span>
                  <span className="text-status-valid dark:text-emerald-400 font-medium">Mainnet Online (Block #8,419,203)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-outline dark:text-slate-400">Query Hash:</span>
                  <span className="text-on-surface dark:text-slate-300 font-mono">0x7f4e91a0c4...b289cd</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-outline dark:text-slate-400">Resolution Error:</span>
                  <span className="text-error dark:text-rose-400 font-medium">Null Pointer / Unmined Merkle Proof</span>
                </div>
              </div>
            </div>
          </section>

          {/* Asymmetric Ledger Verification Sidebar / Bento Card */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6">
              <h2 className="font-headline-md text-headline-md text-on-surface dark:text-slate-100 mb-2">Ledger Quick Search</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mb-4">
                Search credential identifiers directly across the active distributed state ledger.
              </p>
              <form className="space-y-3" onSubmit={handleSearch}>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface dark:text-slate-300 mb-1" htmlFor="recordId">
                    Credential ID or TxHash
                  </label>
                  <input
                    className="w-full border border-border-subtle dark:border-[#24393f] px-3 py-2 text-on-surface dark:text-slate-100 dark:placeholder-slate-500 bg-surface-container-lowest dark:bg-[#0e1a1d] font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-teal-500"
                    id="recordId"
                    placeholder="e.g. 0x48a... or CID-94812"
                    type="text"
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                  />
                </div>
                <button
                  className="w-full bg-surface-container-high dark:bg-teal-900/50 text-primary dark:text-teal-300 border border-border-subtle dark:border-teal-700 font-label-md text-label-md py-2.5 hover:bg-surface-container-highest dark:hover:bg-teal-900/70 transition-colors cursor-pointer"
                  type="submit"
                >
                  Verify Identifier
                </button>
              </form>
            </div>

            <div className="bg-surface-container-low dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6">
              <h3 className="font-label-md text-label-md text-on-surface dark:text-slate-100 mb-4">Verification Assistance</h3>
              <ul className="space-y-3 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-teal-400 text-[18px] mt-0.5">check_box</span>
                  <span>Verify that the issuing authority has finalized consensus for this milestone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-teal-400 text-[18px] mt-0.5">check_box</span>
                  <span>Review transaction parameters if redirected from an external identity broker.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary dark:text-teal-400 text-[18px] mt-0.5">check_box</span>
                  <span>Consult public registry indices via CredChain Explorer.</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container dark:bg-[#0e171a] border-t border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-400 mt-auto transition-colors">
        <div className="w-full py-base px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-base py-6">
          <div className="font-body-sm text-body-sm text-on-surface-variant">
            © 2026 CredChain Ledger. Built on open standards.
          </div>
          <nav className="flex flex-wrap items-center gap-6">
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-400 underline transition-opacity duration-150" href="#">Privacy</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-400 underline transition-opacity duration-150" href="#">Terms</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-400 underline transition-opacity duration-150" href="#">API Docs</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-teal-400 underline transition-opacity duration-150" href="#">Source</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
