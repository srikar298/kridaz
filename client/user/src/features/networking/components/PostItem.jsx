import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, ShieldCheck, Video } from "lucide-react";
import CommentIcon from "../../../assets/icons/comment_icon.png";
import ShareIcon from "../../../assets/icons/share_icon.png";
import { AnimatePresence, motion } from "framer-motion";
import {
  useLikePostMutation,
  useAddPostCommentMutation,
} from "@redux/api/communityApi";
import toast from "react-hot-toast";import { Button, Input } from "@kridaz/ui";


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
      <div className="bg-background border border-white/5 rounded-[12px] overflow-hidden flex flex-col max-w-[470px] mx-auto w-full">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <Link
            to={`/profile/${post.adminId?.id || post.adminId?._id || post.author?.id || post.author?._id || post.authorId}`}
            className="flex items-center gap-3 group"
          >
            <img
              src={post.adminId?.profilePicture || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-[var(--primary)]/50 transition-colors"
              alt=""
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-white transition-colors">
                  {post.adminId?.name || post.author?.name || "Player"}
                </span>
                <ShieldCheck size={14} className="text-primary" />
              </div>
              <div className="text-[11px] font-bold text-muted-foreground mt-0.5">
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
          <div className="text-[13.5px] font-medium leading-relaxed px-4 pb-3">
            {post.title && <span className="font-bold mr-2">{post.title}</span>}
            <span className="text-white/90 whitespace-pre-wrap">
              {post.content}
            </span>
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

        {/* Likes Summary */}
        {post.likes?.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-medium text-white/50 px-4 py-3">
            <div className="flex -space-x-1.5 shrink-0">
              {post.likes.slice(0, 3).map((likeUser, i) => (
                <div
                  key={likeUser.id || likeUser._id || i}
                  className="w-5 h-5 rounded-full bg-zinc-800 border border-background overflow-hidden flex items-center justify-center shrink-0"
                >
                  {likeUser.profilePicture || likeUser.profileImage ? (
                    <img
                      src={likeUser.profilePicture || likeUser.profileImage}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-white text-[8px] font-bold">
                      {(likeUser.username ||
                        likeUser.name ||
                        "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/50 font-medium">
              {post.likes.length === 1 && (
                <span>
                  Liked by{" "}
                  <span className="font-bold text-white">
                    {post.likes[0].username || post.likes[0].name || "User"}
                  </span>
                </span>
              )}
              {post.likes.length === 2 && (
                <span>
                  Liked by{" "}
                  <span className="font-bold text-white">
                    {post.likes[0].username || post.likes[0].name || "User"}
                  </span>{" "}
                  and{" "}
                  <span className="font-bold text-white">
                    {post.likes[1].username || post.likes[1].name || "User"}
                  </span>
                </span>
              )}
              {post.likes.length > 2 && (
                <span>
                  Liked by{" "}
                  <span className="font-bold text-white">
                    {post.likes[0].username || post.likes[0].name || "User"}
                  </span>
                  ,{" "}
                  <span className="font-bold text-white">
                    {post.likes[1].username || post.likes[1].name || "User"}
                  </span>{" "}
                  and{" "}
                  <span className="font-bold text-white">
                    {post.likes.length - 2}{" "}
                    {post.likes.length - 2 === 1 ? "other" : "others"}
                  </span>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between border-t border-white/10 bg-background px-2 py-1">
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
            {post.likes?.length > 0 && (
              <span className="text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
                {post.likes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setExpandedComments(!expandedComments)}
            className="flex-1 flex items-center justify-center gap-2 py-2 transition-colors group"
          >
            <img
              src={CommentIcon}
              alt="Comment"
              className="w-[18px] h-[18px] object-contain transition-all duration-200 opacity-70 group-hover:opacity-100 brightness-0 invert"
            />
            {(post.totalComments > 0 || post.comments?.length > 0) && (
              <span className="text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
                {post.totalComments || post.comments.length}
              </span>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSharePost(postId);
            }}
            className="flex-1 flex items-center justify-center py-2 transition-colors group"
          >
            <img
              src={ShareIcon}
              alt="Share"
              className="w-[18px] h-[18px] object-contain transition-all duration-200 opacity-70 group-hover:opacity-100 brightness-0 invert"
            />
          </button>
        </div>

        {/* Expandable Comments Section */}
        <AnimatePresence>
          {expandedComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden bg-background"
            >
              <div className="space-y-3 pt-3 px-4 pb-4 border-t border-white/5">
                {post.comments && post.comments.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {post.comments.slice(0, 4).map((comment) => {
                      const commentUser = comment.userId || comment.user;
                      return (
                        <div
                          key={comment.id || comment._id}
                          className="flex items-start gap-2 text-[12px] leading-relaxed"
                        >
                          <Link
                            to={`/profile/${commentUser?.id || commentUser?._id}`}
                            className="font-bold text-white hover:text-primary transition-colors shrink-0"
                          >
                            {commentUser?.name ||
                              commentUser?.username ||
                              "Player"}
                          </Link>
                          <span className="text-foreground break-words">
                            {comment.text}
                          </span>
                        </div>
                      );
                    })}
                    {post.comments.length > 4 && (
                      <button className="text-[11px] text-primary font-bold hover:underline">
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                )}
                {post.comments?.length === 0 && (
                  <p className="text-[12px] text-white/30 italic">
                    No comments yet. Be the first!
                  </p>
                )}

                {/* Comment Input */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <img
                    src={user?.profilePicture || "/default-avatar.png"}
                    className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                    alt=""
                  />
                  <Input
                    type="text"
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-[12px] font-medium outline-none text-white placeholder:text-muted-foreground"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment();
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                    className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-all ${
                      commentInput.trim()
                        ? "bg-primary text-black hover:bg-primary/80 cursor-pointer"
                        : "bg-card text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PostItem.displayName = "PostItem";

export default PostItem;
