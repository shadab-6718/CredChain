import React from "react";
import { CredentialHistoryEvent } from "../types";

interface TimelineProps {
  events: CredentialHistoryEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 border border-border-subtle bg-surface-container-low text-center text-xs text-on-surface-variant">
        No history events recorded for this credential yet.
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "ISSUED":
        return "bg-primary text-white";
      case "VERIFIED":
        return "bg-status-valid text-white";
      case "ACCESS_GRANTED":
        return "bg-secondary text-white";
      case "ACCESS_REVOKED":
        return "bg-status-pending text-white";
      case "REVOKED":
        return "bg-status-revoked text-white";
      default:
        return "bg-surface-container-high text-on-surface";
    }
  };

  return (
    <div className="relative pl-6 border-l-2 border-border-subtle space-y-6">
      {events.map((event, index) => (
        <div key={event.id || index} className="relative group">
          {/* Square marker (sharp design token) */}
          <div
            className={`absolute -left-[31px] top-1 w-4 h-4 border border-surface flex items-center justify-center text-[9px] font-bold ${getActionColor(
              event.action
            )}`}
          >
            {index + 1}
          </div>

          <div className="border border-border-subtle bg-surface-container-lowest p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getActionColor(
                    event.action
                  )}`}
                >
                  {event.action.replace("_", " ")}
                </span>
                {event.is_blockchain_event && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                    ⛓️ Polygon Amoy Proof
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-on-surface-variant">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>

            <p className="text-xs text-on-surface font-medium mb-1">
              {event.details || "Lifecycle action executed"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-on-surface-variant mt-2 pt-2 border-t border-surface-container">
              {event.performed_by_name && (
                <div>
                  <span className="font-semibold text-on-surface">Actor:</span>{" "}
                  {event.performed_by_name}
                </div>
              )}
              {event.performed_by_address && (
                <div className="font-mono truncate">
                  <span className="font-semibold text-on-surface">Wallet:</span>{" "}
                  {event.performed_by_address}
                </div>
              )}
              {event.transaction_hash && (
                <div className="sm:col-span-2 font-mono truncate">
                  <span className="font-semibold text-on-surface">Tx Hash:</span>{" "}
                  <a
                    href={`https://amoy.polygonscan.com/tx/${event.transaction_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline"
                  >
                    {event.transaction_hash}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
