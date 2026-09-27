import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWeb3 } from "../context/Web3Context";

export const OfflinePage: React.FC = () => {
  const { user } = useAuth();
  const { account, connectWallet } = useWeb3();

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
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 px-2 py-1 transition-colors rounded" to="/explorer">
              Explorer
            </Link>
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 px-2 py-1 transition-colors rounded" to="/wallet">
              Wallet
            </Link>
            <Link className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 hover:bg-surface-container-low dark:hover:bg-slate-800 px-2 py-1 transition-colors rounded" to="/dashboard">
              Dashboard
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user?.role === "holder" ? (
              account ? (
                <div className="text-xs font-mono font-bold px-3 py-1.5 bg-surface-container-high dark:bg-slate-800 text-primary dark:text-teal-400 border border-border-subtle dark:border-slate-700">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 transition-colors hover:bg-primary-container active:opacity-80 flex items-center gap-2 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span>Connect Holder Wallet</span>
                </button>
              )
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2.5 transition-colors hover:bg-primary-container active:opacity-80 flex items-center gap-2 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Retry Connection</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="w-full bg-surface-container-low dark:bg-[#0e171a] border-b border-outline-variant dark:border-slate-800 transition-colors">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-3">
          <ol className="flex items-center space-x-2 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
            <li>
              <Link className="hover:text-primary hover:underline flex items-center gap-1" to="/">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Home</span>
              </Link>
            </li>
            <li className="flex items-center text-outline">
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </li>
            <li aria-current="page" className="font-semibold text-primary">
              Offline (No Internet Connection)
            </li>
          </ol>
        </div>
      </nav>

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Section */}
          <section className="lg:col-span-8 bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 md:p-10 transition-colors">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-error-container dark:bg-rose-950/50 text-error dark:text-rose-300 border border-transparent dark:border-rose-900/50 font-label-md text-label-md mb-6">
              <span className="material-symbols-outlined text-[16px]">wifi_off</span>
              <span>NETWORK STATUS: DISCONNECTED</span>
            </div>

            <h1 className="hidden md:block font-headline-lg text-headline-lg text-on-surface dark:text-slate-100 tracking-tight mb-4">
              You're Offline — No Internet Connection
            </h1>
            <h1 className="md:hidden font-headline-lg-mobile text-headline-lg-mobile text-on-surface dark:text-slate-100 tracking-tight mb-4">
              You're Offline — No Internet Connection
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-400 max-w-2xl mb-8">
              CredChain is unable to reach the distributed ledger network or load remote verification data because your device is disconnected from the internet.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                className="inline-flex items-center justify-center gap-2 bg-primary dark:bg-teal-500 text-on-primary dark:text-slate-900 font-label-md text-label-md px-6 py-3 hover:bg-primary-container dark:hover:bg-teal-400 transition-colors active:opacity-80 font-medium cursor-pointer"
                onClick={() => window.location.reload()}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Retry Connection</span>
              </button>
              <Link
                className="inline-flex items-center justify-center gap-2 border border-primary dark:border-teal-800 bg-transparent dark:bg-[#16272c] text-primary dark:text-teal-300 font-label-md text-label-md px-6 py-3 hover:bg-surface-container-low dark:hover:bg-[#1d333a] transition-colors active:opacity-80 font-medium"
                to="/wallet"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                <span>Access Cached Wallet (Offline Mode)</span>
              </Link>
            </div>

            <div className="mb-10">
              <a
                className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary dark:text-teal-400 hover:underline hover:text-primary-container dark:hover:text-teal-300 transition-colors"
                href="#diagnostics"
              >
                <span className="material-symbols-outlined text-[18px]">settings_ethernet</span>
                <span>Check Local Network Settings</span>
              </a>
            </div>

            {/* Ledger Diagnostics Card */}
            <div className="border-t border-border-subtle dark:border-[#22353a] pt-6" id="diagnostics">
              <h2 className="font-label-md text-label-md text-on-surface dark:text-slate-200 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">database</span>
                <span>Diagnostics Card</span>
              </h2>
              <div className="bg-surface-container-low dark:bg-[#0e171a] border border-border-subtle dark:border-[#22353a] p-4 font-code-sm text-code-sm text-on-surface-variant dark:text-slate-300 overflow-x-auto space-y-2">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-1.5">
                  <span className="font-semibold text-outline">Network State:</span>
                  <span className="text-error font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cancel</span>
                    Disconnected (Offline)
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-1.5">
                  <span className="font-semibold text-outline">RPC Gateway:</span>
                  <span className="text-status-revoked font-medium">Unreachable (api.mainnet.credchain.io)</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-1.5">
                  <span className="font-semibold text-outline">Local Cache Status:</span>
                  <span className="text-primary font-medium">4 Credential Proofs Synced</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-outline">Last Known Ledger State:</span>
                  <span className="text-on-surface font-medium">Block #8,419,203</span>
                </div>
              </div>
            </div>
          </section>

          {/* Troubleshooting Checklist Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 transition-colors">
              <h2 className="font-headline-md text-headline-md text-on-surface dark:text-slate-100 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">build</span>
                <span>Troubleshooting</span>
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mb-4">
                Follow these diagnostic checks to restore access to the CredChain ledger:
              </p>
              <ul className="space-y-4 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">wifi</span>
                  <span>Check your Wi-Fi or Ethernet cable connection.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">security</span>
                  <span>Check if router or local firewall allows outgoing traffic on RPC/WebSocket ports.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">lock_open</span>
                  <span>Verify your browser has permission to access the local network.</span>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-low dark:bg-[#132024] border border-border-subtle dark:border-[#22353a] p-6 transition-colors">
              <h3 className="font-label-md text-label-md text-on-surface dark:text-slate-200 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">cloud_off</span>
                <span>Offline Mode Capabilities</span>
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400 mb-3">
                While offline, cryptographic signatures can still be prepared locally and staged in your browser store. They will automatically broadcast once connectivity resumes.
              </p>
              <div className="flex items-center gap-2 font-code-sm text-code-sm text-outline">
                <span className="material-symbols-outlined text-[16px] text-status-pending">sync</span>
                <span>Pending Sync Queue: 0 Transactions</span>
              </div>
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
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary underline transition-opacity duration-150" href="#">Privacy</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary underline transition-opacity duration-150" href="#">Terms</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary underline transition-opacity duration-150" href="#">API Docs</a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary underline transition-opacity duration-150" href="#">Source</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};
