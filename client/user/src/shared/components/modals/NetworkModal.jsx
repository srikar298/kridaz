import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Search, Loader2, Users } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { useSelector, useDispatch } from "react-redux";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import useLoginOnDemand from "@hooks/useLoginOnDemand";
import toast from "react-hot-toast";

const NetworkModal = ({ isOpen, onClose, userId, type, initialCount }) => {
  const dispatch = useDispatch();
  const { user: currentUser, followingIds } = useSelector(
    (state) => state.auth
  );
  const { gateInteraction } = useLoginOnDemand();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      fetchNetwork();
    }
  }, [isOpen, userId, type]);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/user/players/${userId}/network`
      );
      if (response.data.success) {
        setUsers(
          type === "followers"
            ? response.data.followers
            : response.data.following
        );
      }
    } catch (error) {
      toast.error("Failed to load network");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser) => {
    gateInteraction(
      async () => {
        const targetId = targetUser.id || targetUser._id;
        const isFollowing = followingIds.includes(targetId);

        // Optimistic Update
        dispatch(isFollowing ? unfollowUser(targetId) : followUser(targetId));

        try {
          if (isFollowing) {
            await axiosInstance.post(`/api/user/players/${targetId}/unfollow`);
          } else {
            await axiosInstance.post(`/api/user/players/${targetId}/follow`);
          }
        } catch (error) {
          // Revert on error
          dispatch(isFollowing ? followUser(targetId) : unfollowUser(targetId));
          toast.error("Action failed");
        }
      },
      {
        title: "Follow Player",
        message: `Sign in to follow ${targetUser.name} and stay updated.`,
      }
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.businessDetails?.businessName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aId = a.id || a._id;
    const bId = b.id || b._id;
    const aIsMutual = followingIds.includes(aId);
    const bIsMutual = followingIds.includes(bId);
    if (aIsMutual && !bIsMutual) return -1;
    if (!aIsMutual && bIsMutual) return 1;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#000000] border border-[#2D2D2D] w-full max-w-md rounded-[8px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[#2D2D2D]">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            {type === "followers" ? "Followers" : "Following"}
            <span className="text-[#BFF367] bg-[#BFF367]/10 px-2 py-0.5 rounded-full text-[10px]">
              {initialCount}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#000000] rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-[#2D2D2D]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
              size={16}
            />
            <input
              type="text"
              placeholder="SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[6px] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#BFF367]/50 transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="h-[400px] overflow-y-auto no-scrollbar p-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-[#BFF367]" size={32} />
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="space-y-1">
              {sortedUsers.map((user) => {
                const userId = user.id || user._id;
                const isFollowing = followingIds.includes(userId);
                const isSelf = (currentUser?.id || currentUser?._id) === userId;

                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 hover:bg-[#000000] rounded-[8px] transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Link
                        to={`/profile/${userId}`}
                        onClick={onClose}
                        className="shrink-0 w-10 h-10 rounded-[6px] overflow-hidden bg-[#000000] border border-[#2D2D2D]"
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling)
                                e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center bg-[#BFF367]/10"
                          style={{
                            display: user.profilePicture ? "none" : "flex",
                          }}
                        >
                          <span className="text-[#BFF367] font-black text-[10px]">
                            {user.name
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </span>
                        </div>
                      </Link>
                      <div className="overflow-hidden">
                        <Link
                          to={`/profile/${user.id || user._id}`}
                          onClick={onClose}
                          className="block font-bold text-xs text-white hover:text-[#BFF367] transition-colors truncate"
                        >
                          {user.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest truncate">
                          <span>
                            @
                            {user.username ||
                              user.businessDetails?.businessName ||
                              "player"}
                          </span>
                          {isFollowing && (
                            <>
                              <span className="text-white/20">ΓÇó</span>
                              <span className="text-[#BFF367]/60">
                                Following
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isSelf && (
                      <button
                        onClick={() => handleFollowToggle(user)}
                        className={`shrink-0 px-3 py-1.5 rounded-[6px] text-[9px] font-bold uppercase tracking-widest transition-all ${isFollowing ? "bg-[#000000] text-white/40 border border-[#2D2D2D] hover:bg-white/10" : "bg-[#BFF367] text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(85,222,232,0.15)]"}`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-2">
              <Users size={40} />
              <p className="text-[10px] uppercase tracking-[0.2em]">
                No users found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkModal;
