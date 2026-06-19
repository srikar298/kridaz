import React from "react";

const UserSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10 space-y-12 animate-pulse">
      <div className="space-y-6">
        <div className="h-16 bg-[#2D2D2D]/20 rounded-[12px] w-full max-w-xl"></div>
        <div className="h-14 bg-[#2D2D2D]/20 rounded-[12px] w-full max-w-md"></div>
      </div>

      <div className="space-y-6">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-[#0d0d0d] border border-[#2D2D2D]/30 rounded-[12px]">
          <div className="col-span-4 h-3 bg-[#2D2D2D]/50 rounded w-1/2"></div>
          <div className="col-span-3 h-3 bg-[#2D2D2D]/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-[#2D2D2D]/50 rounded w-1/2"></div>
          <div className="col-span-2 h-3 bg-[#2D2D2D]/50 rounded w-1/2"></div>
        </div>

        <div className="space-y-3">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-[#000000] border border-[#2D2D2D]/30 rounded-[12px] p-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-4 flex items-center gap-5">
                  <div className="w-11 h-11 rounded-full bg-[#2D2D2D]/50"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#2D2D2D]/50 rounded w-3/4"></div>
                    <div className="h-2 bg-[#2D2D2D]/30 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="lg:col-span-3 h-3 bg-[#2D2D2D]/30 rounded w-full"></div>
                <div className="lg:col-span-2 h-3 bg-[#2D2D2D]/30 rounded w-2/3"></div>
                <div className="lg:col-span-2 h-6 bg-[#2D2D2D]/30 rounded-full w-24"></div>
                <div className="lg:col-span-1 flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-[#2D2D2D]/30"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserSkeleton;
