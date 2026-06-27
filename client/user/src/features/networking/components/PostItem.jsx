import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, ShieldCheck, Video } from "lucide-react";
import CommentIcon from "../../../assets/icons/comment_icon.png";
import ShareIcon from "../../../assets/icons/share_icon.png";
import { AnimatePresence, motion } from "framer-motion";
import {
  useLikePostMutation,
  useAddPostCommentMutation,
} from "@redux/api/communityApi";
import toast from "react-hot-toast";
import { Button, Input } from "@kridaz/ui";


const getPostId = (post) => post?._id || post?.id;

const PostItem = React.memo(
  ({
    post,
    user,
    isAdmin,
    gateInteraction,
    onUpdatePost,
    onDeletePost,
    onSharePost,
    onReportPost,
  }) => {
    const postId = getPostId(post);
    const currentUserId = user?._id || user?.id;

    const [likePost] = useLikePostMutation();
    const [addPostComment] = useAddPostCommentMutation();

    const [expandedComments, setExpandedComments] = useState(false);
    const [commentInput, setCommentInput] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
    const [hasMoreCaption, setHasMoreCaption] = useState(false);
    const captionRef = useRef(null);

    useEffect(() => {
      if (captionRef.current) {
        setHasMoreCaption(
          captionRef.current.scrollHeight > captionRef.current.clientHeight
        );
      }
    }, [post.content, post.title]);

    const handleMediaScroll = (e) => {
      if (!e.target) return;
      const index = Math.round(e.target.scrollLeft / e.target.clientWidth);
      if (index !== activeMediaIndex) {
        setActiveMediaIndex(index);
      }
    };

    // Relative / formatted time helper
    const getFormattedTime = (dateString) => {
      if (!dateString) return "2h ago";
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        });
      } catch (e) {
        return "2h ago";
      }
    };

    const handleLike = async () => {
      gateInteraction(async () => {
        const userId = user?.id || user?._id;
        const alreadyLiked = post.likes?.some(
          (l) => (l.id || l._id || l) === userId
        );

        // 1. Optimistic local update
        onUpdatePost(postId, (oldPost) => {
          const updatedLikes = alreadyLiked
            ? (oldPost.likes || []).filter(
                (l) => (l.id || l._id || l) !== userId
              )
            : [
                ...(oldPost.likes || []),
                {
                  id: userId,
                  _id: userId,
                  name: user?.name,
                  username: user?.username,
                  profilePicture: user?.profilePicture,
                },
              ];
          return {
            ...oldPost,
            likes: updatedLikes,
            likesCount: updatedLikes.length,
          };
        });

        try {
          const res = await likePost(postId).unwrap();
          if (res.likes) {
            onUpdatePost(postId, (oldPost) => ({
              ...oldPost,
              likes: res.likes,
              likesCount: res.likes.length,
            }));
          }
        } catch (error) {
          // Rollback optimistic update
          onUpdatePost(postId, (oldPost) => {
            const revertedLikes = alreadyLiked
              ? [
                  ...(oldPost.likes || []),
                  {
                    id: userId,
                    _id: userId,
                    name: user?.name,
                    username: user?.username,
                    profilePicture: user?.profilePicture,
                  },
                ]
              : (oldPost.likes || []).filter(
                  (l) => (l.id || l._id || l) !== userId
                );
            return {
              ...oldPost,
              likes: revertedLikes,
              likesCount: revertedLikes.length,
            };
          });
          toast.error(
            error?.data?.message || error.message || "Failed to like post"
          );
        }
      });
    };

    const handleAddComment = async () => {
      gateInteraction(
        async () => {
          const text = commentInput.trim();
          if (!text) return;

          const tempId = `temp-${Date.now()}`;
          const optimisticComment = {
            id: tempId,
            _id: tempId,
            text: text,
            createdAt: new Date().toISOString(),
            userId: {
              id: user?.id || user?._id,
              _id: user?.id || user?._id,
              name: user?.name || "You",
              username: user?.username || "",
              profilePicture: user?.profilePicture || null,
            },
          };

          // 1. Optimistic update
          onUpdatePost(postId, (oldPost) => ({
            ...oldPost,
            comments: [...(oldPost.comments || []), optimisticComment],
            totalComments: (oldPost.comments || []).length + 1,
          }));
          setCommentInput("");

          try {
            const res = await addPostComment({ postId, text }).unwrap();
            if (res?.comment) {
              onUpdatePost(postId, (oldPost) => ({
                ...oldPost,
                comments: (oldPost.comments || []).map((c) =>
                  c.id === tempId
                    ? {
                        ...res.comment,
                        userId: res.comment.user || res.comment.userId,
                      }
                    : c
                ),
              }));
            }
            toast.success("Comment added!");
          } catch (error) {
            // Rollback
            onUpdatePost(postId, (oldPost) => ({
              ...oldPost,
              comments: (oldPost.comments || []).filter((c) => c.id !== tempId),
              totalComments: Math.max(0, (oldPost.comments || []).length - 1),
            }));
            toast.error(error?.data?.message || "Failed to add comment");
          }
        },
        {
          title: "Join the Discussion",
          message: "Sign in to leave a comment.",
        }
      );
    };

    const isPostAuthor =
      (post.adminId?.id || post.adminId?._id) === currentUserId ||
      (post.author?.id || post.author?._id) === currentUserId ||
      post.authorId === currentUserId;

    return (
      <div className="bg-[#161616] border border-[#434242] rounded-[12px] overflow-hidden flex flex-col max-w-[361px] mx-auto w-full shadow-sm">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <Link
            to={`/profile/${post.adminId?.id || post.adminId?._id || post.author?.id || post.author?._id || post.authorId}`}
            className="flex items-center gap-3 group"
          >
            <img
              src={post.adminId?.profilePicture || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover border border-[#434242] group-hover:border-[var(--primary)]/50 transition-colors"
              alt=""
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-white transition-colors">
                  {post.adminId?.name || post.author?.name || "Player"}
                </span>
                <ShieldCheck size={14} className="text-primary" />
              </div>
              <div className="text-[12px] font-medium text-[#a5a5a5] mt-0.5">
                {getFormattedTime(post.createdAt)}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(!activeDropdown)}
                className="text-muted-foreground hover:text-white transition-colors p-2"
              >
                <MoreVertical size={18} />
              </button>
              {activeDropdown && (
                <div className="absolute right-0 mt-2 w-32 bg-neutral-900 border border-white/10 rounded-[8px] shadow-lg overflow-hidden z-50">
                  {isPostAuthor || isAdmin ? (
                    <button
                      onClick={() => {
                        setActiveDropdown(false);
                        onDeletePost(postId);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-card transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveDropdown(false);
                        onReportPost(postId);
                      }}
                      className="w-full text-left px-4 py-2 text-[12px] font-bold text-white hover:bg-card transition-colors"
                    >
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Caption */}
        {(post.title || post.content) && (
          <div className="text-[14px] font-normal leading-[1.4] px-4 pb-4">
            <div
              ref={captionRef}
              className={`text-white/90 whitespace-pre-wrap ${
                !isCaptionExpanded ? "line-clamp-2" : ""
              }`}
            >
              {post.title && <span className="font-semibold mr-1.5 text-white">{post.title}</span>}
              {post.content}
            </div>
            {hasMoreCaption && (
              <button
                onClick={() => setIsCaptionExpanded(!isCaptionExpanded)}
                className="text-white/60 font-medium mt-1.5 text-[13px] hover:text-white hover:underline block focus:outline-none border-0 bg-transparent p-0 transition-colors"
              >
                {isCaptionExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Looking For Details */}
        {post.postType === "LOOKING_FOR" && post.metadata && (
          <div className="px-4 pb-3 flex flex-col gap-2 text-[12px]">
             <div className="bg-white/5 border border-white/10 rounded-[12px] p-3 space-y-2">
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <div className="text-[13px] font-bold text-white uppercase">{post.metadata.subcategory} - {post.metadata.category}</div>
                     <div className="text-[11px] text-muted-foreground mt-0.5">{post.metadata.lookingFor}</div>
                   </div>
                   <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-[10px] font-bold uppercase shrink-0">
                     Looking For
                   </span>
                </div>
                
                {post.metadata.roles && post.metadata.roles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.metadata.roles.map(r => (
                       <span key={r} className="bg-white/10 text-white px-2 py-1 rounded-[6px] text-[11px] font-bold">
                         {r}
                       </span>
                    ))}
                  </div>
                )}
                
                {post.metadata.location?.address && (
                  <div className="flex items-center gap-2 text-[12px] text-white/80">
                    <span className="font-bold shrink-0">Location:</span> 
                    <span className="truncate">{post.metadata.location.address}</span>
                  </div>
                )}
                
                {(post.metadata.date || post.metadata.time || post.metadata.duration) && (
                   <div className="flex items-center gap-2 text-[12px] text-white/80">
                      <span className="font-bold">When:</span> 
                      {post.metadata.date && new Date(post.metadata.date).toLocaleDateString()} 
                      {post.metadata.time && ` at ${post.metadata.time}`}
                      {post.metadata.duration && ` (${post.metadata.duration})`}
                   </div>
                )}
                
                {post.metadata.budget && (
                   <div className="flex items-center gap-2 text-[12px] text-white/80">
                      <span className="font-bold">Budget:</span> {post.metadata.budget}
                   </div>
                )}
                
                {post.metadata.experienceLevel && (
                   <div className="flex items-center gap-2 text-[12px] text-white/80">
                      <span className="font-bold">Experience:</span> {post.metadata.experienceLevel}
                   </div>
                )}
             </div>
             
             {/* Contact Button */}
             {post.metadata.contactPreference && (
               <div className="mt-2 flex gap-2">
                 {post.metadata.contactPreference === "Kridaz DM" && (
                   <Button onClick={() => window.location.href = `/messages/${post.adminId?.id || post.authorId || post.author?._id}`} className="w-full bg-primary text-black font-bold h-9">
                     Message Kridaz DM
                   </Button>
                 )}
                 {post.metadata.contactPreference === "Call" && (
                   <Button onClick={() => window.location.href = `tel:${post.adminId?.phone || post.author?.phone || post.author?.phoneNumber}`} className="w-full bg-primary text-black font-bold h-9">
                     Call {post.adminId?.phone || post.author?.phone || post.author?.phoneNumber || "User"}
                   </Button>
                 )}
                 {post.metadata.contactPreference === "WhatsApp" && (
                   <Button onClick={() => window.open(`https://wa.me/${(post.adminId?.phone || post.author?.phone || post.author?.phoneNumber || "").replace(/\D/g,'')}`, '_blank')} className="w-full bg-[#25D366] text-white font-bold h-9">
                     WhatsApp {post.adminId?.phone || post.author?.phone || post.author?.phoneNumber || "User"}
                   </Button>
                 )}
               </div>
             )}
          </div>
        )}

        {/* Media Display */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="relative w-full pb-[125%] bg-[#050505] group overflow-hidden">
            <div
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={handleMediaScroll}
            >
              {post.mediaUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="min-w-full w-full max-w-full h-full flex-none snap-center relative"
                >
                  <img
                    src={url}
                    className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${
                      post.status === "pending" || post.status === "processing"
                        ? "blur-xl scale-110 opacity-50"
                        : ""
                    }`}
                    alt=""
                  />
                  {/* Video Icon for processed videos */}
                  {post.mediaType === "video" && post.status === "ready" && (
                    <div className="absolute top-4 right-4 p-1.5 bg-black/60 backdrop-blur-md rounded z-10">
                      <Video size={14} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress Overlay for Pending/Processing Posts */}
            {(post.status === "pending" || post.status === "processing") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20">
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="var(--primary)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        40 *
                        (1 - (post.processingProgress || 0) / 100)
                      }
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-black text-white">
                      {post.processingProgress || 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
                    {post.status === "processing"
                      ? "Optimizing Media"
                      : "Preparing Upload"}
                  </span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Multiple Image Indicator Dots */}
            {post.mediaUrls.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none shadow-lg">
                {post.mediaUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeMediaIndex
                        ? "w-2 h-2 bg-primary"
                        : "w-1.5 h-1.5 bg-card0"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : post.image || post.imageUrl || post.mediaUrl ? (
          <div className="relative w-full pb-[125%] bg-[#050505] group overflow-hidden">
            <img
              src={
                post.image ||
                post.imageUrl ||
                post.thumbnailUrl ||
                post.mediaUrl
              }
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${
                post.status === "pending" || post.status === "processing"
                  ? "blur-xl scale-110 opacity-50"
                  : ""
              }`}
              alt=""
            />

            {/* Progress Overlay for Pending/Processing Posts */}
            {(post.status === "pending" || post.status === "processing") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                <div className="w-24 h-24 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="var(--primary)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        40 *
                        (1 - (post.processingProgress || 0) / 100)
                      }
                      className="transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-black text-white">
                      {post.processingProgress || 0}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">
                    {post.status === "processing"
                      ? "Optimizing Media"
                      : "Preparing Upload"}
                  </span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Icon for processed videos */}
            {post.mediaType === "video" && post.status === "ready" && (
              <div className="absolute top-4 right-4 p-1.5 bg-black/60 backdrop-blur-md rounded">
                <Video size={14} className="text-white" />
              </div>
            )}
          </div>
        ) : null}

        {/* Separator Above Likes */}
        <div className="mx-4 h-[1px] bg-[#434242] mt-2" />

        {/* Likes Summary */}
        <div className="flex items-center justify-between text-[13px] font-medium text-[#a5a5a5] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-1.5 text-[15px]">
              <span className="z-10 drop-shadow-md">👍</span>
              <span className="z-0 drop-shadow-md">💖</span>
            </div>
            <span>
              {post.likes?.length > 0 ? (
                post.likes.length > 1 ? (
                  <>{post.likes[0].name || post.likes[0].username || "User"} and {post.likes.length - 1} others</>
                ) : (
                  <>{post.likes[0].name || post.likes[0].username || "User"}</>
                )
              ) : (
                "0 likes"
              )}
            </span>
          </div>
          <span>
            {post.totalComments || post.comments?.length || 0} comments
          </span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-[#434242] bg-transparent px-2 py-1.5">
          <button
            onClick={handleLike}
            className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className={`w-[18px] h-[18px] transition-all duration-200 ${post.likes?.some((l) => (l.id || l._id || l) === currentUserId) ? "" : "text-white/70 group-hover:text-white"}`}
            >
              <defs>
                <linearGradient
                  id={`like-gradient-${postId}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--secondary)" />
                </linearGradient>
              </defs>
              <path
                fill={
                  post.likes?.some(
                    (l) => (l.id || l._id || l) === currentUserId
                  )
                    ? `url(#like-gradient-${postId})`
                    : "currentColor"
                }
                d="M4 21h1V8H4c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2M20 8h-6.61l1.12-3.37c.2-.61.1-1.28-.27-1.8c-.38-.52-.98-.83-1.62-.83h-.61c-.3 0-.58.13-.77.36L7.01 7.44V21h10.31a2 2 0 0 0 1.87-1.3l2.76-7.35c.04-.11.06-.23.06-.35v-2c0-1.1-.9-2-2-2Z"
              />
            </svg>
            <span className={`text-[13px] font-medium transition-colors ${post.likes?.some((l) => (l.id || l._id || l) === currentUserId) ? "text-primary" : "text-[#a5a5a5] group-hover:text-white"}`}>
              Like
            </span>
          </button>
          <button
            onClick={() => setExpandedComments(!expandedComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors group"
          >
            <img
              src={CommentIcon}
              alt="Comment"
              className="w-[18px] h-[18px] object-contain transition-all duration-200 opacity-60 group-hover:opacity-100 brightness-0 invert"
            />
            <span className="text-[13px] font-medium text-[#a5a5a5] group-hover:text-white transition-colors">
              Comment
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSharePost(postId);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors group"
          >
            <img
              src={ShareIcon}
              alt="Share"
              className="w-[18px] h-[18px] object-contain transition-all duration-200 opacity-60 group-hover:opacity-100 brightness-0 invert"
            />
            <span className="text-[13px] font-medium text-[#a5a5a5] group-hover:text-white transition-colors">
              Share
            </span>
          </button>
        </div>

        {/* Expandable Comments Section -> Bottom Sheet Comments */}
        <AnimatePresence>
          {expandedComments && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedComments(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              
              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0f0f0f] rounded-t-[24px] border-t border-white/10 overflow-hidden flex flex-col max-h-[85vh] min-h-[50vh]"
                style={{
                  boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle & Header */}
                <div className="flex flex-col items-center pt-3 pb-2 border-b border-white/5 relative shrink-0">
                  <div className="w-10 h-1.5 bg-white/20 rounded-full mb-3" />
                  <h3 className="text-white font-bold text-[14px]">Comments</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedComments(false);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 mt-1.5 p-2 text-white/50 hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment) => {
                      const commentUser = comment.userId || comment.user;
                      return (
                        <div
                          key={comment.id || comment._id}
                          className="flex items-start gap-3"
                        >
                          <Link to={`/profile/${commentUser?.id || commentUser?._id}`} className="shrink-0">
                            <img
                              src={commentUser?.profilePicture || "/default-avatar.png"}
                              className="w-8 h-8 rounded-full object-cover border border-white/10"
                              alt=""
                            />
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <Link
                                to={`/profile/${commentUser?.id || commentUser?._id}`}
                                className="font-bold text-[12px] text-white hover:text-primary transition-colors"
                              >
                                {commentUser?.name || commentUser?.username || "Player"}
                              </Link>
                              <span className="text-[10px] text-white/40">
                                {getFormattedTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-[13px] text-foreground mt-0.5 break-words">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 text-center flex flex-col items-center">
                      <p className="text-[13px] text-white/40 font-medium">
                        No comments yet. Be the first to start the conversation!
                      </p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-3 border-t border-white/5 bg-background/50 backdrop-blur-md shrink-0 flex items-center gap-3">
                  <img
                    src={user?.profilePicture || "/default-avatar.png"}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                    alt=""
                  />
                  <Input
                    type="text"
                    placeholder={`Add a comment for ${post.adminId?.name || post.author?.name || "Player"}...`}
                    className="flex-1 bg-white/5 border-white/10 rounded-full px-4 h-10 text-[13px] font-medium outline-none text-white placeholder:text-muted-foreground focus:border-primary/50 focus:bg-white/10 transition-all"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                    className={`text-[12px] font-bold px-4 h-10 rounded-full transition-all shrink-0 ${
                      commentInput.trim()
                        ? "bg-primary text-black hover:scale-105 cursor-pointer"
                        : "bg-white/5 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    Post
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PostItem.displayName = "PostItem";

export default PostItem;
