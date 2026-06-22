import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";import { Button } from "@kridaz/ui";


const GlobalBackButton = ({ className = "" }) => {
  const navigate = useNavigate();
  return (
    <Button
      onClick={() => navigate(-1)}
      className={`flex items-center justify-center w-10 h-10 ml-4 md:ml-0 rounded-full bg-white/10 border border-white/5 hover:bg-white/20 transition-colors text-white shrink-0 ${className}`}
    >
      <ChevronLeft className="w-6 h-6 pr-0.5" />
    </Button>
  );
};

export default GlobalBackButton;
