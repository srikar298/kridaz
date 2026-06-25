import React, { useState, useEffect, useRef } from "react";
import { useGetReelsFeedQuery, reelsApi } from "@redux/api/reelsApi";
import ReelItem from "../components/ReelItem";
import { ChevronLeft, Camera } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@context/SocketContext";
import { useDispatch, useSelector } from "react-redux";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { Button } from "@kridaz/ui";


const ReelsFeed = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { id: initialId } = useParams();
  const [cursor, setCursor] = useState(null);
  const { data, isLoading, isFetching } = useGetReelsFeedQuery({
    cursor,
    initialId,
  });

  // Optimistic UI state
  const { isUploading, activeUpload } = useSelector(
    (/** @type {any} */ state) => state.mediaUpload
  );
  const { user } = useSelector((/** @type {any} */ state) => state.auth);
  const typedDispatch = /** @type {any} */ (dispatch);

  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef(null);
  const isInitialScrollDone = useRef(false);

  // Combine real reels with optimistic one
  const reels = React.useMemo(() => {
    return data?.reels || [];
  }, [data?.reels]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on("reel_liked", ({ reelId, likes }) => {
      const patchFeed = (queryArg) => {
        typedDispatch(
          reelsApi.util.updateQueryData("getReelsFeed", queryArg, (draft) => {
            const reel = draft.reels.find((r) => (r.id || r._id) === reelId);
            if (reel) {
              if (reel.stats) reel.stats.likes = likes;
              reel.likes = likes;
            }
          })
        );
      };
      patchFeed(undefined);
      
    });

    socket.on("reel_commented", ({ reelId }) => {
      const patchFeed = (queryArg) => {
        typedDispatch(
          reelsApi.util.updateQueryData("getReelsFeed", queryArg, (draft) => {
            const reel = draft.reels.find((r) => (r.id || r._id) === reelId);
            if (reel) {
              if (reel.stats) reel.stats.comments += 1;
              if (typeof reel.comments === "number") reel.comments += 1;
            }
          })
        );
      };
      patchFeed(undefined);
      
    });

    socket.on("reel_deleted", ({ reelId }) => {
      const patchFeed = (queryArg) => {
        typedDispatch(
          reelsApi.util.updateQueryData("getReelsFeed", queryArg, (draft) => {
            if (!draft || !draft.reels) return;
            draft.reels = draft.reels.filter((r) => (r.id || r._id) !== reelId);
          })
        );
      };
      patchFeed(undefined);
      
    });

    socket.on(
      "MEDIA_PROCESSING_PROGRESS",
      ({ mediaId, mediaType, progress, status }) => {
        if (mediaType === "reel") {
          const patchFeed = (queryArg) => {
            typedDispatch(
              reelsApi.util.updateQueryData(
                "getReelsFeed",
                queryArg,
                (draft) => {
                  if (!draft || !draft.reels) return;
                  const reel = draft.reels.find(
                    (r) => (r.id || r._id) === mediaId
                  );
                  if (reel) {
                    reel.status = "pending";
                    reel.processingProgress = progress;
                    reel.processingStatus = status;
                  }
                }
              )
            );
          };
          patchFeed(undefined);
          
        }
      }
    );

    socket.on(
      "MEDIA_PROCESSING_COMPLETE",
      ({ mediaId, mediaType, hlsUrl, thumbnailUrl }) => {
        if (mediaType === "reel") {
          const patchFeed = (queryArg) => {
            typedDispatch(
              reelsApi.util.updateQueryData(
                "getReelsFeed",
                queryArg,
                (draft) => {
                  if (!draft || !draft.reels) return;
                  const reel = draft.reels.find(
                    (r) => (r.id || r._id) === mediaId
                  );
                  if (reel) {
                    reel.status = "ready";
                    reel.hlsUrl = hlsUrl;
                    reel.thumbnailUrl = thumbnailUrl;
                  }
                }
              )
            );
          };
          patchFeed(undefined);
          
        }
      }
    );

    return () => {
      socket.off("reel_liked");
      socket.off("reel_commented");
      socket.off("reel_deleted");
      socket.off("MEDIA_PROCESSING_PROGRESS");
      socket.off("MEDIA_PROCESSING_COMPLETE");
    };
  }, [socket, dispatch, cursor, initialId]);

  // IntersectionObserver for active reel tracking
  useEffect(() => {
    if (!reels || reels.length === 0) return;

    const observerOptions = {
      root: feedRef.current,
      threshold: 0.5, // Reel is active when 50% visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute("data-index"));
          if (index !== activeIndex) {
            setActiveIndex(index);

            // Mask URL (only for non-temp reels)
            const currentReel = reels[index];
            if (currentReel && !currentReel.temp) {
              window.history.replaceState(
                null,
                "",
                `/shorts/${currentReel.id || currentReel._id}`
              );
            }

            // Load more trigger
            if (index >= reels.length - 3 && !isFetching && data?.nextCursor) {
              setCursor(data.nextCursor);
            }
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    const elements = feedRef.current.querySelectorAll(".reels-item-wrapper");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [reels, activeIndex, isFetching, data?.nextCursor]);

  // Ensure we are at the top if initialId is provided
  useEffect(() => {
    if (reels.length > 0 && !isInitialScrollDone.current) {
      isInitialScrollDone.current = true;
      if (initialId) {
        setActiveIndex(0);
        window.history.replaceState(null, "", `/shorts/${initialId}`);
      }
    }
  }, [reels, initialId]);

  if (isLoading && !data) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden z-50 flex justify-center">
      {/* Header Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] p-4 pt-[env(safe-area-inset-top,16px)] flex items-center justify-between z-[60] pointer-events-none">
        <GlobalBackButton />
        <h2 className="text-white font-bold text-lg tracking-tight pointer-events-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Shorts
        </h2>
        <Button
          onClick={() => navigate("/reels/upload")}
          className="p-2.5 bg-black/50 rounded-full text-white pointer-events-auto backdrop-blur-md border border-white/10 active:scale-90 transition-transform shadow-lg"
        >
          <Camera size={22} />
        </Button>
      </div>

      {/* Vertical Feed Container */}
      <div
        ref={feedRef}
        className="reels-feed-container scrollbar-hide snap-y snap-mandatory overflow-y-auto mx-auto"
        style={{
          width: "min(100vw, calc(100dvh * 9 / 16))",
          height: "min(100dvh, calc(100vw * 16 / 9))",
        }}
      >
        {reels.map((reel, index) => {
          // Preload: render actual component if within 2 items of active
          const isNear = Math.abs(index - activeIndex) <= 2;
          const isActive = index === activeIndex;

          return (
            <div
              key={reel.id || reel._id}
              data-index={index}
              className="reels-item-wrapper w-full h-full snap-start snap-always"
            >
              {isNear ? (
                <ReelItem reel={reel} isVisible={isActive} />
              ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  {/* Show thumbnail placeholder for far-away items if available */}
                  {reel.thumbnailUrl && (
                    <img
                      src={reel.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-20 blur-sm"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isFetching && (
          <div className="h-full w-full flex items-center justify-center snap-start">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {reels.length === 0 && !isLoading && (
          <div className="h-full w-full flex flex-col items-center justify-center text-white p-8">
            <p className="text-lg font-semibold mb-2">No reels yet</p>
            <p className="text-gray-400 text-center">
              Be the first one to post a reel!
            </p>
            <Button
              onClick={() => navigate("/reels/upload")}
              className="mt-6 px-6 py-2 bg-primary text-black font-bold rounded-full hover:scale-105 active:scale-95 transition-transform"
            >
              Create Short
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Navigation (Simulated or Integrated) */}
      {/* If kridaz has a global bottom nav, it should be visible here or hidden for immersive mode */}
    </div>
  );
};

export default ReelsFeed;
