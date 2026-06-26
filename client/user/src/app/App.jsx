import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import router from "./router";
import { logout, restoreAuth } from "@redux/slices/authSlice";
import { setUserLocation, setLocationStatus } from "@redux/slices/uiSlice";
import axiosInstance from "@hooks/useAxiosInstance";

// Simple JWT decoder (no verification, just payload extraction)
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Helper to get cookie by name
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

import { SocketProvider } from "@context/SocketContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { RootErrorBoundary } from "@components/common";

import { reelsApi } from "@redux/api/reelsApi";
import { usePushNotifications } from "@hooks/usePushNotifications";
import { useWebPushNotifications } from "@hooks/useWebPushNotifications";
import { useOTAUpdate } from "@hooks/useOTAUpdate";

import { ObservabilityProvider } from "./ObservabilityProvider";
const LocationSidebar = lazy(
  () => import("../shared/components/modals/LocationSidebar")
);

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.current);
  const authState = useSelector((state) => state.auth);
  const locationSidebarOpen = useSelector(
    (state) => state.ui.locationSidebar?.isOpen
  );
  const lastAuthCheckTime = useRef(0);

  // Initialize OTA Updates
  useOTAUpdate();

  // Initialize Native & Web Push Notifications
  usePushNotifications(authState.isLoggedIn);
  useWebPushNotifications(authState.isLoggedIn);

  // Geolocation detection
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    dispatch(setLocationStatus("detecting"));
    if (!navigator.geolocation) {
      fallbackToIPLocation();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let city = "";
        let state = "";
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
            { signal: controller.signal }
          );
          const data = await res.json();
          city = data.city || data.locality || "";
          state = data.principalSubdivision || "";
        } catch (error) {
          if (error.name !== "AbortError") {
            console.warn("Reverse geocoding failed:", error);
          }
        }
        if (isMounted) {
          dispatch(setUserLocation({ lat, lng, city, state }));
          dispatch(setLocationStatus("granted"));
        }
      },
      (err) => {
        console.warn("Geolocation failed:", err.message);
        if (isMounted) {
          fallbackToIPLocation();
        }
      },
      { timeout: 8000, maximumAge: 60000 }
    );

    async function fallbackToIPLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/", {
          signal: controller.signal,
        });
        const data = await res.json();
        if (isMounted) {
          if (data.latitude && data.longitude) {
            dispatch(
              setUserLocation({
                lat: data.latitude,
                lng: data.longitude,
                city: data.city,
                state: data.region,
              })
            );
            dispatch(setLocationStatus("granted"));
          } else {
            dispatch(setLocationStatus("denied"));
          }
        }
      } catch (error) {
        if (isMounted && error.name !== "AbortError") {
          dispatch(setLocationStatus("denied"));
        }
      }
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [dispatch]);

  // If we have a persisted session, don't show the blocking loading screen
  const [loading, setLoading] = useState(true);

  // Background Prefetching for Reels
  useEffect(() => {
    if (authState.isLoggedIn && !loading) {
      // Idle prefetch: Load the reels feed data in the background after auth is ready
      // 3s delay ensures we don't compete with the Home page's critical data
      const idleTimer = setTimeout(() => {
        dispatch(
          reelsApi.util.prefetch("getReelsFeed", undefined, { force: false })
        );
      }, 3000);
      return () => clearTimeout(idleTimer);
    }
  }, [authState.isLoggedIn, loading, dispatch]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const authTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn(
          "App.jsx: Auth initialization timed out (5s). Forcing UI render."
        );
        setLoading(false);
      }
    }, 5000);

    const controller = new AbortController();
    const initAuth = async () => {
      console.log("App.jsx: Starting auth check...");
      try {
        const [meResponse, networkResponse] = await Promise.all([
          axiosInstance.get("/api/user/auth/getMe", {
            signal: controller.signal,
          }),
          axiosInstance
            .get("/api/user/players/network", { signal: controller.signal })
            .catch(() => ({ data: { success: false } })),
        ]);

        if (isMounted && meResponse.data.success) {
          dispatch(
            restoreAuth({
              user: meResponse.data.user,
              role: meResponse.data.role,
              token: meResponse.data.token,
              followingIds: networkResponse.data.success
                ? (networkResponse.data.following || [])
                    .filter((u) => u)
                    .map((u) => u.id || u._id)
                : [],
            })
          );
        }
      } catch (error) {
        if (isMounted) {
          if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
          ) {
            if (authState.isLoggedIn) {
              dispatch(logout());
            }
          }
        }
      } finally {
        if (isMounted) {
          clearTimeout(authTimeout);
          setLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      controller.abort();
    };
  }, [dispatch]);

  useEffect(() => {
    const handleFocus = () => {
      if (authState.isLoggedIn) {
        const now = Date.now();
        if (now - lastAuthCheckTime.current < 5 * 60 * 1000) {
          return; // Skip background check if done in the last 5 minutes
        }
        lastAuthCheckTime.current = now;
        axiosInstance
          .get("/api/user/auth/getMe")
          .then((res) => {
            if (res.data.success) {
              dispatch(
                restoreAuth({
                  user: res.data.user,
                  role: res.data.role,
                  token: res.data.token,
                  followingIds: authState.followingIds,
                })
              );
            }
          })
          .catch((err) => {
            console.warn(
              "App.jsx: Background auth check on focus failed.",
              err.message
            );
          });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [authState.isLoggedIn, authState.followingIds, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans">
        <div className="relative flex flex-col items-center gap-4 animate-fade-in">
          <img
            src="/logo1.png"
            alt="Kridaz"
            className="h-16 w-auto object-contain animate-pulse"
          />
          <div className="w-8 h-8 border-2 border-[#BFF367] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <RootErrorBoundary>
      <ObservabilityProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <SocketProvider>
            <RouterProvider router={router} />
            <Toaster
              position="top-center"
              containerStyle={{ top: 50 }}
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#18181b",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                },
              }}
            />
            {locationSidebarOpen && (
              <Suspense fallback={null}>
                <LocationSidebar />
              </Suspense>
            )}
          </SocketProvider>
        </GoogleOAuthProvider>
      </ObservabilityProvider>
    </RootErrorBoundary>
  );
}
