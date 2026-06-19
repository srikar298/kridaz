import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import toast from "react-hot-toast";
import axiosInstance from "./useAxiosInstance";

export const usePushNotifications = (isLoggedIn) => {
  useEffect(() => {
    if (!isLoggedIn || !Capacitor.isNativePlatform()) return;

    let isMounted = true;

    const setupPushNotifications = async () => {
      try {
        console.log("PushNotifications: Checking permissions...");
        // Request permissions
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === "prompt") {
          console.log("PushNotifications: Prompting user for permissions...");
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== "granted") {
          console.warn(
            "PushNotifications: User denied push notification permissions."
          );
          toast.error("Push notification permission denied.");
          return;
        }

        console.log("PushNotifications: Permission granted. Registering...");
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();

        // On success, we should be able to receive notifications
        PushNotifications.addListener("registration", async (token) => {
          if (!isMounted) return;
          console.log("Push registration success, token: " + token.value);
          toast.success("Push Notification Registered!");
          try {
            await axiosInstance.post("/api/user/notifications/device-token", {
              token: token.value,
            });
            console.log("Device token saved to backend successfully.");
          } catch (err) {
            console.error("Failed to save device token to backend:", err);
            toast.error("Failed to save push token to server.");
          }
        });

        // Some issue with our setup and push will not work
        PushNotifications.addListener("registrationError", (error) => {
          console.error("Error on registration: " + JSON.stringify(error));
          toast.error(
            "Push registration error: " + (error.error || "Unknown error")
          );
        });

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            if (!isMounted) return;
            console.log("Push received: ", notification);
            toast.success(notification.title || "New Notification");
          }
        );

        // Method called when tapping on a notification
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (notification) => {
            if (!isMounted) return;
            console.log("Push action performed: ", notification);
          }
        );
      } catch (error) {
        console.error("Failed to setup push notifications:", error);
        toast.error("Push setup failed: " + error.message);
      }
    };

    setupPushNotifications();

    return () => {
      isMounted = false;
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isLoggedIn]);
};
