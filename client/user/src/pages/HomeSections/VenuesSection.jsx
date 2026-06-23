import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TurfCardMobile, VenueCard } from "../../features/turf";

const BDR = "#2A2A2A";

export default function VenuesSection({
  userLocation,
  loading,
  turfLoading,
  error,
  displayTurfs,
  setTurfFilters,
}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTurfForPopup, setSelectedTurfForPopup] = useState(null);

  useEffect(() => {
    let interval;
    if (!isHovered) {
      interval = setInterval(() => {
        // Only auto-slide on desktop (min-width: 768px)
        if (window.innerWidth >= 768 && scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

          // If we reached the end, loop back to the start. Otherwise, scroll right by roughly one card width.
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            const cardWidth = scrollRef.current.children[0]?.clientWidth || 396;
            scrollRef.current.scrollBy({
              left: cardWidth + 16,
              behavior: "smooth",
            });
          }
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isHovered]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="pt-[15px] mb-8 w-full">
      <div className="mb-6">
        <h2
          className="text-[14px] font-black text-white tracking-tighter leading-none text-left"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          Featured <span className="text-[#BFF367]">Venues</span>
        </h2>
      </div>

      {/* Venue scroll — 1.8 cards on mobile */}
      {loading || turfLoading ? (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[85vw] md:w-[400px] shrink-0 snap-center rounded-[12px] border animate-pulse"
              style={{ height: 320, backgroundColor: "#111", borderColor: BDR }}
            />
          ))}
        </div>
      ) : error || displayTurfs.length === 0 ? (
        <div className="text-center py-12 animate-fadeIn">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={20} className="text-gray-600" />
          </div>
          <p
            className="text-lg mb-1 uppercase tracking-tighter font-black"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Venues Not Found
          </p>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="relative group/scroll">
          {/* Universal Horizontal Scroll View */}
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4 pr-4 scroll-smooth"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {displayTurfs.slice(0, 10).map((t) => (
                <div
                  key={t._id}
                  className="w-[65%] shrink-0 snap-start aspect-[1080/1350]"
                >
                  <VenueCard t={t} onClick={() => setSelectedTurfForPopup(t)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup for Venue Details */}
      <AnimatePresence>
        {selectedTurfForPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedTurfForPopup(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[400px] max-h-[90vh] overflow-y-auto rounded-[24px] no-scrollbar shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 left-4 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-colors border border-white/20"
                onClick={() => setSelectedTurfForPopup(null)}
              >
                <X size={18} />
              </button>

              <TurfCardMobile turf={selectedTurfForPopup} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
