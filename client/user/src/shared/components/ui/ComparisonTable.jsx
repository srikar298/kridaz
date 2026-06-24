import React from "react";
import {
  MapPin,
  Activity,
  MessageSquare,
  Video,
  MonitorPlay,
} from "lucide-react";
import { BentoItem } from "./bento-item";

const StadiumIcon = ({ size = 24, className }) => {
  const adjustedSize = size + 4;
  return (
    <svg width={adjustedSize} height={adjustedSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 7V3L7 5L3 7ZM18 7V3L22 5L18 7ZM11 6V2L15 4L11 6ZM11 22C9.73333 21.9667 8.55433 21.8627 7.463 21.688C6.37167 21.5133 5.42167 21.2923 4.613 21.025C3.80433 20.7577 3.16667 20.4493 2.7 20.1C2.23333 19.7507 2 19.384 2 19V10C2 9.58333 2.26267 9.196 2.788 8.838C3.31333 8.48 4.02567 8.16333 4.925 7.888C5.82433 7.61267 6.88267 7.396 8.1 7.238C9.31733 7.08 10.6173 7.00067 12 7C13.3827 6.99933 14.6827 7.07867 15.9 7.238C17.1173 7.39733 18.1757 7.614 19.075 7.888C19.9743 8.162 20.687 8.47867 21.213 8.838C21.739 9.19733 22.0013 9.58467 22 10V19C22 19.3833 21.7667 19.75 21.3 20.1C20.8333 20.45 20.196 20.7583 19.388 21.025C18.58 21.2917 17.63 21.5127 16.538 21.688C15.446 21.8633 14.2667 21.9673 13 22V18H11V22ZM12 11C13.6167 11 15.0127 10.904 16.188 10.712C17.3633 10.52 18.3007 10.2993 19 10.05C19 9.96667 18.3667 9.771 17.1 9.463C15.8333 9.155 14.1333 9.00067 12 9C9.86667 8.99933 8.16667 9.15367 6.9 9.463C5.63333 9.77233 5 9.968 5 10.05C5.7 10.3 6.63733 10.521 7.812 10.713C8.98667 10.905 10.3827 11.0007 12 11ZM9 19.85V16H15V19.85C16.3333 19.7167 17.425 19.521 18.275 19.263C19.125 19.005 19.7 18.7757 20 18.575V11.8C19.0833 12.1667 17.9333 12.4583 16.55 12.675C15.1667 12.8917 13.65 13 12 13C10.35 13 8.83333 12.8917 7.45 12.675C6.06667 12.4583 4.91667 12.1667 4 11.8V18.575C4.3 18.775 4.875 19.0043 5.725 19.263C6.575 19.5217 7.66667 19.7173 9 19.85Z" fill="currentColor"/>
    </svg>
  );
};

const ComparisonTable = () => {
  return (
    <section className="relative w-full max-w-[1000px] mx-auto px-4 md:px-6 pb-4">
      {/* Header */}
      <div className="mb-6 md:mb-8 w-full text-left">
        <h2 className="text-[36px] font-medium tracking-tight leading-[1.05] font-poppins normal-case text-white">
          One app. <span className="text-primary">Everything you need</span>
        </h2>
      </div>

      {/* 5-Card Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1: Spans 2 columns on desktop */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 md:col-span-2 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-primary/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <StadiumIcon className="text-primary w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
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
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-primary/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <Activity className="text-primary w-6 h-6 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Live Game Scoring
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Track matches with professional-grade live scoring tools.
            </p>
          </div>
        </BentoItem>

        {/* Card 3: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-primary/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <MessageSquare className="text-primary w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Community Feed
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Share moments, highlights, and interact with sports enthusiasts.
            </p>
          </div>
        </BentoItem>

        {/* Card 4: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-primary/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <Video className="text-primary w-6 h-6 mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
            <h3 className="text-base font-bold text-white mb-1 font-poppins">
              Live Streams
            </h3>
            <p className="text-white/70 text-xs leading-relaxed">
              Broadcast your matches live to friends and fans in real-time.
            </p>
          </div>
        </BentoItem>

        {/* Card 5: 1 column */}
        <BentoItem className="fluid-glass rounded-2xl p-5 md:p-6 flex flex-col justify-end min-h-[140px] md:min-h-[160px] border border-white/10 hover:border-primary/50 hover:shadow-[0_10px_30px_-10px_rgba(191,243,103,0.15)] group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-500" />
          <div
            className="relative z-10 pointer-events-none"
            style={{ transform: "translateZ(30px)" }}
          >
            <MonitorPlay className="text-primary w-6 h-6 mb-3 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300" />
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
