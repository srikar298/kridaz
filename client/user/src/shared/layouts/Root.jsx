import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Navbar from "@components/layout/Navbar";
import MobileBottomNav from "@components/layout/MobileBottomNav";
import UserFooter from "@components/layout/UserFooter";
import ScrollToTop from "@components/common/ScrollToTop";
import BackgroundUploadManager from "@components/BackgroundUploadManager";
// Desktop Right Sidebar removed — content moved to Home feed
import { useAuthModal } from "../../context/AuthModalContext";

const OnboardingModal = lazy(
  () => import("@components/modals/OnboardingModal")
);
const AuthModal = lazy(
  () => import("../../features/auth/components/AuthModal")
);
const LandingPage = lazy(() => import("../../pages/LandingPage"));

const Root = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isOpen: isAuthModalOpen } = useAuthModal();
  const { user, isAuthenticated } = useSelector(
    (/** @type {any} */ state) => state.auth
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const iframeRef = useRef(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const listener = (e) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    // Show onboarding for regular users who have not completed onboarding
    if (isAuthenticated && user?.role?.toLowerCase() === "user") {
      if (user.isOnboarded === false || !user.isOnboarded) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleParentPopState = () => {
      if (iframeRef.current) {
        try {
          const iframeWindow = iframeRef.current.contentWindow;
          if (
            iframeWindow.location.pathname !== window.location.pathname ||
            iframeWindow.location.search !== window.location.search
          ) {
            iframeRef.current.src =
              window.location.pathname + window.location.search;
          }
        } catch (err) {
          iframeRef.current.src =
            window.location.pathname + window.location.search;
        }
      }
    };
    window.addEventListener("popstate", handleParentPopState);
    return () => window.removeEventListener("popstate", handleParentPopState);
  }, []);

  useEffect(() => {
    if (window.self !== window.top) {
      document.documentElement.classList.add("no-scrollbar");
      document.body.classList.add("no-scrollbar");
    }
  }, []);

  const handleIframeLoad = (e) => {
    try {
      const iframeWindow = e.target.contentWindow;
      const iframePath = iframeWindow.location.pathname;
      const iframeSearch = iframeWindow.location.search;
      if (
        window.location.pathname !== iframePath ||
        window.location.search !== iframeSearch
      ) {
        window.history.replaceState(null, "", iframePath + iframeSearch);
      }

      const handleIframeNav = () => {
        const currentPath = iframeWindow.location.pathname;
        const currentSearch = iframeWindow.location.search;
        if (
          window.location.pathname !== currentPath ||
          window.location.search !== currentSearch
        ) {
          window.history.replaceState(null, "", currentPath + currentSearch);
        }
      };

      iframeWindow.addEventListener("popstate", handleIframeNav);

      const originalPush = iframeWindow.history.pushState;
      iframeWindow.history.pushState = function (...args) {
        originalPush.apply(iframeWindow.history, args);
        handleIframeNav();
      };

      const originalReplace = iframeWindow.history.replaceState;
      iframeWindow.history.replaceState = function (...args) {
        originalReplace.apply(iframeWindow.history, args);
        handleIframeNav();
      };
    } catch (err) {
      console.warn("Iframe same-origin check failed:", err);
    }
  };

  const isSidebarCollapsed = useSelector(
    (/** @type {any} */ state) => state.ui.isSidebarCollapsed
  );

  const searchParams = new URLSearchParams(location.search);
  const isReelsPage =
    location.pathname.startsWith("/reels") ||
    location.pathname.startsWith("/shorts") ||
    searchParams.get("tab") === "shots";
  const isNewPostPage =
    location.pathname.startsWith("/new-post") ||
    location.pathname.startsWith("/create-post") ||
    location.pathname.startsWith("/create-story");
  const isTournamentWizard = location.pathname.startsWith("/tournament/create");
  const isTeamsPage = location.pathname.startsWith("/my-teams");
  const isMessagesPage = location.pathname.startsWith("/messages");
  const isChatOpen = isMessagesPage && searchParams.get("chatId") !== null;
  const isProfile = location.pathname.startsWith("/profile");
  const isBookingHistory = location.pathname.startsWith("/booking-history");
  const hideNav =
    isReelsPage || isNewPostPage || isTournamentWizard || isChatOpen;
  const isHome =
    location.pathname === "/" || location.pathname === "/community";
  const isSingleVenue = location.pathname.startsWith("/venue/");
  const isVenue =
    (location.pathname.startsWith("/venue") ||
      location.pathname === "/venues") &&
    !isSingleVenue;
  const isPlayer = location.pathname.startsWith("/players");
  const isProfessional = location.pathname.startsWith("/professionals");
  const isJoinGames = location.pathname.startsWith("/join-games");
  const isUploadReel =
    location.pathname.startsWith("/reels/upload") ||
    location.pathname.startsWith("/shorts/upload");
  const useRestrictedWidth =
    isHome ||
    isVenue ||
    isUploadReel ||
    isTeamsPage ||
    isPlayer ||
    isProfessional ||
    isJoinGames;

  const isLandingPage = location.pathname === "/landing";
  const isInsideIframe = window.self !== window.top;
  const showSplitView = isDesktop && !isLandingPage && !isInsideIframe;

  if (showSplitView) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#050505] text-white">
        {isAuthModalOpen && (
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
        )}
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingModal
              isOpen={showOnboarding}
              onClose={() => setShowOnboarding(false)}
              onComplete={() => setShowOnboarding(false)}
              initialData={{ authMethod: "google", user: user || {} }}
            />
          </Suspense>
        )}
        <ScrollToTop />
        <BackgroundUploadManager />

        {/* Left Side: Mobile View Container */}
        <div className="w-1/2 xl:w-[45%] 2xl:w-[40%] h-full border-r border-white/5 bg-[#050505] relative z-20 flex-shrink-0 flex items-center justify-center p-2 sm:p-4 md:p-4 lg:p-6 xl:p-8 2xl:pl-12 pt-8">
          <div
            className="relative h-full shadow-2xl mx-auto bg-transparent"
            style={{
              maxWidth: "min(650px, 100%)",
              maxHeight: "1250px",
              aspectRatio: "443/913",
              containerType: "inline-size",
              transform: "translateZ(0)",
              isolation: "isolate",
            }}
          >
            {/* "Experience the app live!" Decorative Text */}
            <div className="hidden xl:flex absolute top-1/2 -translate-y-[50%] right-[100%] mr-2 md:mr-6 flex-col items-center pointer-events-none opacity-90 z-50 whitespace-nowrap">
              <div className="font-['Caveat',cursive] text-base md:text-lg font-bold text-center leading-snug tracking-wider -rotate-6">
                <div className="text-[#BFF367]">Experience</div>
                <div className="text-white/90">the app</div>
                <div className="text-[#BFF367]">live!</div>
              </div>
              <svg
                width="35"
                height="35"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-8 mt-1"
              >
                <path
                  d="M5 5 C 15 25, 25 35, 45 40"
                  stroke="#BFF367"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M35 30 L 46 41 L 32 45"
                  stroke="#BFF367"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* The Screen (exactly aligned to the SVG inner hole, adjusted for extra padding) */}
            <div
              className="absolute overflow-hidden bg-[#050505] z-0"
              style={{
                top: "1.5%",
                bottom: "1.5%",
                left: "4.5%",
                right: "4.5%",
                borderRadius: "11cqw",
              }}
            >
              <iframe
                ref={iframeRef}
                src={location.pathname + location.search}
                className="absolute top-0 left-0 border-none bg-[#050505]"
                style={{
                  width: "111.11%",
                  height: "111.11%",
                  transform: "scale(0.9)",
                  transformOrigin: "top left",
                  borderRadius: "12cqw",
                }}
                onLoad={handleIframeLoad}
              />
            </div>

            {/* Detailed Top-Most Frame Overlay */}
            <img
              src="/mobile-frame-top.svg"
              alt="Device Frame Overlay"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none z-50"
            />
          </div>
        </div>

        {/* Right Side: Landing Page (Full height, scrollable) */}
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative z-10 min-w-0">
          <Suspense
            fallback={
              <div className="w-full h-full flex justify-center items-center bg-[#050505]">
                <div className="w-8 h-8 border-4 border-[#BFF367] border-t-transparent rounded-full animate-spin"></div>
              </div>
            }
          >
            <LandingPage />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-clip font-sans">
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>
      )}
      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => {
              setShowOnboarding(false);
            }}
            onComplete={() => {
              setShowOnboarding(false);
            }}
            initialData={{ authMethod: "google", user: user || {} }}
          />
        </Suspense>
      )}
      <ScrollToTop />
      <BackgroundUploadManager />

      {/* Collapsible Left Navigation (Previous Layout Navbar) */}
      {!isReelsPage && !isNewPostPage && <Navbar />}

      <div className="flex flex-1 justify-center w-full relative">
        <div
          className={`flex w-full ${useRestrictedWidth ? "max-w-[700px]" : "max-w-none"} justify-between relative`}
        >
          {/* Main Content Area - Centered alongside the right sidebar on desktop */}
          <main
            className={`flex-grow ${
              isReelsPage || isNewPostPage || isTournamentWizard
                ? "pb-0"
                : isTeamsPage || isMessagesPage
                  ? "pb-0"
                  : "pb-20 lg:pb-28"
            } transition-all duration-300 min-w-0 flex justify-center ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory || isTournamentWizard || location.pathname.startsWith("/search") ? "py-0" : "py-6"}`}
          >
            <div
              className={`w-full ${isNewPostPage || isTeamsPage || isMessagesPage || isProfile || isBookingHistory || isTournamentWizard ? "max-w-none px-0" : "px-0 max-w-none"} flex flex-col justify-between`}
            >
              <div className="min-h-full">
                <Outlet />
              </div>

              {/* Desktop Footer */}
              {!hideNav &&
                location.pathname !== "/community" &&
                !isTeamsPage && (
                  <div className="mt-12 border-t border-white/5 pt-8">
                    <UserFooter />
                  </div>
                )}
            </div>
          </main>
        </div>
      </div>

      {!hideNav && <MobileBottomNav />}
    </div>
  );
};

export default Root;
