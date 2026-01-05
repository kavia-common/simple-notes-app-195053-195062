import React from "react";

/**
 * PUBLIC_INTERFACE
 * Renders an inline banner indicating offline/local fallback mode.
 */
export default function OfflineBanner({ isOffline, message }) {
  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      <strong>Offline mode:</strong> Using local storage fallback.
      {message ? <span className="offline-banner__msg"> {message}</span> : null}
    </div>
  );
}
