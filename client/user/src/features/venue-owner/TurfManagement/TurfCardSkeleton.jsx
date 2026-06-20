const TurfCardSkeleton = () => {
  return (
    <div className="bg-card border border-white/10 rounded-[16px] overflow-hidden animate-pulse h-full flex flex-col">
      <div className="aspect-video bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-card to-transparent animate-shimmer" />
      </div>

      <div className="p-2 md:p-3 space-y-3 flex-grow">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-card rounded-[16px] w-3/4"></div>
            <div className="h-3 bg-card rounded-[16px] w-1/2"></div>
          </div>
          <div className="h-5 bg-card rounded-[16px] w-10"></div>
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-card rounded-[16px] w-full"></div>
          <div className="h-3 bg-card rounded-[16px] w-full opacity-60"></div>
        </div>

        <div className="mt-auto flex justify-between items-center">
          <div className="h-3 bg-card rounded-[16px] w-20"></div>
          <div className="flex gap-1.5">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-card rounded-[16px]"></div>
            <div className="w-6 h-6 md:w-7 md:h-7 bg-card rounded-[16px]"></div>
            <div className="w-6 h-6 md:w-7 md:h-7 bg-card rounded-[16px]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfCardSkeleton;
