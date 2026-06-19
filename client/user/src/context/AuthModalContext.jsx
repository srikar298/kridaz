import React, { createContext, useContext, useState } from "react";

const AuthModalContext = createContext();

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialView, setInitialView] = useState("login"); // 'login' or 'signup'

  const openAuthModal = (view = "login") => {
    setInitialView(view);
    setIsOpen(true);
  };

  const closeAuthModal = () => {
    setIsOpen(false);
  };

  const toggleView = () => {
    setInitialView((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        initialView,
        openAuthModal,
        closeAuthModal,
        toggleView,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
