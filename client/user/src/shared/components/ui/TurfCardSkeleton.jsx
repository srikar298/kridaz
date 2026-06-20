const TurfCardSkeleton = () => {
  return (
    <div className="bg-background rounded-[8px] border border-white/[0.05] overflow-hidden flex flex-col h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-[200px] bg-white/[0.03] shrink-0"></div>

      {/* Content Skeleton */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="mb-4">
          <div className="h-6 bg-white/[0.05] rounded-lg w-3/4 mb-2"></div>
          <div className="h-3 bg-white/[0.03] rounded-md w-1/2 mb-4"></div>

          <div className="flex justify-between items-center mb-2">
            <div className="h-5 bg-white/[0.05] rounded-lg w-12"></div>
            <div className="h-5 bg-white/[0.03] rounded-md w-16"></div>
          </div>

          <div className="h-6 bg-white/[0.05] rounded-lg w-20 mt-2"></div>
        </div>

        <div className="h-12 bg-white/[0.08] rounded-full w-full mt-auto"></div>
      </div>
    </div>
  );
};

export default TurfCardSkeleton;
