import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { otaService } from "../services/otaService";

export const useOTAUpdate = () => {
  const isChecking = useRef(false);
  const isRestored = useSelector((state) => state.auth.isRestored);

  const checkForUpdates = async () => {
    // Prevent simultaneous duplicate update checks
    if (isChecking.current) return;
    isChecking.current = true;

    try {
      console.log("useOTAUpdate: Checking for OTA updates...");
      const currentBundle = await otaService.current();
      const currentVersion = currentBundle?.bundle?.version;

      const latest = await otaService.getLatest();
      if (!latest || !latest.version || !latest.url) {
        console.log(
          "useOTAUpdate: App is fully up to date. Version:",
          currentVersion
        );
        isChecking.current = false;
        return;
      }

      console.log(
        `useOTAUpdate: Current Version: ${currentVersion}, Latest Version: ${latest.version}`
      );

      // If the versions differ, perform the hot update
      if (latest.version !== currentVersion) {
        // Exclude local dev / web environment updates that might mismatch
        if (currentVersion === "web") {
          console.log(
            "useOTAUpdate: Running in web mode. Skipping hot update."
          );
          isChecking.current = false;
          return;
        }

        console.log(
          "useOTAUpdate: Newer OTA bundle found! Starting download..."
        );

        // Show elegant dark-themed loading toast
        toast.loading("Installing new app update...", {
          id: "ota-update",
          style: {
            background: "#18181b",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        });

        // 1. Download the ZIP file
        const downloadResult = await otaService.download({
          url: latest.url,
          version: latest.version,
        });

        if (!downloadResult || !downloadResult.id) {
          throw new Error("Failed to download OTA bundle package.");
        }

        // 2. Set as active bundle
        await otaService.set(downloadResult.id);

        // 3. Inform user and reload the app instantly
        toast.success("Update installed! Restarting app...", {
          id: "ota-update",
          duration: 3000,
          style: {
            background: "#18181b",
            color: "#10b981", // green text
            border: "1px solid rgba(16, 185, 129, 0.2)",
          },
        });

        // Small timeout allows the user to see the success message
        setTimeout(async () => {
          await otaService.reload();
        }, 1500);
      }
    } catch (error) {
      console.error(
        "useOTAUpdate: Failed to download or apply OTA update:",
        error
      );
      toast.error("Failed to load updates. Retrying in background.", {
        id: "ota-update-error",
        duration: 3000,
        style: {
          background: "#18181b",
          color: "#f43f5e", // red text
          border: "1px solid rgba(244, 63, 94, 0.2)",
        },
      });
    } finally {
      isChecking.current = false;
    }
  };

  useEffect(() => {
    if (!otaService.isNative() || !isRestored) return;

    // 1. Notify that the current app starts correctly (prevents rollback)
    otaService
      .notifyAppReady()
      .then(() =>
        console.log("[Capgo] App ready — update confirmed, no rollback")
      )
      .catch((err) => console.error("[Capgo] notifyAppReady failed:", err));

    // 2. Perform initial check on launch
    checkForUpdates();

    // 3. Perform check when app is refocused or resumed
    const handleFocus = () => {
      checkForUpdates();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRestored]);
};
