import React from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" className="mr-3">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

import { Capacitor } from "@capacitor/core";
import { Button } from "@kridaz/ui";


const GoogleAuthButton = ({
  onSuccess,
  onError,
  mode = "signin",
  isLoading = false,
}) => {
  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: (tokenResponse) => {
      onSuccess(tokenResponse);
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      if (onError) onError();
    },
  });

  // Google does not allow web-based OAuth inside WebViews (Capacitor mobile container).
  // Hide it on Android/iOS native to prevent disallowed useragent error.
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={() => login()}
      disabled={isLoading}
      className="group relative w-full flex items-center justify-center h-11 px-6 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/40 rounded-[8px] transition-all duration-500 active:scale-[0.98] overflow-hidden shadow-xl hover:shadow-[var(--primary)]/5"
    >
      {/* SHIMMER EFFECT */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />

      {/* GLOW EFFECT */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <div className="relative flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <>
            <GoogleIcon />
            <span className="text-xs sm:text-[13px] font-bold text-white tracking-wide uppercase whitespace-nowrap">
              {mode === "signup"
                ? "Continue with Google"
                : "Continue with Google"}
            </span>
          </>
        )}
      </div>

      {/* INNER SHINE */}
      <div className="absolute inset-0 rounded-[8px] border border-white/5 pointer-events-none" />
    </Button>
  );
};

export default GoogleAuthButton;
