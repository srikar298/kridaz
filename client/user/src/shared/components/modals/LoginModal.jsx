import React from "react";
import { X, LogIn, UserPlus, ShieldCheck, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const LoginModal = ({
  isOpen,
  onClose,
  title = "Login Required",
  message = "Please log in to continue with this action.",
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    navigate("/login");
  };

  const handleSignUp = () => {
    onClose();
    navigate("/signup");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-background border border-border rounded-[8px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[64px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-[64px] translate-y-1/2 -translate-x-1/2" />

        {/* Close Button */}
        <Button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-[8px] bg-background border border-border text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
        >
          <X size={18} />
        </Button>

        <div className="p-8 pt-12 text-center relative z-0">
          {/* Icon Header */}
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-[8px] bg-primary/10 border border-primary/20 relative">
            <ShieldCheck size={32} className="text-primary" />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 uppercase tracking-tight">
            {title}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
            {message}
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-background border border-border text-left">
              <Zap size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                Fast Booking
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-[8px] bg-background border border-border text-left">
              <Star size={14} className="text-primary" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                Pro Features
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-[#33B5C0] text-black font-black py-4 rounded-[8px] transition-all shadow-[0_8px_24px_-8px_rgba(85,222,232,0.5)] active:scale-95 group"
            >
              <LogIn
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
              <span className="uppercase tracking-widest text-sm">
                Sign In to Continue
              </span>
            </Button>

            <Button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center gap-3 bg-background hover:bg-white/10 border border-border text-white font-bold py-4 rounded-[8px] transition-all active:scale-95"
            >
              <UserPlus size={18} className="text-primary" />
              <span className="uppercase tracking-widest text-sm text-gray-300">
                Create New Account
              </span>
            </Button>
          </div>

          <p className="mt-8 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
            Secure Authentication by Kridaz
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
