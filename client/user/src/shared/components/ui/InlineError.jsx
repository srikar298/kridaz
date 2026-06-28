import React from "react";
import { AlertCircle } from "lucide-react";

export const InlineError = ({ message, className = "" }) => {
  if (!message) return null;
  
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 text-red-500/90 text-[11px] font-medium animate-in fade-in slide-in-from-top-1 ${className}`}>
      <AlertCircle size={12} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default InlineError;
