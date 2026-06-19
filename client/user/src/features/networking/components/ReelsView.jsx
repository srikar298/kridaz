import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, PlaySquare } from "lucide-react";
import { useGetReelsFeedQuery } from "@redux/api/reelsApi";
import { ReelItem } from "@features/reels";

const ReelsView = ({ gateInteraction, onBack }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reelCursor, setReelCursor] = useState(null);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const {
    data: reelsData,
    isLoading: reelsLoading,
    isFetching: reelsFetching,
  } = useGetReelsFeedQuery(reelCursor ? { cursor: reelCursor } : undefined);

  const reels = reelsData?.reels || [];
  const reelsContainerRef = useRef(null);
  const initialReelScrolled = useRef(false);

  // Sync ?id= in search params with active reel index
  useEffect(() => {
    if (reels.length === 0 || !initialReelScrolled.current) return;
    const currentReel = reels[activeReelIndex];
    if (currentReel?.id || currentReel?._id) {
      const id = currentReel.id || currentReel._id;
      if (searchParams.get("id") !== id) {
        setSearchParams({ tab: "shots", id }, { replace: true });
      }
    }
  }, [activeReelIndex, reels, searchParams, setSearchParams]);

  // Initial scroll to reel specified in URL
  useEffect(() => {
    if (reels.length > 0 && !initialReelScrolled.current) {
      const urlId = searchParams.get("id");
      if (urlId) {
        const index = reels.findIndex((r) => r.id === urlId || r._id === urlId);
        if (index > 0) {
          setActiveReelIndex(index);
          if (reelsContainerRef.current) {
            const reelElement = reelsContainerRef.current.children[index];
            if (reelElement) {
              reelElement.scrollIntoView({ behavior: "auto", block: "start" });
            }
          }
        }
      }
      initialReelScrolled.current = true;
    }
  }, [reels, searchParams]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black md:bg-black/80 md:backdrop-blur-md">
      {/* Back button & header */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 text-white w-9 h-9 rounded-[8px] hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div
        ref={reelsContainerRef}
        className="w-full h-full md:w-auto md:aspect-[9/16] overflow-y-scroll snap-y snap-mandatory no-scrollbar md:rounded-[8px] bg-black shadow-2xl mx-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollTop / el.clientHeight);
          if (idx !== activeReelIndex) {
            setActiveReelIndex(idx);
          }
          if (
            reels.length > 0 &&
            idx >= reels.length - 2 &&
            !reelsFetching &&
            reelsData?.nextCursor
          ) {
            setReelCursor(reelsData.nextCursor);
          }
        }}
      >
        {reelsLoading ? (
          <div className="h-full flex items-center justify-center bg-black">
            <Loader2 size={36} className="text-[#BFF367] animate-spin" />
          </div>
        ) : reels.length > 0 ? (
          reels.map((reel, index) => (
            <div
              key={reel._id || reel.id}
              className="w-full h-full snap-start snap-always relative bg-black overflow-hidden flex-shrink-0"
            >
              {Math.abs(index - activeReelIndex) <= 2 ? (
                <ReelItem reel={reel} isVisible={index === activeReelIndex} />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/40 bg-black">
            <PlaySquare size={48} className="opacity-50" />
            <div className="font-bold uppercase tracking-widest text-[13px]">
              No reels yet
            </div>
          </div>
        )}
        {reelsFetching && (
          <div className="h-20 flex items-center justify-center snap-start">
            <Loader2 size={24} className="text-[#BFF367] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReelsView;
