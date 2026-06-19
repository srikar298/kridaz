import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";

export const otaService = {
  /**
   * Check if the application is running on a native platform (Android/iOS).
   */
  isNative() {
    return Capacitor.isNativePlatform();
  },

  /**
   * Signal to Capgo that the current bundle loaded successfully.
   * Crucial to call within the appReadyTimeout (default 10s) to prevent rollbacks.
   */
  async notifyAppReady() {
    if (!this.isNative()) return null;
    try {
      return await CapacitorUpdater.notifyAppReady();
    } catch (error) {
      console.error("otaService: notifyAppReady error:", error);
      throw error;
    }
  },

  /**
   * Get the active bundle information (e.g., currently running version).
   */
  async current() {
    if (!this.isNative()) return { bundle: { version: "web" } };
    try {
      return await CapacitorUpdater.current();
    } catch (error) {
      console.error("otaService: current version query error:", error);
      throw error;
    }
  },

  /**
   * Query Capgo Cloud for the latest uploaded OTA update bundle details.
   */
  async getLatest() {
    if (!this.isNative()) return null;
    try {
      return await CapacitorUpdater.getLatest();
    } catch (error) {
      console.error("otaService: getLatest query error:", error);
      throw error;
    }
  },

  /**
   * Download a new bundle zip archive into the device's local storage.
   */
  async download({ url, version }) {
    if (!this.isNative()) return null;
    try {
      return await CapacitorUpdater.download({ url, version });
    } catch (error) {
      console.error("otaService: bundle download error:", error);
      throw error;
    }
  },

  /**
   * Mark a downloaded bundle as the active version to run on the next load.
   */
  async set(bundleId) {
    if (!this.isNative()) return null;
    try {
      return await CapacitorUpdater.set({ id: bundleId });
    } catch (error) {
      console.error("otaService: set active bundle error:", error);
      throw error;
    }
  },

  /**
   * Reload the webview to boot from the newly installed bundle immediately.
   */
  async reload() {
    if (!this.isNative()) return null;
    try {
      return await CapacitorUpdater.reload();
    } catch (error) {
      console.error("otaService: reload error:", error);
      throw error;
    }
  },
};
