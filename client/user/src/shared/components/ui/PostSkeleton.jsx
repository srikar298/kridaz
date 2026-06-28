import React from "react";

const PostSkeleton = () => {
  return (
    <div className="bg-[#0a0a0a] border-y md:border border-white/5 md:rounded-[12px] p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-[42px] h-[42px] rounded-full bg-white/[0.05]"></div>
          <div>
            <div className="h-4 w-32 bg-white/[0.05] rounded-[4px] mb-2"></div>
            <div className="h-3 w-20 bg-white/[0.03] rounded-[4px]"></div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-white/[0.03]"></div>
      </div>

      {/* Content Text */}
      <div className="mb-4 space-y-2">
        <div className="h-4 w-full bg-white/[0.03] rounded-[4px]"></div>
        <div className="h-4 w-5/6 bg-white/[0.03] rounded-[4px]"></div>
        <div className="h-4 w-3/4 bg-white/[0.03] rounded-[4px]"></div>
      </div>

      {/* Media Box */}
      <div className="w-full aspect-[4/3] bg-white/[0.03] rounded-[12px] mb-4"></div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/[0.05]"></div>
            <div className="h-4 w-8 bg-white/[0.03] rounded-[4px]"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/[0.05]"></div>
            <div className="h-4 w-8 bg-white/[0.03] rounded-[4px]"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/[0.05]"></div>
        </div>
      </div>
    </div>
  );
};

export default PostSkeleton;
