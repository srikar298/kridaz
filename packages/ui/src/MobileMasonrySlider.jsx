import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const MobileMasonrySlider = ({ items }) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += 3) {
    chunks.push(items.slice(i, i + 3));
  }

  const [active, setActive] = useState(0);
  const [selectedImg, setSelectedImg] = useState(null);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActive(index);
  };

  const scrollTo = (index) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: index * scrollRef.current.offsetWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full"
      >
        {chunks.map((chunk, i) => (
          <div
            key={i}
            className="w-full shrink-0 snap-center px-4 grid grid-cols-2 gap-2 h-[400px]"
          >
            {chunk[0] && (
              <div
                className="col-span-2 rounded-2xl overflow-hidden h-[200px] bg-[#111] border border-white/10"
                onClick={() => setSelectedImg(chunk[0].img)}
              >
                <img
                  src={chunk[0].img}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            )}
            {chunk[1] && (
              <div
                className="rounded-2xl overflow-hidden h-[192px] bg-[#111] border border-white/10"
                onClick={() => setSelectedImg(chunk[1].img)}
              >
                <img
                  src={chunk[1].img}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            )}
            {chunk[2] && (
              <div
                className="rounded-2xl overflow-hidden h-[192px] bg-[#111] border border-white/10"
                onClick={() => setSelectedImg(chunk[2].img)}
              >
                <img
                  src={chunk[2].img}
                  className="w-full h-full object-cover opacity-80"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Number Slider Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4 px-4 overflow-x-auto no-scrollbar">
        {chunks.map((_, i) => {
          const isActive = active === i;
          return (
            <motion.button
              key={i}
              layout
              onClick={() => scrollTo(i)}
              initial={false}
              animate={{
                backgroundColor: isActive
                  ? "#2A2A2A"
                  : "rgba(255, 255, 255, 0.2)",
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className={`flex items-center justify-center shrink-0 overflow-hidden ${
                isActive
                  ? "px-3 py-1 rounded-full shadow-lg"
                  : "w-1.5 h-1.5 rounded-full hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              <AnimatePresence mode="popLayout">
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="text-white text-xs font-medium tracking-widest whitespace-nowrap"
                  >
                    {i + 1}/{chunks.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Popup Modal */}
      {selectedImg &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-zoom-out"
            onClick={() => setSelectedImg(null)}
          >
            <img
              src={selectedImg}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              onClick={() => setSelectedImg(null)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MobileMasonrySlider;
