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
      className="bg-[#111] border border-white/5 rounded-2xl p-4 flex gap-4 items-center group hover:border-white/10 transition-colors cursor-pointer"
      onClick={() => navigate(`/profile/${pro.userId || pro.id || pro._id}`)}
    >
      <div className="w-20 h-24 rounded-xl bg-card overflow-hidden shrink-0 border border-white/10 relative">
        {pro.image || pro.profilePicture ? (
          <img src={pro.image || pro.profilePicture} alt={pro.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#222] to-[#111]">
            <span className="text-primary/50 font-bold text-2xl">{getInitials(pro.name)}</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-[15px] font-bold text-white truncate font-inter">
              {pro.name || "Anonymous"}
            </h4>
            
            {/* Like and Share Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 text-[#FFD700] text-[10px] font-black mr-1">
                <Star size={10} className="fill-[#FFD700]" /> 
                {pro.rating ? pro.rating.toFixed(1) : "0.0"} 
                <span className="text-white/40 font-medium ml-0.5">({pro.reviewCount || 0})</span>
              </div>
              
              <button onClick={handleSave} className="group p-1 -m-1">
                <Heart 
                  size={14} 
                  className={`transition-all duration-200 ${isSaved ? "fill-primary text-primary" : "text-white/30 group-hover:text-white"}`} 
                />
              </button>
              
              <button onClick={handleShare} className="group p-1 -m-1">
                <img
                  src={ShareIcon}
                  alt="Share"
                  className="w-[14px] h-[14px] object-contain transition-all duration-200 opacity-30 group-hover:opacity-100 brightness-0 invert"
                />
              </button>
            </div>
          </div>
          
          <p className="text-[11px] text-white/50 font-medium mb-1">
            {pro.role || "Professional"}
          </p>
          
          <div className="flex items-center gap-1 text-white/40 text-[10px]">
            <MapPin size={10} />
            <span className="truncate max-w-[120px]">
              {pro.city ? pro.city.split(",")[0].trim() : pro.location || "Local Area"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="text-[10px] font-medium text-white/40">
            <span className="text-white text-sm font-black">₹{pro.price || "0"}</span> / match
          </div>
          <Button 
            onClick={(e) => handleFollowToggle(e, pro)}
            className={`text-[10px] font-black px-5 py-2 h-auto rounded-lg transition-all hover:scale-105 active:scale-95 ${
              followingIds.includes(pro._id || pro.id)
                ? "bg-transparent text-white/50 border border-white/10"
                : "bg-primary hover:bg-primary/90 text-black shadow-[0_4px_16px_rgba(191,243,103,0.3)]"
            }`}
          >
            {followingIds.includes(pro._id || pro.id) ? "Following" : "Follow"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalCard;
