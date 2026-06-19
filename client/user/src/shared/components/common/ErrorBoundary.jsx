import React from "react";
import { useRouteError, Link } from "react-router-dom";

const ErrorBoundary = () => {
  const error = useRouteError();
  console.error("Router Error:", error);

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 bg-[#0A0A0A] border border-white/5 p-10 rounded-[8px]">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-[#BFF367] uppercase tracking-tighter">
            ERROR
          </h1>
          <p className="text-xl font-bold text-white uppercase tracking-tight">
            System Malfunction Detected
          </p>

          {isDev ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[8px]">
              <p className="text-red-400 text-xs font-mono break-all text-left overflow-auto max-h-64">
                {error?.stack ||
                  error?.message ||
                  error?.statusText ||
                  JSON.stringify(error) ||
                  "An unexpected error occurred within the portal telemetry."}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-[8px]">
              <p className="text-zinc-400 text-sm">
                We've encountered an unexpected issue while processing your
                request. Our engineering team has been notified.
              </p>
            </div>
          )}
        </div>

        <div className="pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#BFF367] text-black font-bold uppercase text-xs tracking-widest rounded-[8px] hover:scale-[0.98] transition-all"
            onClick={() => (window.location.href = "/")}
          >
            Re-Initialize System
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;
