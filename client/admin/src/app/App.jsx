import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import router from "./router";
import { logout, restoreAuth } from "../redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@context/SocketContext";

export default function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.current);
  const authState = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const response = await axiosInstance.get("/api/user/auth/getMe");
        if (isMounted && response.data.success) {
          // Explicit check: only allow platform ADMIN roles to authenticate in the Admin Console
          if (response.data.role?.toUpperCase() === "ADMIN") {
            dispatch(
              restoreAuth({
                user: response.data.user,
                role: response.data.role,
                token: response.data.token,
              })
            );
          } else {
            // Reject any standard user session
            dispatch(logout());
          }
        }
      } catch (error) {
        if (isMounted && authState.isLoggedIn) {
          dispatch(logout());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-primary">
        <div className="text-xl font-bold tracking-widest uppercase animate-pulse">
          Initializing Staff Console...
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />
    </SocketProvider>
  );
}
