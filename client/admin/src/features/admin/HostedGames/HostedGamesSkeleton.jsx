import React from "react";

const HostedGamesSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-6 lg:p-10 space-y-12 animate-pulse">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-border pb-10">
        <div className="space-y-4">
          <div className="h-14 bg-border/20 rounded-[12px] w-64 md:w-96"></div>
          <div className="h-4 bg-border/20 rounded-[12px] w-48"></div>
        </div>
        <div className="h-14 bg-border/20 rounded-[12px] w-full lg:w-96"></div>
      </div>

      <div className="space-y-6">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-background border border-border/30 rounded-[12px]">
          <div className="col-span-3 h-3 bg-border/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-border/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-border/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-border/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-border/50 rounded w-1/2"></div>
        </div>

        {/* List Items */}
        <div className="space-y-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-background border border-border/30 rounded-[12px] p-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-3 flex items-center gap-5">
                  <div className="w-11 h-11 rounded-[10px] bg-border/50"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-border/50 rounded w-3/4"></div>
                    <div className="h-2 bg-border/30 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="lg:col-span-2 h-3 bg-border/30 rounded w-full"></div>
                <div className="lg:col-span-2 h-3 bg-border/30 rounded w-2/3"></div>
                <div className="lg:col-span-2 h-3 bg-border/30 rounded w-full"></div>
                <div className="lg:col-span-2 h-6 bg-border/30 rounded-full w-24"></div>
                <div className="lg:col-span-1 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-border/30"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostedGamesSkeleton;
