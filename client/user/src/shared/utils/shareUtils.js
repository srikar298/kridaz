import { Capacitor } from "@capacitor/core";

/**
 * Normalizes URL origins for sharing to ensure native mobile platforms (localhost)
 * generate clean production domain URLs (https://kridaz.vercel.app) instead of internal localhost schemas.
 *
 * @param {string} localUrl - Standard window.location.href or local path URL
 * @returns {string} Fully qualified production share link
 */
export const getShareLink = (localUrl) => {
  const prodBase = import.meta.env.VITE_USER_URL || "https://kridaz.vercel.app";

  if (!localUrl) return prodBase;

  // Only override with prodBase if running as a Native App (Android/iOS)
  // Otherwise, if they are on localhost or a Vercel preview URL, keep their current URL.
  if (Capacitor.isNativePlatform()) {
    try {
      const parsed = new URL(localUrl);
      return `${prodBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch (e) {
      if (localUrl.startsWith("/")) {
        return `${prodBase}${localUrl}`;
      }
      return `${prodBase}/${localUrl}`;
    }
  }

  return localUrl;
};
