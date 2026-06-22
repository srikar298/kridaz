import React from "react";

const OwnersSkeleton = () => {
  return (
    <div className="p-4 lg:px-10 space-y-12 animate-pulse">
      <div className="h-14 bg-border/20 rounded-[12px] w-full max-w-lg"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="bg-background border border-border/30 rounded-[12px] p-5 h-[300px] flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-[10px] bg-border/50"></div>
              <div className="flex-1 space-y-3">
                <div className="h-3 bg-border/50 rounded w-1/3"></div>
                <div className="h-6 bg-border/50 rounded w-3/4"></div>
              </div>
            </div>
            <div className="space-y-4 flex-1">
              <div className="h-12 bg-border/30 rounded-[8px]"></div>
              <div className="h-12 bg-border/30 rounded-[8px]"></div>
              <div className="h-12 bg-border/30 rounded-[8px]"></div>
            </div>
            <div className="pt-6 border-t border-border/30 grid grid-cols-2 gap-4 mt-8">
              <div className="h-8 bg-border/30 rounded"></div>
              <div className="h-8 bg-border/30 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnersSkeleton;
