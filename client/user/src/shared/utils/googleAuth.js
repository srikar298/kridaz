// Centralized Google OAuth configuration validation and fallback.
const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Clean up surrounding quotes if present (e.g., from raw env files)
export const cleanGoogleClientId = typeof rawClientId === "string"
  ? rawClientId.replace(/^["']|["']$/g, "").trim()
  : "";

export const isGoogleConfigured = cleanGoogleClientId.endsWith(".apps.googleusercontent.com");

// Fallback to a syntactically valid mock client ID if not configured.
// This prevents Google's SDK (gsi/client) from throwing "Missing required parameter client_id" on mount,
// while we gracefully hide/disable Google Sign-In features in the UI.
export const GOOGLE_CLIENT_ID = isGoogleConfigured
  ? cleanGoogleClientId
  : "100000000000-mockclientid.apps.googleusercontent.com";
