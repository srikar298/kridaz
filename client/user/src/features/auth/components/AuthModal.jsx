import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuthModal } from "../../../context/AuthModalContext";
import Login from "../pages/Login";
import SignUp from "../pages/SignUp";import { Button } from "@kridaz/ui";


const AuthModal = () => {
  const { isOpen, closeAuthModal, initialView, toggleView } = useAuthModal();
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true); // True initially for mount animation

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Trigger slide up after initial mount
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 10);

      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      closeAuthModal();
    }, 500); // wait for slower animation
  };

  if (!isOpen) return null;

  const showHiddenState = isAnimating || isClosing;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-md transition-opacity duration-500 ease-in-out ${showHiddenState ? "opacity-0" : "opacity-100"}`}
    >
      {/* Modal Container */}
      <div
        className={`relative w-full max-w-[956px] h-[100dvh] sm:h-[821px] sm:max-h-[95vh] bg-background rounded-none sm:rounded-2xl overflow-hidden flex shadow-2xl sm:border border-white/10 transition-all duration-500 ease-in-out transform ${showHiddenState ? "translate-y-full opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100"}`}
      >
        {/* Close Button */}
        <Button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </Button>

        {/* Left Side: Image Holder */}
        <div className="hidden md:block w-1/2 relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img
            src="/scoring_bg.png"
            alt="Auth Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-10 left-10 z-20 space-y-2">
            <h3 className="text-3xl font-bold text-white">Join Kridaz</h3>
            <p className="text-white/70">
              Connect, play, and track your sports journey.
            </p>
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full md:w-1/2 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex flex-col justify-center py-10 px-2 min-h-0">
            {initialView === "login" ? (
              <Login isModal={true} />
            ) : (
              <SignUp isModal={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
