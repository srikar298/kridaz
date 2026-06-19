import React from "react";
import {
  MapPin,
  Activity,
  MessageSquare,
  Video,
  MonitorPlay,
} from "lucide-react";
import { BentoItem } from "./bento-item";

const ComparisonTable = () => {
  return (
    <section className="relative w-full max-w-[1000px] mx-auto px-4 md:px-6 pb-4">
      {/* Header */}
      <div className="mb-6 md:mb-8 w-full text-left">
        <h2 className="text-[36px] font-medium tracking-tight leading-[1.05] font-poppins normal-case text-white">
          One app. <span className="text-[#BFF367]">Everything you need</span>
        </h2>
      </div>

      {/* 5-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1: Spans 2 columns on desktop */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 md:col-span-2 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-[#BFF367]/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#BFF367]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#BFF367]/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <MapPin className="text-[#BFF367] w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            <h3 className="text-lg font-bold text-white mb-1 font-poppins">
              Venue & Ground Booking
            </h3>
            <p className="text-white/70 text-xs max-w-xs leading-relaxed">
              Find, compare, and book premium sports venues near you instantly
              with real-time availability.
            </p>
          </div>
        </BentoItem>

        {/* Card 2: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-[#BFF367]/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#BFF367]/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <Activity className="text-[#BFF367] w-6 h-6 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Live Game Scoring
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Track matches with professional-grade live scoring tools.
            </p>
          </div>
        </BentoItem>

        {/* Card 3: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-[#BFF367]/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#BFF367]/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <MessageSquare className="text-[#BFF367] w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Community Feed
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Share moments, highlights, and interact with sports enthusiasts.
            </p>
          </div>
        </BentoItem>

        {/* Card 4: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-[#BFF367]/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#BFF367]/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <Video className="text-[#BFF367] w-6 h-6 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Live Streams
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Broadcast your matches live to friends and fans in real-time.
            </p>
          </div>
        </BentoItem>

        {/* Card 5: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-[#BFF367]/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-[#BFF367]/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <MonitorPlay className="text-[#BFF367] w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Scoring Tickers
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Overlay professional cricket scoring tickers directly onto your
              live streams.
            </p>
          </div>
        </BentoItem>
      </div>
    </section>
  );
};

export default ComparisonTable;
