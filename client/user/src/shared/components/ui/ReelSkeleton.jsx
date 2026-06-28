import React from "react";

const ReelSkeleton = () => {
  return (
    <div className="w-[180px] md:w-[210px] aspect-[9/16] shrink-0 bg-[#0a0a0a] border border-white/5 rounded-[12px] overflow-hidden snap-start relative animate-pulse flex flex-col justify-end p-3">
      {/* Play Button Skeleton */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/[0.05]"></div>

      {/* Views Pill Skeleton */}
      <div className="w-16 h-6 rounded-full bg-white/[0.05] mt-auto"></div>
    </div>
  );
};

export default ReelSkeleton;
