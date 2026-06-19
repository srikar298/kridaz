const OwnerRequestsSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 lg:p-10">
      <div className="space-y-12">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-12 bg-gray-800 rounded-full"></div>
          <div className="h-10 w-64 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-800 rounded animate-pulse mt-4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-[#111] rounded-[8px] border border-white/5 p-6 space-y-6 animate-pulse"
            >
              <div className="space-y-4">
                <div className="h-4 w-24 bg-gray-800 rounded"></div>
                <div className="h-8 w-48 bg-gray-800 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              </div>
              <div className="pt-4 border-t border-white/5 flex gap-3">
                <div className="flex-1 h-12 bg-gray-800 rounded-[8px]"></div>
                <div className="flex-1 h-12 bg-gray-800 rounded-[8px]"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerRequestsSkeleton;
