import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Star, MapPin, Heart } from "lucide-react";
import { followUser, unfollowUser } from "@redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { Button } from "@kridaz/ui";
import ShareIcon from "../../../assets/icons/share_icon.png";

const ProfessionalCard = ({ pro, getInitials }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn, user, followingIds = [] } = useSelector((state) => state.auth);
  
  // Local save state for visual effect
  const [isSaved, setIsSaved] = useState(false);

  const handleFollowToggle = async (e, targetUser) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please sign in to follow professionals.");
      navigate("/login");
      return;
    }
    const targetId = targetUser._id || targetUser.id;
    if (targetId === user?.id) return;

    try {
      const isFollowing = followingIds.includes(targetId);
      // Optimistic update
      dispatch(isFollowing ? unfollowUser(targetId) : followUser(targetId));

      if (isFollowing) {
        await axiosInstance.post(`/api/user/players/${targetId}/unfollow`);
        toast.success(`Unfollowed ${targetUser.name || "professional"}`);
      } else {
        await axiosInstance.post(`/api/user/players/${targetId}/follow`);
        toast.success(`Following ${targetUser.name || "professional"}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Action failed");
      // Revert on error
      const isFollowing = followingIds.includes(targetId);
      dispatch(isFollowing ? followUser(targetId) : unfollowUser(targetId));
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login to save.");
      return;
    }
    setIsSaved(!isSaved);
    if (!isSaved) toast.success("Saved professional");
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // Use navigator.share if available or just copy link
    const url = `${window.location.origin}/profile/${pro.userId || pro.id || pro._id}`;
    if (navigator.share) {
      navigator.share({
        title: pro.name,
        text: `Check out ${pro.name}'s profile on Kridaz!`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div 
      className="bg-[#111] rounded-2xl flex flex-col group hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative border border-white/5 aspect-[3/4]"
      onClick={() => navigate(`/profile/${pro.userId || pro.id || pro._id}`)}
    >
      {/* Background Image */}
      <img 
        src={pro.image || pro.profilePicture || pro.user?.profilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${pro.name || pro.user?.name || 'User'}`} 
        alt={pro.name || pro.user?.name || "Anonymous"} 
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${pro.name || pro.user?.name || 'User'}`;
        }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
      />

      {/* Top Gradient for Top Icons */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      {/* Top Left: Rating Pill */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[#FFD700] bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black border border-white/10 z-10">
        <Star size={10} className="fill-[#FFD700]" /> 
        {pro.rating ? pro.rating.toFixed(1) : "0.0"} 
      </div>

      {/* Top Right: Actions */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-10">
        <button onClick={handleSave} className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors hover:bg-black/80">
          <Heart size={12} className={isSaved ? "fill-primary text-primary" : "text-white/80"} />
        </button>
      </div>

      {/* Bottom Gradient for Bottom Text */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pointer-events-none z-0" />
      
      {/* Bottom Content Area */}
      <div className="relative mt-auto p-2.5 z-10 flex flex-col w-full">
        <h4 className="text-[13px] font-bold text-white truncate font-inter mb-1.5 shadow-black drop-shadow-md">
          {pro.name || pro.user?.name || "Anonymous"}
        </h4>
        
        <div className="flex items-end justify-between w-full mt-auto gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[9px] text-[#3b82f6] font-medium uppercase tracking-wider truncate shadow-black drop-shadow-sm">
              {pro.role || "Professional"}
            </p>
            <div className="flex items-center gap-1 text-white/60 text-[9px]">
              <MapPin size={9} className="text-white/40 shrink-0" />
              <span className="truncate">
                {pro.city ? pro.city.split(",")[0].trim() : pro.location || "Local Area"}
              </span>
            </div>
          </div>
          
          <button 
            onClick={(e) => handleFollowToggle(e, pro)}
            className={`text-[9px] font-black px-2.5 py-1 h-[22px] rounded transition-all flex items-center justify-center hover:scale-105 active:scale-95 shrink-0 mb-0.5 ${
              followingIds.includes(pro._id || pro.id)
                ? "bg-transparent text-white/50 border border-white/10 backdrop-blur-sm"
                : "bg-white hover:bg-gray-200 text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
            }`}
          >
            {followingIds.includes(pro._id || pro.id) ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCard;
