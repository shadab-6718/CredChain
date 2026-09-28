import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { apiService } from "../services/api";
import { VerificationResponse } from "../types";
import { Timeline } from "../components/Timeline";
import { UserAuthBadge } from "../components/UserAuthBadge";

export const VerifyCredentialPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [credentialId, setCredentialId] = useState(initialId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"scan" | "lookup" | "json">("lookup");
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "requesting" | "scanning" | "paused" | "error">("idle");
  const [cameraError, setCameraError] = useState("");
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

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

  const runVerification = async (targetId?: string, fileToVerify?: File) => {
    const id = (targetId || credentialId).trim().toUpperCase();
    if (!id && !fileToVerify) {
      alert("Please enter a Credential ID or upload a document file.");
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setHistory([]);

    try {
      const res = await apiService.verify(id, undefined, fileToVerify || (selectedFile || undefined));
      setResult(res);

      if (res.credential?.credential_id || id) {
        try {
          const histRes = await apiService.getHistory(res.credential?.credential_id || id);
          setHistory(histRes.history || []);
        } catch {}
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setResult({
        status: "NOT_FOUND",
        isValid: false,
        headline: "Not found in CredChain registry",
        message: err.response?.data?.message || "Verification request failed on consensus ledger.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      setCredentialId(initialId);
      runVerification(initialId);
    }
  }, [initialId]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn("Scanner stop error:", err);
      }
      html5QrCodeRef.current = null;
    }
    setCameraStatus("paused");
    setCameraActive(false);
  };

  const startScanner = async () => {
    setCameraError("");
    setCameraStatus("requesting");
    setCameraActive(true);

    await stopScanner();

    try {
      const qrScannerElement = document.getElementById("qr-reader-container");
      if (!qrScannerElement) {
        setCameraStatus("idle");
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader-container");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedQR(decodedText);
        },
        (_errorMessage) => {
          // Ignored per frame scanning loop
        }
      );
      setCameraStatus("scanning");
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera permission/initialization error:", err);
      setCameraStatus("error");
      setCameraActive(false);
      const errMsg = err?.message || String(err);
      if (err?.name === "NotAllowedError" || errMsg.includes("Permission") || errMsg.includes("denied")) {
        setCameraError(
          "Camera access was denied by your browser. Please click the camera icon in your address bar to allow access, or click 'Retry Camera Permission'."
        );
      } else if (err?.name === "NotFoundError" || errMsg.includes("NotFound") || errMsg.includes("not found")) {
        setCameraError("No webcam or video device found on this system. You can upload a certificate image or simulate detection below.");
      } else {
        setCameraError(`Camera initialization failed: ${errMsg}. You can upload a certificate image or simulate detection below.`);
      }
    }
  };

  const handleDecodedQR = async (decodedText: string) => {
    if (!decodedText) return;
    let target = decodedText.trim();
    if (target.includes("/verify/")) {
      target = target.split("/verify/")[1].split("?")[0].split("/")[0];
    } else if (target.includes("id=")) {
      const match = target.match(/id=([^&]+)/);
      if (match) target = match[1];
    }
    await stopScanner();
    setCredentialId(target);
    runVerification(target);
  };

  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      const tempScanner = new Html5Qrcode("qr-file-helper");
      const decoded = await tempScanner.scanFile(file, false);
      tempScanner.clear();
      handleDecodedQR(decoded);
    } catch (err) {
      alert("Could not detect a valid CredChain QR code in the uploaded image. Please ensure the QR code is clear and properly lit.");
    }
  };

  useEffect(() => {
    if (activeTab === "scan") {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab]);

  return (
    <div className="bg-background dark:bg-[#0b1315] text-on-surface dark:text-slate-100 font-body-lg text-body-lg min-h-screen flex flex-col antialiased transition-colors duration-200">
      {/* TopNavBar (Exact Stitch Design) */}
      <header className="w-full bg-surface dark:bg-[#101b1e] border-b border-outline-variant dark:border-slate-800 top-0 z-50 sticky transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-16">
          <div className="flex items-center gap-8">
            <Link className="flex items-center" to="/">
              <img
                alt="CredChain Ledger Protocol"
                className="h-10 md:h-12 w-auto object-contain transition-all duration-200 drop-shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                src="/logo.svg"
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6 font-body-lg text-body-lg">
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/explorer">
                Explorer
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/wallet">
                Wallet
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/issuer">
                Dashboard
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/governance">
                Governance
              </Link>
              <Link className="text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed hover:bg-surface-container-low dark:hover:bg-[#192b30] transition-colors px-2 py-1" to="/admin">
                Admin Portal
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {/* Google User Auth Badge */}
            <UserAuthBadge />

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container dark:bg-[#162428] text-primary dark:text-primary-fixed text-xs font-code-sm border border-border-subtle dark:border-slate-700">
              <span className="w-2 h-2 bg-status-valid rounded-full animate-pulse"></span>LEDGER ONLINE
            </span>
            <button
              aria-label="Toggle color mode"
              className="p-2 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#162428] hover:bg-surface-container dark:hover:bg-[#1e3238] text-on-surface-variant dark:text-slate-300 hover:text-primary dark:hover:text-primary-fixed transition-colors flex items-center justify-center cursor-pointer"
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle Dark Mode"
              type="button"
            >
              <span className="material-symbols-outlined text-base" id="theme-icon">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs & Status Bar */}
      <section className="w-full bg-surface-container-low dark:bg-[#0f1719] border-b border-border-subtle dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-base">
          <nav className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant dark:text-slate-400">
            <Link className="hover:text-primary dark:hover:text-primary-fixed transition-colors" to="/">
              Home
            </Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-on-surface dark:text-white font-semibold">Verify Credential</span>
          </nav>
        </div>
      </section>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        {/* Title & Subtitle Section */}
        <div className="max-w-3xl mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-surface-container dark:bg-[#152327] border border-border-subtle dark:border-slate-700 mb-4">
            <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-sm">verified</span>
            <span className="font-label-md text-label-md text-primary dark:text-primary-fixed tracking-wide font-bold">
              ZERO-KNOWLEDGE DECENTRALIZED AUDIT
            </span>
          </div>
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface dark:text-white tracking-tight mb-3 font-bold">
            Verify Credential or Milestone Trail
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-slate-300 leading-relaxed">
            Instant cryptographic proof verification for academic diplomas and land records directly from the distributed ledger.
          </p>
        </div>

        {/* Verification Methods Dual-Panel Interface with Tabs */}
        <div className="bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-slate-700 shadow-sm mb-16 transition-colors duration-200">
          {/* Method Switcher Tab Strip */}
          <div className="flex flex-wrap border-b border-border-subtle dark:border-slate-700 bg-surface-container-low dark:bg-[#0e171a]">
            <button
              className={`flex items-center gap-2.5 px-6 py-3.5 font-label-md text-label-md border-r border-border-subtle dark:border-slate-700 cursor-pointer transition-colors ${
                activeTab === "scan"
                  ? "bg-surface-container-lowest dark:bg-[#132024] text-primary dark:text-primary-fixed border-b-2 border-b-primary font-bold"
                  : "text-on-surface-variant dark:text-slate-400 hover:text-primary"
              }`}
              onClick={() => setActiveTab("scan")}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span>Scan QR Code</span>
            </button>
            <button
              className={`flex items-center gap-2.5 px-6 py-3.5 font-label-md text-label-md border-r border-border-subtle dark:border-slate-700 cursor-pointer transition-colors ${
                activeTab === "lookup"
                  ? "bg-surface-container-lowest dark:bg-[#132024] text-primary dark:text-primary-fixed border-b-2 border-b-primary font-bold"
                  : "text-on-surface-variant dark:text-slate-400 hover:text-primary"
              }`}
              onClick={() => setActiveTab("lookup")}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">manage_search</span>
              <span>Manual Lookup</span>
            </button>
            <button
              className={`flex items-center gap-2.5 px-6 py-3.5 font-label-md text-label-md border-r border-border-subtle dark:border-slate-700 cursor-pointer transition-colors ${
                activeTab === "json"
                  ? "bg-surface-container-lowest dark:bg-[#132024] text-primary dark:text-primary-fixed border-b-2 border-b-primary font-bold"
                  : "text-on-surface-variant dark:text-slate-400 hover:text-primary"
              }`}
              onClick={() => setActiveTab("json")}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">file_present</span>
              <span>Upload Document / File Integrity</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="p-6 md:p-8">
            {/* Tab 1: Live QR Optical Reader */}
            {activeTab === "scan" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 bg-surface-container-low dark:bg-[#17262a] border border-border-subtle dark:border-slate-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            cameraStatus === "scanning"
                              ? "bg-status-valid"
                              : cameraStatus === "error"
                              ? "bg-error"
                              : "bg-status-pending"
                          }`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                            cameraStatus === "scanning"
                              ? "bg-status-valid"
                              : cameraStatus === "error"
                              ? "bg-error"
                              : "bg-status-pending"
                          }`}
                        ></span>
                      </span>
                      <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">
                        Live Optical Reader (
                        {cameraStatus === "scanning"
                          ? "Camera Active"
                          : cameraStatus === "requesting"
                          ? "Requesting Permission"
                          : cameraStatus === "error"
                          ? "Permission Blocked"
                          : "Paused"}
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cameraStatus === "scanning" ? (
                        <button
                          className="px-2.5 py-1 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#111c1e] text-xs font-label-md text-on-surface dark:text-slate-200 hover:bg-surface-container transition-colors inline-flex items-center gap-1 cursor-pointer"
                          onClick={stopScanner}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm text-status-pending">videocam_off</span>
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          className="px-2.5 py-1 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-[#111c1e] text-xs font-label-md text-on-surface dark:text-slate-200 hover:bg-surface-container transition-colors inline-flex items-center gap-1 cursor-pointer"
                          onClick={startScanner}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-sm text-status-valid">videocam</span>
                          <span>{cameraStatus === "error" ? "Retry Camera" : "Resume"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optical Scanner Frame Container */}
                  <div className="relative bg-[#070d0e] min-h-[320px] flex items-center justify-center overflow-hidden border border-outline dark:border-slate-700 rounded">
                    {/* Live Html5Qrcode video mounting point */}
                    <div id="qr-reader-container" className="w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden"></div>

                    {/* Camera Permission Requesting Overlay */}
                    {cameraStatus === "requesting" && (
                      <div className="absolute inset-0 bg-[#070d0e]/90 flex flex-col items-center justify-center p-6 text-center z-10">
                        <span className="material-symbols-outlined text-primary dark:text-primary-fixed text-4xl animate-spin mb-3">
                          progress_activity
                        </span>
                        <div className="font-bold text-white text-sm mb-1">
                          Requesting Camera Permission...
                        </div>
                        <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
                          Your browser is prompting for camera access. Please click <strong>Allow</strong> to activate the live scanner.
                        </p>
                      </div>
                    )}

                    {/* Camera Blocked or Error State */}
                    {cameraStatus === "error" && (
                      <div className="absolute inset-0 bg-[#070d0e]/95 flex flex-col items-center justify-center p-6 text-center z-10">
                        <span className="material-symbols-outlined text-error text-4xl mb-2">videocam_off</span>
                        <div className="font-bold text-white text-sm mb-1">Camera Permission Blocked or Unavailable</div>
                        <p className="text-xs text-gray-300 max-w-sm mb-4 leading-relaxed">
                          {cameraError || "Please allow camera access in your browser address bar permissions icon to scan physical certificates."}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            type="button"
                            onClick={startScanner}
                            className="px-4 py-2 bg-primary dark:bg-primary-container text-on-primary font-bold text-xs rounded hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            <span>Retry Camera Permission</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Laser and Reticle Frame Overlay during active scanning */}
                    {cameraStatus === "scanning" && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-56 border-2 border-status-valid/70 relative animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(0,112,60,0.3)]">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-status-valid"></div>
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-status-valid"></div>
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-status-valid"></div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-status-valid"></div>
                        </div>
                        <div className="absolute bottom-4 bg-black/75 px-3 py-1 text-xs text-white rounded font-mono">
                          Align QR code within reticle frame
                        </div>
                      </div>
                    )}

                    {/* Idle / Paused overlay */}
                    {cameraStatus === "paused" && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center z-10">
                        <span className="material-symbols-outlined text-slate-400 text-4xl mb-2">videocam_off</span>
                        <div className="text-sm font-bold text-white mb-2">Optical Reader Paused</div>
                        <button
                          type="button"
                          onClick={startScanner}
                          className="px-4 py-2 bg-primary dark:bg-primary-container text-on-primary font-bold text-xs rounded hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Resume Camera
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hidden container for file-based QR decoding */}
                  <div id="qr-file-helper" className="hidden"></div>

                  {/* Action Buttons: Simulate and Upload File */}
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => runVerification("CRED-2026-ENG-0891")}
                        className="flex-1 py-2.5 bg-primary dark:bg-primary-container text-on-primary text-xs font-bold rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">qr_code_2</span>
                        <span>Simulate QR Detection (CRED-2026-ENG-0891)</span>
                      </button>

                      <label className="flex-1 py-2.5 bg-surface-container dark:bg-[#1f3035] hover:bg-surface-container-high text-on-surface dark:text-gray-200 border border-border-subtle dark:border-slate-700 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                        <span className="material-symbols-outlined text-sm">upload_file</span>
                        <span>Upload QR Certificate Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Quick Test Fixtures */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-on-surface-variant dark:text-slate-400">
                      <span className="font-semibold text-[11px] uppercase tracking-wider">Quick Fixtures:</span>
                      <button
                        type="button"
                        onClick={() => runVerification("BTECH-2026-001")}
                        className="text-primary dark:text-primary-fixed hover:underline cursor-pointer"
                      >
                        BTECH-2026-001
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => runVerification("LAND-2026-088")}
                        className="text-primary dark:text-primary-fixed hover:underline cursor-pointer"
                      >
                        LAND-2026-088
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <h3 className="font-bold text-sm text-on-surface dark:text-white">Live Scanner Controls</h3>
                  <p className="text-xs text-on-surface-variant dark:text-slate-400">
                    Point your device camera at any CredChain QR credential certificate to immediately decode the tamper-evident payload and verify against the ledger.
                  </p>
                  <div className="p-3 bg-surface-container-low dark:bg-slate-900 border border-border-subtle dark:border-slate-800 text-xs font-mono space-y-1">
                    <div>Scanning Algorithm: Reed-Solomon Error Corrected</div>
                    <div>Camera Permission: Browser MediaDevices API</div>
                    <div>Ledger Network: Polygon Amoy Testnet</div>
                    <div>Signature Standard: Ed25519 / ECDSA secp256k1</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Manual Lookup by ID / Hash */}
            {activeTab === "lookup" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-on-surface dark:text-slate-300">
                    Credential ID or On-Chain Merkle Hash
                  </label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="e.g. CRED-2026-ENG-0891 or LAND-DEED-PARCEL-4802"
                    className="w-full px-3 py-2.5 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white font-mono text-sm focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs text-on-surface-variant dark:text-slate-400">Example IDs:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCredentialId("CRED-2026-ENG-0891");
                        runVerification("CRED-2026-ENG-0891");
                      }}
                      className="text-xs text-primary dark:text-primary-fixed underline hover:opacity-80"
                    >
                      CRED-2026-ENG-0891 (Degree)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCredentialId("LAND-DEED-PARCEL-4802");
                        runVerification("LAND-DEED-PARCEL-4802");
                      }}
                      className="text-xs text-primary dark:text-primary-fixed underline hover:opacity-80"
                    >
                      LAND-DEED-PARCEL-4802 (Land Title)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runVerification()}
                  disabled={isVerifying}
                  className="w-full py-3 bg-primary hover:bg-[#00383b] dark:bg-primary-container text-on-primary font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">search</span>
                  <span>{isVerifying ? "Verifying On-Chain Proofs..." : "Verify Credential Integrity"}</span>
                </button>
              </div>
            )}

            {/* Tab 3: Upload Signed Proof JSON or Document File */}
            {activeTab === "json" && (
              <div className="max-w-2xl space-y-4">
                <div className="border-2 border-dashed border-border-subtle dark:border-slate-700 p-6 text-center bg-surface-container-low dark:bg-slate-900/60">
                  <input
                    type="file"
                    id="doc-upload-file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.png,.jpg,.jpeg,.json"
                    className="hidden"
                  />
                  <label htmlFor="doc-upload-file" className="cursor-pointer block">
                    <span className="material-symbols-outlined text-4xl text-primary dark:text-primary-fixed mb-2">
                      upload_file
                    </span>
                    {selectedFile ? (
                      <div>
                        <div className="font-bold text-xs text-on-surface dark:text-white">{selectedFile.name}</div>
                        <div className="text-[11px] font-mono text-on-surface-variant">
                          {(selectedFile.size / 1024).toFixed(1)} KB selected
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-bold text-xs text-on-surface dark:text-white">
                          Select certificate or document file to calculate SHA-256 fingerprint
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-1">
                          PDF, JSON, PNG, JPEG formats supported
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-on-surface dark:text-slate-300">
                    Associated Credential ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={credentialId}
                    onChange={(e) => setCredentialId(e.target.value)}
                    placeholder="e.g. CRED-2026-ENG-0891"
                    className="w-full px-3 py-2 border border-border-subtle dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white font-mono text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => runVerification(undefined, selectedFile || undefined)}
                  disabled={isVerifying || !selectedFile}
                  className="w-full py-3 bg-primary hover:bg-[#00383b] dark:bg-primary-container text-on-primary font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>{isVerifying ? "Verifying Document SHA-256..." : "Perform Cryptographic Match"}</span>
                </button>
              </div>
            )}

            {/* Live Verification Result Box */}
            {result && (
              <div className="mt-8 pt-6 border-t border-border-subtle dark:border-slate-800 space-y-4">
                <div
                  className={`p-4 border flex items-center justify-between gap-3 ${
                    result.status === "VALID"
                      ? "bg-status-valid/10 border-status-valid/30 text-status-valid"
                      : result.status === "REVOKED"
                      ? "bg-status-revoked/10 border-status-revoked/30 text-status-revoked"
                      : result.status === "PENDING_ACCEPTANCE"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : result.status === "REJECTED"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-error/10 border-error/30 text-error"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-2xl">
                      {result.status === "VALID"
                        ? "check_circle"
                        : result.status === "REVOKED"
                        ? "cancel"
                        : result.status === "PENDING_ACCEPTANCE"
                        ? "schedule"
                        : result.status === "REJECTED"
                        ? "highlight_off"
                        : "warning"}
                    </span>
                    <div>
                      <div className="font-bold text-sm">{result.headline || "Verification Status"}</div>
                      <div className="text-xs">{result.message}</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 border">
                    {result.status}
                  </span>
                </div>

                {result.credential && (
                  <div className="p-4 bg-surface-container-low dark:bg-slate-900 border border-border-subtle dark:border-slate-800 text-xs font-mono space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant dark:text-slate-400">Type:</span>
                      <span className="font-bold text-on-surface dark:text-white">
                        {result.credential.credential_type || result.credential.credentialType || result.credential.type || "Digital Certificate"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant dark:text-slate-400">Name:</span>
                      <span className="font-bold text-on-surface dark:text-white">
                        {result.credential.title || result.credential.name || "Academic Credential"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant dark:text-slate-400">Issuer:</span>
                      <span className="text-on-surface dark:text-slate-200">
                        {result.credential.issuer_organization || result.credential.issuer_name || result.credential.issuer || "ABC Institute of Technology"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant dark:text-slate-400">Holder Name:</span>
                      <span className="font-bold text-primary dark:text-primary-fixed">
                        {result.credential.holder_name || result.credential.recipient_name || result.credential.holderName || "Rahul Kumar"}
                      </span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span className="text-on-surface-variant dark:text-slate-400">SHA-256 Digest:</span>
                      <span className="truncate max-w-[280px] sm:max-w-md">{result.credential.document_hash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant dark:text-slate-400">Issued Date:</span>
                      <span>{new Date(result.credential.issued_at).toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-border-subtle dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="material-symbols-outlined text-sm">lock_open</span>
                        Direct Verification (No Holder Permission Required)
                      </span>
                      <div className="flex gap-2">
                        {(result.credential.documentUrl || result.credential.pinata_cid || result.credential.pinataCid) && (
                          <a
                            href={result.credential.documentUrl || `https://gateway.pinata.cloud/ipfs/${result.credential.pinata_cid || result.credential.pinataCid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary dark:text-teal-300 font-bold rounded flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            View Document Proof
                          </a>
                        )}
                        {result.credential.explorerUrl && (
                          <a
                            href={result.credential.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 text-[11px] border border-border-subtle dark:border-slate-700 hover:bg-surface-container text-on-surface dark:text-slate-300 rounded flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">link</span>
                            On-Chain Ledger
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {history.length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-on-surface dark:text-white mb-3">
                      Lifecycle Audit History
                    </h4>
                    <Timeline events={history} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Expected Verification Result & Audit Preview (Mock Demonstration) — Signature Stitch Feature */}
        <div className="mb-14">
          <div className="mb-6 p-4 bg-surface-container dark:bg-[#162428] border-l-4 border-primary dark:border-primary-fixed border border-border-subtle dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-2.5 py-1 bg-secondary text-on-secondary text-xs font-label-md uppercase tracking-wider font-bold">
                  Zone 2
                </span>
                <h2 className="font-headline-md text-headline-md text-on-surface dark:text-white font-bold">
                  Expected Verification Result &amp; Audit Preview (Mock Demonstration)
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest dark:bg-[#101b1e] border border-border-subtle dark:border-slate-700 text-status-pending text-xs font-label-md font-bold">
                <span className="material-symbols-outlined text-xs">science</span>
                MOCK PREVIEW (EXACTLY 3 EXAMPLES)
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-slate-300">
              The sections below demonstrate mock proof safeguards and sample attestation stream records illustrating how verification data renders upon successful audit completion.
            </p>
          </div>

          {/* 3 Mock Demonstration Examples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Example 1: Degree */}
            <div className="p-4 bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary dark:text-primary-fixed">CRED-2026-ENG-0891</span>
                <span className="px-2 py-0.5 bg-status-valid/15 text-status-valid font-bold text-[10px]">VALID</span>
              </div>
              <div className="font-bold text-sm text-on-surface dark:text-white">B.Tech Computer Science</div>
              <div className="text-on-surface-variant dark:text-slate-400">ABC Institute of Technology</div>
              <div className="font-mono text-[11px] text-status-valid pt-1 border-t border-border-subtle dark:border-slate-800">
                Block #19,842,091 • 0ms Latency
              </div>
            </div>

            {/* Example 2: Land Deed */}
            <div className="p-4 bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary dark:text-primary-fixed">LAND-DEED-PARCEL-4802</span>
                <span className="px-2 py-0.5 bg-status-valid/15 text-status-valid font-bold text-[10px]">TITLE ANCHORED</span>
              </div>
              <div className="font-bold text-sm text-on-surface dark:text-white">Freehold Title Deed #4802-A</div>
              <div className="text-on-surface-variant dark:text-slate-400">National Cadastre Authority</div>
              <div className="font-mono text-[11px] text-status-valid pt-1 border-t border-border-subtle dark:border-slate-800">
                Block #19,842,099 • Zero-Tamper Proof
              </div>
            </div>

            {/* Example 3: Revoked Example */}
            <div className="p-4 bg-surface-container-lowest dark:bg-[#132024] border border-border-subtle dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-status-revoked">CRED-2025-ARCH-0412</span>
                <span className="px-2 py-0.5 bg-status-revoked/15 text-status-revoked font-bold text-[10px]">REVOKED</span>
              </div>
              <div className="font-bold text-sm text-on-surface dark:text-white">Provisional Architecture License</div>
              <div className="text-on-surface-variant dark:text-slate-400">State Licensing Authority</div>
              <div className="font-mono text-[11px] text-status-revoked pt-1 border-t border-border-subtle dark:border-slate-800">
                Revocation Reason: Superseded
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Exact Stitch Design) */}
      <footer className="bg-surface-container dark:bg-[#101b1e] border-t border-outline-variant dark:border-slate-800 w-full mt-auto transition-colors duration-200">
        <div className="w-full py-base px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-base max-w-container-max mx-auto h-16">
          <p className="font-body-sm text-body-sm text-on-surface dark:text-slate-400">
            © 2026 CredChain Ledger. Built on open standards.
          </p>
          <div className="flex items-center gap-6 font-body-sm text-body-sm">
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Privacy
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Terms
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              API Docs
            </a>
            <a className="text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed underline" href="#">
              Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
