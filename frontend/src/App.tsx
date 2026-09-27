import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Web3Provider } from "./context/Web3Context";

// Exact Stitch Pages
import { HomePage } from "./pages/HomePage";
import { AuthHubPage } from "./pages/AuthHubPage";
import { IssuerAuthPage } from "./pages/IssuerAuthPage";
import { HolderAuthPage } from "./pages/HolderAuthPage";
import { VerifierAuthPage } from "./pages/VerifierAuthPage";
import { PasswordRecoveryPage } from "./pages/PasswordRecoveryPage";
import { IssuerDashboardPage } from "./pages/IssuerDashboardPage";
import { IssueCredentialPage } from "./pages/IssueCredentialPage";
import { MyWalletPage } from "./pages/MyWalletPage";
import { VerifyCredentialPage } from "./pages/VerifyCredentialPage";
import { VerificationResultPage } from "./pages/VerificationResultPage";
import { RevokeCredentialPage } from "./pages/RevokeCredentialPage";
import { LedgerExplorerPage } from "./pages/LedgerExplorerPage";
import { AccessRequestsPage } from "./pages/AccessRequestsPage";
import { ActivityAuditPage } from "./pages/ActivityAuditPage";
import { AdminPage } from "./pages/AdminPage";
import { OfflinePage } from "./pages/OfflinePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Web3Provider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Dedicated Stitch Auth Routes */}
            <Route path="/login" element={<AuthHubPage />} />
            <Route path="/auth" element={<AuthHubPage />} />
            <Route path="/auth/issuer" element={<IssuerAuthPage />} />
            <Route path="/auth/holder" element={<HolderAuthPage />} />
            <Route path="/auth/verifier" element={<VerifierAuthPage />} />
            <Route path="/auth/forgot-password" element={<PasswordRecoveryPage initialRoute="forgot" />} />
            <Route path="/auth/reset-password" element={<PasswordRecoveryPage initialRoute="reset" />} />
            
            {/* Role Dashboards & Pages */}
            <Route path="/dashboard" element={<IssuerDashboardPage />} />
            <Route path="/issuer" element={<IssuerDashboardPage />} />
            <Route path="/issue" element={<IssueCredentialPage />} />
            <Route path="/wallet" element={<MyWalletPage />} />
            <Route path="/verify" element={<VerifyCredentialPage />} />
            <Route path="/verify/:credentialId" element={<VerificationResultPage />} />
            <Route path="/revoke" element={<RevokeCredentialPage />} />
            <Route path="/revoke/:credentialId" element={<RevokeCredentialPage />} />
            <Route path="/explorer" element={<LedgerExplorerPage />} />
            <Route path="/access-requests" element={<AccessRequestsPage />} />
            <Route path="/admin" element={<AdminPage initialTab="issuers" mode="admin" />} />
            <Route path="/governance" element={<AdminPage initialTab="incidents" mode="governance" />} />
            <Route path="/audit" element={<ActivityAuditPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Web3Provider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
