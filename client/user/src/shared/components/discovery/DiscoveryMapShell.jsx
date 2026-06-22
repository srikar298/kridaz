import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Map as MapIcon, Maximize2 } from "lucide-react";import { Button } from "@kridaz/ui";


const DiscoveryMapShell = ({
  children,
  isExpanded,
  onToggle,
  height = "35vh",
}) => {
  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? "55vh" : "32vh" }}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className="relative w-full overflow-hidden bg-background border-b border-white/10"
    >
      {/* Map Content Container */}
      <div className="absolute inset-0 w-full h-full">{children}</div>

      {/* Glossy Overlay UI */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] p-2 px-3 flex items-center gap-2 shadow-2xl">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            Live Discovery
          </span>
        </div>
      </div>

      {/* Control Bar - Bottom Handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-center cursor-pointer z-[1000] group"
        onClick={onToggle}
      >
        {/* Shadow Overlay for depth */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none opacity-80" />

        {/* The Handle Tab */}
        <div className="relative flex flex-col items-center gap-0.5 pb-2 transition-transform duration-300 group-hover:scale-110">
          <div className="w-12 h-1 bg-white/20 rounded-full mb-1 group-hover:bg-primary/40 transition-colors" />
          <div className="flex items-center gap-1.5 px-4 py-1 bg-black/80 backdrop-blur-md rounded-[6px] border border-white/10 shadow-lg">
            {isExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                <span className="text-[9px] font-bold text-white uppercase tracking-tighter">
                  Collapse Map
                </span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 text-primary" />
                <span className="text-[9px] font-bold text-white uppercase tracking-tighter">
                  Fullscreen View
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Corner Action - Layer Toggle Placeholder */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button className="w-10 h-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[8px] flex items-center justify-center text-white hover:text-primary transition-colors shadow-2xl">
          <MapIcon className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default DiscoveryMapShell;
