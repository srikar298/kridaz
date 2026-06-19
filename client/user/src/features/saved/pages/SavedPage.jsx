import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MapPin, Gamepad2, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetSavedTurfsQuery } from "@redux/api/turfApi";
import TurfCardMobile from "../../turf/components/TurfCardMobile";
import TurfCardSkeleton from "@components/ui/TurfCardSkeleton";

const SavedPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("venues"); // 'venues', 'games', 'posts'
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const { data, isLoading } = useGetSavedTurfsQuery(undefined, {
    skip: !isLoggedIn || activeTab !== "venues",
  });
  const savedTurfs = data?.turfs || [];

  const tabs = [
    { id: "venues", label: "Venues", icon: MapPin },
    { id: "games", label: "Games", icon: Gamepad2 },
  ];

  const renderEmptyState = (type) => {
    let message = "";
    let icon = null;

    switch (type) {
      case "venues":
        message =
          "You have not saved any venues yet. Explore and save your favorite turfs!";
        icon = <MapPin className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />;
        break;
      case "games":
        message =
          "No saved games. Find games you are interested in and save them for later.";
        icon = <Gamepad2 className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />;
        break;
      default:
        break;
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-zinc-800 rounded-[12px] bg-[#121212]/50 border-dashed">
        {icon}
        <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
          No saved {type}
        </h3>
        <p className="text-zinc-500 max-w-sm mx-auto text-sm">{message}</p>
        <button
          onClick={() => navigate("/venues")}
          className="mt-6 px-6 py-2.5 rounded-full bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
        >
          Explore Now
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-zinc-800 rounded-[12px] bg-[#121212]/50 border-dashed">
          <Bookmark className="w-16 h-16 text-zinc-700 mb-4 mx-auto" />
          <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
            Please Log In
          </h3>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm">
            You must be logged in to view your personal saved items.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 px-8 py-3 rounded-full bg-[#BFF367] text-black font-bold hover:brightness-110 transition-all uppercase tracking-wider text-xs"
          >
            Log In Now
          </button>
        </div>
      );
    }

    if (activeTab === "venues") {
      if (isLoading) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <TurfCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        );
      }

      if (savedTurfs.length > 0) {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {savedTurfs.map((turf, idx) => (
              <motion.div
                key={turf.id || turf._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <TurfCardMobile turf={turf} />
              </motion.div>
            ))}
          </div>
        );
      }

      return renderEmptyState("venues");
    }

    // Default fallbacks for currently un-implemented tabs
    return renderEmptyState(activeTab);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-inter">
      {/* Header section */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
          <div className="mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-[#BFF367]" />
                Saved Items
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium tracking-wide uppercase mt-1">
                Your personal collection
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 sm:gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-none flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide uppercase transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black shadow-[0_0_15px_rgba(191,243,103,0.3)]"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SavedPage;
