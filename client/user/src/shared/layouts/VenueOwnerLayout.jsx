import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { VenueOwnerSidebar, AuthenticatedNavbar } from "@components/layout";
import ScrollToTop from "@components/common/ScrollToTop";
import VenueOwnerBottomNav from "../components/layout/VenueOwnerBottomNav";
import RootErrorBoundary from "@components/common/RootErrorBoundary";

const PartnerLayout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toggleSidebar = () => setIsOpen(!isOpen);

  const isMinimized = !isHovered;

  return (
    <div className="flex flex-col min-h-screen bg-black partner-panel">
      <ScrollToTop />
      <AuthenticatedNavbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 pt-16 lg:pt-20">
        <div
          onMouseEnter={() => window.innerWidth >= 1024 && setIsHovered(true)}
          onMouseLeave={() => window.innerWidth >= 1024 && setIsHovered(false)}
          className="z-50"
        >
          <VenueOwnerSidebar
            isOpen={isOpen}
            toggleSidebar={toggleSidebar}
            isMinimized={isMinimized}
            className={`${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
          />
        </div>
        <main
          className={`flex-1 min-w-0 overflow-x-clip transition-all duration-300 ease-in-out ${isMinimized ? "lg:ml-20" : "lg:ml-64"}`}
        >
          <div className="w-full pt-6 px-4 pb-[80px] lg:pt-8 lg:px-8 lg:pb-10">
            <RootErrorBoundary>
              <Outlet />
            </RootErrorBoundary>
          </div>
        </main>
      </div>
      <VenueOwnerBottomNav />
    </div>
  );
};

export default PartnerLayout;
