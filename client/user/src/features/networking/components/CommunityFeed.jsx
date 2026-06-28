import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  useLazyGetCommunityFeedQuery,
  useDeletePostMutation,
} from "@redux/api/communityApi";
import { useLazySearchPlayersQuery } from "@redux/api/teamApi";
import { useSocket } from "@context/SocketContext";
import PostItem from "./PostItem";
import ShareModal from "./ShareModal";
import ReportModal from "./ReportModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { PostSkeleton } from "../../../shared/components/ui";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import PostDetailModal from "./PostDetailModal";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };

const CustomDropdown = ({
  value,
  options,
  onChange,
  placeholder = "Select",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || {
    label: placeholder,
    value: "",
  };

  return (
    <div className="relative flex-1 md:min-w-[120px]" ref={dropdownRef}>
      <div
        className="w-[120px] h-[34px] bg-[#161616] border border-[#2b2b2b] rounded-[8px] pt-[8px] pr-[8px] pb-[8px] pl-[10px] text-white text-[13px] font-medium focus:outline-none hover:border-white/20 transition-all cursor-pointer flex items-center justify-between gap-[4px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-[120px] bg-[#161616] border border-[#2b2b2b] rounded-[8px] shadow-2xl overflow-hidden z-50 py-1"
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`px-3 py-1.5 text-[11px] sm:text-[12px] font-medium cursor-pointer transition-colors ${
                  value === opt.value
                    ? "bg-primary/10 text-primary"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommunityFeed = ({
  user,
  isLoggedIn,
  isAdmin,
  gateInteraction,
  activeFilter,
  handleSetActiveFilter,
  activeSportFilter,
  setActiveSportFilter,
  debouncedSearchQuery,
  children,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userLocation = useSelector((state) => state.ui.userLocation);
  const locationStatus = useSelector((state) => state.ui.locationStatus);
  const { socket } = useSocket();

  const [triggerGetFeed] = useLazyGetCommunityFeedQuery();
  const [triggerSearchPlayers] = useLazySearchPlayersQuery();
  const [deletePost] = useDeletePostMutation();

  // Pagination & lists state
  const [postsPage, setPostsPage] = useState(1);
  const [loadedPosts, setLoadedPosts] = useState([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showDesktopInlinePost, setShowDesktopInlinePost] = useState(false);
  const [sortOrder, setSortOrder] = useState("latest");

  const [playersPage, setPlayersPage] = useState(1);
  const [loadedPlayers, setLoadedPlayers] = useState([]);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [deletePostId, setDeletePostId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check URL params for creating a post (e.g. from Team Profile share)
  useEffect(() => {
    if (searchParams.get("createPost") === "true") {
      const text = searchParams.get("text");

      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("createPost");
      newParams.delete("text");
      setSearchParams(newParams, { replace: true });

      navigate("/create-post", { state: { preSelectedText: text } });
    }
  }, [searchParams, setSearchParams, navigate]);

  // Reset lists and page numbers when search query or filters change
  useEffect(() => {
    setLoadedPosts([]);
    setPostsPage(1);
    setHasMorePosts(true);

    setLoadedPlayers([]);
    setPlayersPage(1);
    setHasMorePlayers(true);
  }, [debouncedSearchQuery, activeFilter, activeSportFilter, sortOrder]);

  // Fetch function for posts feed
  const fetchPosts = async (pageNumber, isSearch) => {
    if (postsLoading) return;
    setPostsLoading(true);

    try {
      const params = {
        page: pageNumber,
        limit: 10,
        sort: sortOrder,
        excludeType: "LOOKING_FOR",
      };

      if (isSearch) {
        params.search = debouncedSearchQuery;
      } else {
        if (activeFilter === "Following") {
          params.following = "true";
        }
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }
      }

      const res = await triggerGetFeed(params).unwrap();
      const newPosts = res?.posts || [];

      setLoadedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id || p.id));
        const filtered = newPosts.filter(
          (p) => !existingIds.has(p._id || p.id)
        );
        return pageNumber === 1 ? newPosts : [...prev, ...filtered];
      });

      if (newPosts.length < 10) {
        setHasMorePosts(false);
      } else {
        setHasMorePosts(true);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error("Failed to load posts");
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch function for search players
  const fetchPlayers = async (pageNumber) => {
    if (!debouncedSearchQuery.trim()) return;
    if (playersLoading) return;
    setPlayersLoading(true);

    try {
      const res = await triggerSearchPlayers({
        query: debouncedSearchQuery,
        page: pageNumber,
        limit: 10,
      }).unwrap();
      const newPlayers = res?.players || [];

      setLoadedPlayers((prev) => {
        const existingIds = new Set(prev.map((p) => p.id || p._id));
        const filtered = newPlayers.filter(
          (p) => !existingIds.has(p.id || p._id)
        );
        return pageNumber === 1 ? newPlayers : [...prev, ...filtered];
      });

      if (newPlayers.length < 10) {
        setHasMorePlayers(false);
      } else {
        setHasMorePlayers(true);
      }
    } catch (err) {
      console.error("Error searching players:", err);
    } finally {
      setPlayersLoading(false);
    }
  };

  // Effects to trigger data fetches
  useEffect(() => {
    if (locationStatus === "detecting") return;
    if (postsPage === 1) {
      fetchPosts(1, !!debouncedSearchQuery.trim());
    }
  }, [
    postsPage,
    debouncedSearchQuery,
    activeFilter,
    activeSportFilter,
    sortOrder,
    userLocation,
    locationStatus,
  ]);

  useEffect(() => {
    if (postsPage > 1) {
      fetchPosts(postsPage, !!debouncedSearchQuery.trim());
    }
  }, [postsPage]);

  useEffect(() => {
    if (playersPage === 1 && debouncedSearchQuery.trim()) {
      fetchPlayers(1);
    }
  }, [playersPage, debouncedSearchQuery]);

  useEffect(() => {
    if (playersPage > 1 && debouncedSearchQuery.trim()) {
      fetchPlayers(playersPage);
    }
  }, [playersPage]);

  // Window scroll listener for posts infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (postsLoading || !hasMorePosts) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200
      ) {
        setPostsPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [postsLoading, hasMorePosts]);

  // Horizontal scroll listener for players search results pagination
  const handlePlayersHorizontalScroll = (e) => {
    if (playersLoading || !hasMorePlayers) return;
    const target = e.currentTarget;
    if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 100) {
      setPlayersPage((prev) => prev + 1);
    }
  };

  // Socket.io updates for reactive feed lists
  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (newPost) => {
      const formatted = {
        ...newPost,
        _id: newPost.id || newPost._id,
        adminId: newPost.author,
        mediaUrl: newPost.mediaUrls?.[0],
        image: newPost.mediaType === "image" ? newPost.mediaUrls?.[0] : null,
        videoUrl: newPost.mediaType === "video" ? newPost.mediaUrls?.[0] : null,
        likesCount: newPost.likes?.length || 0,
        totalComments: newPost.comments?.length || 0,
        comments:
          newPost.comments?.map((c) => ({
            ...c,
            userId: c.user,
          })) || [],
      };

      setLoadedPosts((prev) => {
        if (
          prev.find((p) => (p._id || p.id) === (formatted._id || formatted.id))
        )
          return prev;
        return [formatted, ...prev];
      });
    };

    const handlePostLiked = ({ postId, likes, likesCount }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              likes,
              likesCount: likesCount !== undefined ? likesCount : likes.length,
            };
          }
          return post;
        })
      );
    };

    const handlePostCommented = ({ postId, comments }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              comments: comments.map((c) => ({ ...c, userId: c.user })),
              totalComments: comments.length,
            };
          }
          return post;
        })
      );
    };

    const handlePostDeleted = (postId) => {
      setLoadedPosts((prev) =>
        prev.filter((post) => post._id !== postId && post.id !== postId)
      );
    };

    const handleMediaProgress = ({ mediaId, progress }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === mediaId || post.id === mediaId) {
            return {
              ...post,
              status: "pending",
              processingProgress: progress,
            };
          }
          return post;
        })
      );
    };

    const handleMediaComplete = ({ mediaId, hlsUrl, thumbnailUrl }) => {
      setLoadedPosts((prev) =>
        prev.map((post) => {
          if (post._id === mediaId || post.id === mediaId) {
            return {
              ...post,
              status: "ready",
              mediaUrl: hlsUrl,
              image: thumbnailUrl,
              processingProgress: 100,
            };
          }
          return post;
        })
      );
    };

    socket.on("new_community_post", handleNewPost);
    socket.on("community_post_liked", handlePostLiked);
    socket.on("community_post_commented", handlePostCommented);
    socket.on("community_post_deleted", handlePostDeleted);
    socket.on("MEDIA_PROCESSING_PROGRESS", handleMediaProgress);
    socket.on("MEDIA_PROCESSING_COMPLETE", handleMediaComplete);

    return () => {
      socket.off("new_community_post", handleNewPost);
      socket.off("community_post_liked", handlePostLiked);
      socket.off("community_post_commented", handlePostCommented);
      socket.off("community_post_deleted", handlePostDeleted);
      socket.off("MEDIA_PROCESSING_PROGRESS", handleMediaProgress);
      socket.off("MEDIA_PROCESSING_COMPLETE", handleMediaComplete);
    };
  }, [socket]);

  // Handle post card update callbacks (optimistic updates/mutation updates)
  const handleUpdatePost = (postId, updaterFn) => {
    setLoadedPosts((prev) =>
      prev.map((p) => {
        if ((p._id || p.id) === postId) {
          return updaterFn(p);
        }
        return p;
      })
    );
  };

  // Handle post card deletion callbacks
  const handleDeletePost = (postId) => {
    setDeletePostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    setIsDeleting(true);
    try {
      await deletePost(deletePostId).unwrap();
      toast.success("Post deleted");
      setLoadedPosts((prev) =>
        prev.filter((p) => (p._id || p.id) !== deletePostId)
      );
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
      setDeletePostId(null);
    }
  };

  return (
    <div className="space-y-6 mb-4">
      {/* Search overlay/children placeholder */}
      {!debouncedSearchQuery.trim() && children}

      {/* Filters Row */}
      {!debouncedSearchQuery.trim() && (
        <div className="mb-6 flex flex-col gap-4 px-2 md:px-0">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-[18px] font-semibold text-white tracking-[0px] leading-[1.2] normal-case" style={{ fontFamily: "'Inter', sans-serif" }}>
              Your Social Arena
            </h2>
            <div className="w-[120px]">
              <CustomDropdown
                value={activeFilter}
                onChange={handleSetActiveFilter}
                options={[
                  "All",
                  "Following",
                  "Highlights",
                  "Match Moments",
                  "Announcements",
                ].map((f) => ({ label: f, value: f }))}
              />
            </div>
          </div>

          {/* Sport Category Pill Row */}
          <div className="flex items-center overflow-x-auto w-full no-scrollbar bg-[#161616] p-[6px] h-[48px] rounded-[12px] border border-[#2b2b2b] gap-[6px]">
            <button
              onClick={() => setActiveSportFilter("")}
              className={`shrink-0 px-4 h-full flex items-center justify-center rounded-[8px] text-[13px] font-medium transition-all ${
                activeSportFilter === "" ? "bg-[#333333] text-white" : "text-[#a5a5a5] hover:text-white"
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              All Categories
            </button>
            {[
              { label: "Cricket", value: "cricket", icon: "🏏" },
              { label: "Football", value: "football", icon: "⚽" },
              { label: "Basketball", value: "basketball", icon: "🏀" },
              { label: "Rugby", value: "rugby", icon: "🏉" },
              { label: "Baseball", value: "baseball", icon: "⚾" },
              { label: "Hockey", value: "hockey", icon: "🏑" },
              { label: "Athletics", value: "athletics", icon: "🏃" }
            ].map((sport) => (
              <button
                key={sport.value}
                onClick={() => setActiveSportFilter(sport.value)}
                className={`shrink-0 flex items-center justify-center gap-2 px-4 h-full rounded-[8px] text-[13px] font-medium transition-all ${
                  activeSportFilter === sport.value ? "bg-[#333333] text-white" : "text-[#a5a5a5] hover:text-white"
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <span className="grayscale opacity-70 text-[14px] leading-none">{sport.icon}</span>
                {sport.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Players Matching Section */}
      {debouncedSearchQuery.trim() !== "" && (
        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center justify-between mb-1 px-2 md:px-0">
            <h3
              className="text-xs font-black uppercase tracking-widest text-primary"
              style={HEADING_STYLE}
            >
              PLAYERS MATCHING "{debouncedSearchQuery}"
            </h3>
            {playersLoading && (
              <Loader2 size={16} className="text-primary animate-spin" />
            )}
          </div>

          {loadedPlayers.length === 0 && !playersLoading ? (
            <div className="text-center py-6 text-white/30 font-bold text-[12px] uppercase tracking-wider">
              No players found
            </div>
          ) : (
            <div
              className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-1 no-scrollbar scroll-smooth px-2 md:px-0"
              style={{
                maxHeight: "240px",
                minHeight: loadedPlayers.length > 1 ? "180px" : "90px",
              }}
              onScroll={handlePlayersHorizontalScroll}
            >
              {loadedPlayers.map((player) => (
                <div
                  key={player.id || player._id}
                  onClick={() =>
                    navigate(`/profile/${player.id || player._id}`)
                  }
                  className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 hover:border-primary/30 p-3 rounded-[8px] cursor-pointer transition-all min-w-[220px] max-w-[280px] group shrink-0"
                >
                  <div className="w-[42px] h-[42px] rounded-full bg-card border border-white/10 overflow-hidden shrink-0">
                    <img
                      src={
                        player.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`
                      }
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-white group-hover:text-primary transition-colors truncate">
                      {player.name}
                    </div>
                    <div className="text-[11px] font-medium text-white/40 truncate">
                      @
                      {player.username ||
                        player.name.toLowerCase().replace(/\s+/g, "")}
                    </div>
                    {(player.city || player.state) && (
                      <div className="text-[9px] font-semibold text-primary mt-0.5 uppercase tracking-wider truncate">
                        {player.city}
                        {player.city && player.state ? ", " : ""}
                        {player.state}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {hasMorePlayers && playersLoading && (
                <div className="flex items-center justify-center px-6 shrink-0 h-full">
                  <Loader2 size={24} className="text-primary animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Posts Heading if searching */}
      {debouncedSearchQuery.trim() !== "" && (
        <div className="pt-2">
          <h3
            className="text-xs font-black uppercase tracking-widest text-primary"
            style={HEADING_STYLE}
          >
            POSTS MATCHING "{debouncedSearchQuery}"
          </h3>
        </div>
      )}

      {/* Feed list */}
      {postsLoading && loadedPosts.length === 0 ? (
        <div className="space-y-6 px-2 md:px-0">
          {[1, 2, 3].map((n) => (
            <PostSkeleton key={`post-skeleton-${n}`} />
          ))}
        </div>
      ) : loadedPosts.length === 0 ? (
        <div className="bg-background border border-white/5 rounded-[8px] p-16 text-center text-white/30 font-bold uppercase tracking-widest text-sm mx-2 md:mx-0">
          No posts found
        </div>
      ) : (
        <div className="space-y-6 px-2 md:px-0">
          {loadedPosts.map((post) => (
            <PostItem
              key={post._id || post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              gateInteraction={gateInteraction}
              onUpdatePost={handleUpdatePost}
              onDeletePost={handleDeletePost}
              onSharePost={(id) => setSharePostId(id)}
              onReportPost={(id) => setReportPostId(id)}
            />
          ))}
          {hasMorePosts && postsLoading && (
            <div className="py-6 flex justify-center">
              <Loader2 size={24} className="text-primary animate-spin" />
            </div>
          )}
          {!hasMorePosts && loadedPosts.length > 0 && (
            <div className="py-12 flex flex-col w-full px-2">
              <h2 className="text-[72px] sm:text-[96px] md:text-[120px] font-black leading-[0.85] text-[#1a1a1a] tracking-tighter uppercase font-poppins">
                GAME ON<br />ALWAYS.
              </h2>
              <div className="text-[13px] sm:text-[14px] text-white/90 font-medium mt-6 flex items-center gap-1.5 font-inter">
                Make with <span className="text-red-500 text-lg">❤️</span> in Hyderabad
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {searchParams.get("post") && (
          <PostDetailModal
            postId={searchParams.get("post")}
            onClose={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("post");
              setSearchParams(newParams, { replace: true });
            }}
            user={user}
            isAdmin={isAdmin}
            gateInteraction={gateInteraction}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onSharePost={(id) => setSharePostId(id)}
            onReportPost={(id) => setReportPostId(id)}
          />
        )}
        {sharePostId && (
          <ShareModal
            postId={sharePostId}
            onClose={() => setSharePostId(null)}
          />
        )}
        {reportPostId && (
          <ReportModal
            postId={reportPostId}
            onClose={() => setReportPostId(null)}
          />
        )}
        {deletePostId && (
          <DeleteConfirmModal
            onClose={() => setDeletePostId(null)}
            onConfirm={confirmDeletePost}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityFeed;
