const TurfDetailsSkeleton = () => (
  <div className="min-h-screen bg-black text-white">
    {/* Header Skeleton */}
    <div className="container mx-auto px-4 mb-8">
      <div className="skeleton h-4 w-32 bg-zinc-800 mb-6 rounded-full"></div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="skeleton h-16 md:h-20 w-full bg-zinc-800 rounded-[8px]"></div>
          <div className="flex gap-6">
            <div className="skeleton h-5 w-40 bg-zinc-800 rounded-full"></div>
            <div className="skeleton h-5 w-48 bg-zinc-800 rounded-full"></div>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="skeleton w-14 h-14 rounded-full bg-zinc-800"></div>
          <div className="skeleton w-14 h-14 rounded-full bg-zinc-800"></div>
        </div>
      </div>
    </div>

    {/* Gallery Skeleton */}
    <div className="container mx-auto px-4 mb-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[500px]">
        <div className="md:col-span-8 skeleton bg-zinc-800 rounded-[8px]"></div>
        <div className="md:col-span-4 skeleton bg-zinc-800 rounded-[8px]"></div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="container mx-auto px-4 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-16">
          <div className="space-y-6">
            <div className="skeleton h-8 w-64 bg-zinc-800 rounded-full"></div>
            <div className="skeleton h-32 w-full bg-zinc-800 rounded-[8px]"></div>
          </div>
          <div className="space-y-8">
            <div className="skeleton h-8 w-64 bg-zinc-800 rounded-full"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-16 w-full bg-zinc-800 rounded-[8px]"
                ></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="skeleton h-[500px] w-full bg-zinc-800 rounded-[8px]"></div>
        </div>
      </div>
    </div>
  </div>
);

export default TurfDetailsSkeleton;
