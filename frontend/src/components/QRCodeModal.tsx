import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialId: string;
  title: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  credentialId,
  title,
}) => {
  if (!isOpen) return null;

  const verificationUrl = `${window.location.origin}/verify/${credentialId}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-surface border border-border-subtle max-w-md w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-on-surface">Credential Verification QR</h3>
            <p className="text-xs text-on-surface-variant font-mono">{credentialId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-border-subtle text-on-surface-variant hover:bg-surface-container"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white border border-border-subtle mb-4">
          <QRCodeSVG
            value={verificationUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
          <span className="mt-3 text-[11px] font-mono text-on-surface-variant text-center break-all">
            {verificationUrl}
          </span>
        </div>

        <div className="bg-surface-container-low p-3 border border-border-subtle mb-4 text-xs text-on-surface-variant">
          <p className="font-semibold text-on-surface mb-1">{title}</p>
          <p>
            Scan this QR code with any camera or verifier terminal to automatically verify against Polygon Amoy on-chain proof.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(verificationUrl);
              alert("Verification URL copied to clipboard!");
            }}
            className="px-4 py-2 text-xs font-semibold border border-border-subtle hover:bg-surface-container"
          >
            Copy Verification Link
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-container"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
