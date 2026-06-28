import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReelPlayer from "./ReelPlayer";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreVertical,
  Music,
} from "lucide-react";
import {
  useInteractWithReelMutation,
  useDeleteReelMutation,
  useAddReelCommentMutation,
  useGetReelCommentsQuery,
} from "@redux/api/reelsApi";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { followUser } from "@redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import ReportModal from "../../networking/components/ReportModal";

const ReelItem = ({ reel, isVisible }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [interact] = useInteractWithReelMutation();
  const [deleteReel] = useDeleteReelMutation();
  const [isLiked, setIsLiked] = useState(reel.isLiked || false);
  const [localLikeCount, setLocalLikeCount] = useState(() => {
    if (typeof reel.likes === "number") return reel.likes;
    if (reel.stats && typeof reel.stats.likes === "number")
      return reel.stats.likes;
    if (typeof reel.likesCount === "number") return reel.likesCount;
    if (Array.isArray(reel.likes)) return reel.likes.length;
    return 0;
  });
  const [localCommentCount, setLocalCommentCount] = useState(() => {
    if (typeof reel.comments === "number") return reel.comments;
    if (reel.stats && typeof reel.stats.comments === "number")
      return reel.stats.comments;
    if (typeof reel.commentsCount === "number") return reel.commentsCount;
    if (Array.isArray(reel.comments)) return reel.comments.length;
    return 0;
  });
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [addReelComment] = useAddReelCommentMutation();
  const [showReportModal, setShowReportModal] = useState(false);
  const [localComments, setLocalComments] = useState(null); // null = not yet loaded
  const isLikingRef = React.useRef(false);
  const isLikedRef = React.useRef(reel.isLiked || false);

  // Sync props to state if props change (e.g. from parent feed queries or websocket events)
  React.useEffect(() => {
    setIsLiked(reel.isLiked || false);
    isLikedRef.current = reel.isLiked || false;
  }, [reel.isLiked]);

  React.useEffect(() => {
    const freshLikes = (() => {
      if (typeof reel.likes === "number") return reel.likes;
      if (reel.stats && typeof reel.stats.likes === "number")
        return reel.stats.likes;
      if (typeof reel.likesCount === "number") return reel.likesCount;
      if (Array.isArray(reel.likes)) return reel.likes.length;
      return 0;
    })();
    setLocalLikeCount(freshLikes);
  }, [reel.likes, reel.stats?.likes, reel.likesCount]);

  // Sync comment count from props
  React.useEffect(() => {
    const freshComments = (() => {
      if (typeof reel.comments === "number") return reel.comments;
      if (reel.stats && typeof reel.stats.comments === "number")
        return reel.stats.comments;
      if (typeof reel.commentsCount === "number") return reel.commentsCount;
      if (Array.isArray(reel.comments)) return reel.comments.length;
      return 0;
    })();
    setLocalCommentCount(freshComments);
  }, [reel.comments, reel.stats?.comments, reel.commentsCount]);

  // Reset local comments when drawer closes
  React.useEffect(() => {
    if (!showComments) setLocalComments(null);
  }, [showComments]);

  // Fetch comments only when the drawer is open
  const { data: commentsData, isFetching: commentsFetching } =
    useGetReelCommentsQuery(reel.id || reel._id, { skip: !showComments });

  // Sync fetched comments into local state (only on first load per open)
  const serverComments = commentsData?.comments || [];

  const isCreator =
    user?.id === (reel.creatorId?.id || reel.creatorId?._id) ||
    user?.id === reel.creatorId;

  const navigateToProfile = (e) => {
    e.stopPropagation();
    const id = reel.creatorId?.id || reel.creatorId?._id;
    if (id) {
      navigate(`/profile/${id}`);
    }
  };

  const handleLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;

    let wasLiked = isLikedRef.current;
    setIsLiked((prev) => {
      return !prev;
    });
    isLikedRef.current = !wasLiked;
    
    setLocalLikeCount((prev) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));

    if (!wasLiked) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }

    try {
      await interact({
        reelId: reel.id || reel._id,
        type: wasLiked ? "UNLIKE" : "LIKE",
      }).unwrap();
    } catch {
      // Rollback on failure
      setIsLiked(wasLiked);
      isLikedRef.current = wasLiked;
      setLocalLikeCount((prev) =>
        wasLiked ? prev + 1 : Math.max(0, prev - 1)
      );
      toast.error("Failed to update like");
    } finally {
      isLikingRef.current = false;
    }
  };

  const handleDoubleTap = () => {
    if (!isLikedRef.current) {
      handleLike();
    } else {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Kridaz Shorts",
      text: reel.caption,
      url: `${window.location.origin}/community?tab=shots&id=${reel.id || reel._id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Link copied to clipboard!");
      }
      interact({ reelId: reel.id || reel._id, type: "SHARE" });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this short?")) {
      try {
        await deleteReel(reel.id || reel._id).unwrap();
        toast.success("Short deleted");
      } catch (err) {
        toast.error("Failed to delete short");
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");

    // Optimistic: prepend to local list immediately
    const optimistic = {
      id: `temp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name || "You",
        username: user?.username || "",
        profilePicture: user?.profilePicture || null,
      },
    };
    setLocalComments((prev) => [optimistic, ...(prev ?? serverComments)]);
    setLocalCommentCount((prev) => prev + 1);

    try {
      const res = await addReelComment({
        reelId: reel.id || reel._id,
        content: text,
      }).unwrap();
      // Replace optimistic with real comment from server
      setLocalComments((prev) =>
        (prev ?? []).map((c) =>
          c.id === optimistic.id ? { ...res.comment, user: optimistic.user } : c
        )
      );
      toast.success("Comment added");
    } catch (err) {
      // Rollback optimistic
      setLocalComments((prev) =>
        (prev ?? []).filter((c) => c.id !== optimistic.id)
      );
      setLocalCommentCount((prev) => Math.max(0, prev - 1));
      toast.error("Failed to add comment");
    }
  };

  // If we don't have a final transcoded URL (hlsUrl) and it's pending/processing, show the processing state.
  // We ignore rawVideoUrl here because the raw upload might not be playable or might be deleted soon.
  const isProcessing =
    (reel.status === "pending" || reel.status === "processing") &&
    !reel.temp &&
    !reel.hlsUrl;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      <div
        className="h-full w-full"
        onDoubleClick={!isProcessing ? handleDoubleTap : undefined}
      >
        {isProcessing ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Blurred Placeholder */}
            {reel.thumbnailUrl ? (
              <img
                src={reel.thumbnailUrl}
                className="w-full h-full object-cover blur-2xl scale-110 opacity-50"
                alt="Processing..."
              />
            ) : (
              <div className="w-full h-full bg-zinc-900" />
            )}

            {/* Processing Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-[#BFF367] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#BFF367] font-bold text-lg">
                Optimizing Reel...
              </p>
              <p className="text-white/60 text-sm mt-2">
                {reel.processingProgress || 0}% Complete
              </p>

              {/* Progress Bar */}
              <div className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${reel.processingProgress || 0}%` }}
                  className="h-full bg-[#BFF367]"
                />
              </div>
            </div>
          </div>
        ) : (
          <ReelPlayer
            reelId={reel.id || reel._id}
            hlsUrl={reel.hlsUrl || reel.rawVideoUrl || reel.mediaUrl}
            isVisible={isVisible}
            poster={reel.thumbnailUrl}
          />
        )}
      </div>

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <ThumbsUp
              size={100}
              fill="#BFF367"
              className="text-[#BFF367] drop-shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Side Actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        <button
          className="flex flex-col items-center gap-1 active:scale-125 transition-transform duration-300 group"
          onClick={handleLike}
        >
          <div className="p-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <ThumbsUp
              size={26}
              className={`transition-colors ${isLiked ? "fill-[#BFF367] text-[#BFF367]" : "text-white fill-transparent group-hover:text-[#BFF367]"}`}
              strokeWidth={1.5}
            />
          </div>
          <span className="text-white text-[13px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {localLikeCount}
          </span>
        </button>

        <button
          className="flex flex-col items-center gap-1 active:scale-125 transition-transform duration-300"
          onClick={() => setShowComments(!showComments)}
        >
          <div className="p-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <MessageCircle
              size={26}
              className={`transition-colors ${showComments ? "text-[#BFF367]" : "text-white group-hover:text-[#BFF367]"}`}
              strokeWidth={2.5}
            />
          </div>
          <span className="text-white text-[13px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {localCommentCount}
          </span>
        </button>

        <button
          className="flex flex-col items-center gap-1 active:scale-125 transition-transform duration-300"
          onClick={handleShare}
        >
          <div className="p-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <Share2
              size={26}
              className="text-white fill-transparent group-hover:text-[#BFF367] transition-colors"
              strokeWidth={2}
            />
          </div>
        </button>

        <div className="relative mt-2">
          <button
            className="p-1 text-white active:bg-white/20 rounded-full transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={20} strokeWidth={2.5} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  className="absolute right-0 bottom-10 mb-2 w-48 bg-zinc-950/90 border border-white/10 rounded-[8px] overflow-hidden z-50 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                >
                  {isCreator ? (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-500/10 font-bold text-sm flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <ThumbsUp size={14} fill="currentColor" />
                      </div>
                      Delete Reel
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowReportModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 font-bold text-sm flex items-center gap-3 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                        <Share2 size={14} />
                      </div>
                      Report
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pt-12 pb-8 z-10 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Profile Section */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={navigateToProfile}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg bg-zinc-800">
                {reel.creatorId?.profilePicture || reel.creatorId?.profileImage ? (
                  <img
                    src={reel.creatorId.profilePicture || reel.creatorId.profileImage}
                    alt={reel.creatorId?.username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full items-center justify-center bg-[var(--primary)] text-black font-bold text-[16px]"
                  style={{ display: (reel.creatorId?.profilePicture || reel.creatorId?.profileImage) ? 'none' : 'flex' }}
                >
                  {(reel.creatorId?.name || reel.creatorId?.username || "U").substring(0, 2).toUpperCase()}
                </div>
              </div>
              {/* Follow Plus Button */}
              {!isCreator &&
                !user?.following?.includes(
                  reel.creatorId?.id || reel.creatorId?._id
                ) && (
                  <button
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#BFF367] text-black rounded-full flex items-center justify-center border border-white shadow-md active:scale-90 transition-transform"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const targetId =
                        reel.creatorId?.id || reel.creatorId?._id;
                      if (!targetId) return;
                      dispatch(followUser(targetId));
                      toast.success(
                        "Followed " +
                          (reel.creatorId?.username ||
                            reel.creatorId?.name ||
                            "user")
                      );
                      try {
                        await axiosInstance.post(
                          `/api/user/players/${targetId}/follow`
                        );
                      } catch (err) {
                        toast.error("Failed to follow user");
                      }
                    }}
                  >
                    <span
                      className="text-sm font-bold leading-none"
                      style={{ marginTop: "-2px" }}
                    >
                      +
                    </span>
                  </button>
                )}
            </div>
            <h3 className="text-white font-sans font-bold text-[16px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-tight group-hover:underline">
              @
              {reel.creatorId?.username ||
                reel.creatorId?.name ||
                "kridaz_user"}
            </h3>
          </div>

          <p className="text-white text-[14px] leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pr-2 mt-1 line-clamp-2 overflow-hidden break-words">
            {reel.caption}
            {reel.hashtags?.map((tag) => (
              <span key={tag} className="font-bold ml-1 text-white">
                #{tag}
              </span>
            ))}
          </p>


        </div>
      </div>

      {/* Comments Overlay */}
      <AnimatePresence>
        {showComments && (
          <>
            <div
              className="absolute inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setShowComments(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-zinc-900 rounded-t-[32px] z-50 flex flex-col p-6 shadow-2xl border-t border-white/10"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">Comments</h3>
                <span className="text-white/60 text-sm font-medium">
                  {localCommentCount}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
                <div className="flex flex-col gap-4">
                  {commentsFetching && !localComments ? (
                    <div className="text-white/40 text-center py-10">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-[#BFF367] rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm">Loading comments...</p>
                    </div>
                  ) : (localComments ?? serverComments).length === 0 ? (
                    <div className="text-white/40 text-center py-10">
                      <MessageCircle
                        size={40}
                        className="mx-auto mb-3 opacity-20"
                      />
                      <p className="text-sm font-medium italic">
                        Be the first to comment...
                      </p>
                    </div>
                  ) : (
                    (localComments ?? serverComments).map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {comment.user?.profilePicture || comment.user?.profileImage ? (
                            <img
                              src={comment.user.profilePicture || comment.user.profileImage}
                              alt={comment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/60 text-xs font-bold">
                              {(comment.user?.name || "U")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-white font-semibold text-xs">
                              {comment.user?.name || "User"}
                            </span>
                            <span className="text-white/30 text-[10px]">
                              {new Date(comment.createdAt).toLocaleDateString(
                                [],
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm leading-relaxed break-words">
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={handleAddComment} className="relative mt-auto">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full bg-white/5 border border-white/10 rounded-[8px] px-5 py-4 text-white text-sm focus:outline-none focus:border-[#BFF367] transition-colors pr-14"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#BFF367] font-bold text-sm px-3 py-2 disabled:opacity-30 transition-opacity"
                >
                  Post
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Report Modal — shared component */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            type="reel"
            itemId={reel.id || reel._id}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelItem;
