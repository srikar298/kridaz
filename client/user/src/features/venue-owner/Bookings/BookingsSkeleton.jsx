import React from "react";

const BookingsSkeleton = () => {
  return (
    <div className="h-full bg-background px-1 lg:px-3 lg:pt-2 space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-card rounded-[16px] animate-pulse"></div>
          <div className="h-3 w-64 bg-card rounded-[16px] animate-pulse opacity-50"></div>
        </div>
        <div className="h-16 w-48 bg-card rounded-[16px] animate-pulse"></div>
      </div>

      {/* Toolbar Skeleton */}
      <div className="h-14 w-full bg-card rounded-[16px] animate-pulse"></div>

      {/* Table Skeleton */}
      <div className="bg-background rounded-[16px] border border-white/10 overflow-hidden">
        <div className="h-12 w-full bg-[#151617] border-b border-white/10"></div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex gap-4 items-center border-b border-white/10/30 pb-4"
            >
              <div className="h-10 w-48 bg-card rounded-[16px] animate-pulse"></div>
              <div className="h-10 flex-1 bg-card rounded-[16px] animate-pulse opacity-70"></div>
              <div className="h-10 w-24 bg-card rounded-[16px] animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingsSkeleton;
