import { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import toast from "react-hot-toast";
import axiosInstance from "./useAxiosInstance";

const firebaseConfig = {
  apiKey: "AIzaSyCw1nodfsbj1w6gyDNsiwDl87A818cgN0Y",
  authDomain: "grounds-booking-dc802.firebaseapp.com",
  projectId: "grounds-booking-dc802",
  storageBucket: "grounds-booking-dc802.firebasestorage.app",
  messagingSenderId: "9445008437",
  appId: "1:9445008437:web:b74d5a2d9f6ad5d9a57d7c",
  measurementId: "G-B9WRH0Q80T",
};

export const useWebPushNotifications = (isLoggedIn) => {
  useEffect(() => {
    // Only execute on browser environments
    if (!isLoggedIn || typeof window === "undefined") return;

    let isMounted = true;

    const setupWebPush = async () => {
      try {
        console.log("WebPush: Checking browser capability & permissions...");

        // 1. Ensure browser supports service workers and Push Messaging
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.warn(
            "WebPush: Browser does not support web push notifications."
          );
          return;
        }

        // 2. Request browser permissions
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }

        if (permission !== "granted") {
          console.warn("WebPush: Permission not granted by user.");
          return;
        }

        // 3. Initialize Firebase app and messaging
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // 4. Retrieve browser token using VAPID key
        console.log("WebPush: Fetching token...");
        const token = await getToken(messaging, {
          vapidKey:
            "BAiCqk8D8jUlWfEIfA_r9mrKCHzAm0jjolLXHlvK6rlTbMCAYr2Ttc_XtO8P4lNYVmunZzXBEyMjHAhDOYtf4ac",
        });

        if (token && isMounted) {
          console.log("WebPush: Registration success, token:", token);
          // toast.success('Web Push Notifications registered!');

          // 5. Send the web token to our unified backend register endpoint
          await axiosInstance.post("/api/user/notifications/device-token", {
            token,
            platform: "web",
          });
          console.log(
            "WebPush: Registered successfully with centralized backend."
          );
        } else {
          console.warn("WebPush: No registration token available.");
        }

        // 6. Monitor incoming foreground notification messages
        onMessage(messaging, (payload) => {
          if (!isMounted) return;
          console.log("WebPush: Foreground notification received:", payload);
          toast.success(
            (payload.notification?.title || "New Notification") +
              ": " +
              (payload.notification?.body || "")
          );
        });
      } catch (err) {
        console.error("WebPush: Error setting up Web Push notifications:", err);
      }
    };

    setupWebPush();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);
};
