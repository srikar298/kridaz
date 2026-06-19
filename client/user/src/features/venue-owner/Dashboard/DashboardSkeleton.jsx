import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="h-full bg-[#000000] px-1 lg:px-3 lg:pt-2 space-y-10 animate-pulse">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[#121212] border border-white/10 rounded-[16px] p-5 h-[140px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 bg-[#1B1B1B] rounded-[16px]"></div>
              <div className="w-12 h-4 bg-[#1B1B1B] rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 bg-[#1B1B1B] rounded"></div>
              <div className="w-24 h-6 bg-[#1B1B1B] rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 h-[400px] bg-[#121212] border border-white/10 rounded-[16px] p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="w-48 h-6 bg-[#1B1B1B] rounded"></div>
              <div className="w-32 h-3 bg-[#1B1B1B] rounded opacity-50"></div>
            </div>
            <div className="w-32 h-10 bg-[#1B1B1B] rounded-[16px]"></div>
          </div>
          <div className="flex-1 h-full bg-[#121212]/50 rounded-[16px] border border-white/10/30"></div>
        </div>

        <div className="lg:col-span-3 h-[400px] bg-[#121212] border border-white/10 rounded-[16px] p-8 space-y-6">
          <div className="space-y-2">
            <div className="w-32 h-6 bg-[#1B1B1B] rounded"></div>
            <div className="w-24 h-3 bg-[#1B1B1B] rounded opacity-50"></div>
          </div>
          <div className="flex flex-col items-center gap-8">
            <div className="w-32 h-32 rounded-full border-[10px] border-white/10"></div>
            <div className="w-full space-y-2">
              <div className="h-2 bg-[#1B1B1B] rounded w-full"></div>
              <div className="h-2 bg-[#1B1B1B] rounded w-3/4"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 h-[400px] bg-[#121212] border border-white/10 rounded-[16px] p-8 space-y-6">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="w-32 h-6 bg-[#1B1B1B] rounded"></div>
              <div className="w-24 h-3 bg-[#1B1B1B] rounded opacity-50"></div>
            </div>
            <div className="w-8 h-8 bg-[#1B1B1B] rounded-[16px]"></div>
          </div>
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="w-28 h-28 rounded-full border-[8px] border-white/10"></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[#1B1B1B]/50 rounded-[16px]"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-[300px] bg-[#121212] border border-white/10 rounded-[16px] p-8 space-y-4">
          <div className="w-48 h-6 bg-[#1B1B1B] rounded"></div>
          <div className="w-full h-40 bg-[#121212]/50 rounded border border-white/10/30"></div>
        </div>
        <div className="lg:col-span-4 h-[300px] bg-[#121212] border border-white/10 rounded-[16px] p-8 space-y-4">
          <div className="w-32 h-6 bg-[#1B1B1B] rounded"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-[#1B1B1B] rounded-[16px]"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#1B1B1B] rounded w-3/4"></div>
                  <div className="h-3 bg-[#1B1B1B] rounded w-1/2 opacity-50"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
