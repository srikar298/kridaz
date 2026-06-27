import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { Button } from "@kridaz/ui";


const BDR = "var(--border)";

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
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const containerWidth = scrollRef.current.clientWidth;
    
    let closestIndex = 0;
    let minDiff = Infinity;
    
    Array.from(scrollRef.current.children).forEach((child, index) => {
      // Calculate distance from center of child to center of container
      const childCenter = child.offsetLeft + child.clientWidth / 2 - scrollRef.current.offsetLeft;
      const scrollCenter = scrollLeft + containerWidth / 2;
      const diff = Math.abs(childCenter - scrollCenter);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    
    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex);
    }
  }, [activeIndex]);

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
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="w-full">
      <div className="mb-4">
        <h2
          className="text-[14px] font-black text-white tracking-tighter leading-none text-left"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          Featured <span className="text-primary">Venues</span>
        </h2>
      </div>

      {/* Venue scroll — 1.8 cards on mobile */}
      {loading || turfLoading ? (
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-[65%] shrink-0 snap-start rounded-[12px] border animate-pulse aspect-[1080/1350]"
              style={{ backgroundColor: "#111", borderColor: BDR }}
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
              className="flex items-center gap-[6px] overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 px-[calc(50%-130px)] scroll-smooth min-h-[380px]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onScroll={handleScroll}
            >
              {displayTurfs.slice(0, 10).map((t, idx) => (
                <div
                  key={t._id}
                  className={`shrink-0 snap-center w-[260px] h-[360px] flex justify-center items-center relative transition-all duration-300 ${idx === activeIndex ? 'z-10' : 'z-0'}`}
                >
                  <VenueCard 
                    t={t} 
                    onClick={() => setSelectedTurfForPopup(t)} 
                    isActive={idx === activeIndex}
                  />
                </div>
              ))}
            </div>
            
            {/* Carousel Dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {displayTurfs.slice(0, 10).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-full transition-all duration-300 ${idx === activeIndex ? "w-[18px] h-1.5 bg-white" : "w-1.5 h-1.5 bg-[#434242]"}`}
                ></div>
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
              <Button
                className="absolute top-4 left-4 z-50 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition-colors border border-white/20"
                onClick={() => setSelectedTurfForPopup(null)}
              >
                <X size={18} />
              </Button>

              <TurfCardMobile turf={selectedTurfForPopup} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
