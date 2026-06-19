import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ProfessionalSidebar from "@components/layout/ProfessionalSidebar";
import { AuthenticatedNavbar } from "@components/layout";
import ProfessionalBottomNav from "@components/layout/ProfessionalBottomNav";

const ProfessionalLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const isMinimized = !isHovered;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <AuthenticatedNavbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 pt-32 lg:pt-40 min-w-0 w-full">
        <div
          onMouseEnter={() => window.innerWidth >= 1024 && setIsHovered(true)}
          onMouseLeave={() => window.innerWidth >= 1024 && setIsHovered(false)}
          className="z-50"
        >
          <ProfessionalSidebar
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
            isMinimized={isMinimized}
            className={`${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          />
        </div>
        <main
          className={`flex-1 min-w-0 overflow-x-clip transition-all duration-300 ease-in-out ${isMinimized ? "lg:ml-20" : "lg:ml-64"}`}
        >
          <div className="w-full p-4 pb-24 lg:pb-10">
            <Outlet />
          </div>
        </main>
      </div>
      <ProfessionalBottomNav />
    </div>
  );
};

export default ProfessionalLayout;
