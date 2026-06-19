import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import {
  Star,
  MessageSquare,
  Send,
  Loader2,
  Reply,
  X,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

/**
 * ProfessionalReviews ΓÇö High-fidelity feedback management.
 * Fully rebranded for the Scorer Portal with Teal Green (#BFF367) and Inter font.
 */

export default function ProfessionalReviews() {
  const { role, user: authUser } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#BFF367" : "#BFF367";

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const profId = authUser?._id || authUser?.id || authUser?.user;
      if (!profId) return;
      const res = await axiosInstance.get(
        `/api/professional/details/${profId}?date=${format(new Date(), "yyyy-MM-dd")}`
      );
      setReviews(res.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    try {
      setActionLoading(true);
      await axiosInstance.post("/api/professional/review/reply", {
        reviewId,
        reply: replyText,
      });
      toast.success("Response dispatched to client", {
        style: {
          background: "#000",
          color: "#fff",
          border: `1px solid ${themeColor}`,
          fontSize: "10px",
          fontWeight: "black",
        },
      });
      setReplyText("");
      setReplyingTo(null);
      fetchReviews();
    } catch (error) {
      toast.error("Dispatch failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="py-24 flex justify-center">
        <Loader2
          className="animate-spin"
          style={{ color: themeColor }}
          size={48}
        />
      </div>
    );

  return (
    <div className="space-y-10 animate-fade-in font-inter h-full custom-scrollbar pb-32">
      <div className="pb-8 border-b border-white/5 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white font-inter uppercase">
            User <span style={{ color: themeColor }}>FEEDBACK</span>
          </h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] font-inter mt-2">
            Engage with verified clients and maintain your professional standing
          </p>
        </div>
        <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-[8px] flex items-center gap-4">
          <div className="w-10 h-10 rounded-[8px] bg-white/5 flex items-center justify-center border border-white/5">
            <Star size={20} style={{ color: themeColor, fill: themeColor }} />
          </div>
          <div>
            <p className="text-[14px] font-black text-white leading-none">
              {(
                reviews.reduce((acc, curr) => acc + curr.rating, 0) /
                (reviews.length || 1)
              ).toFixed(1)}
            </p>
            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mt-1">
              Average Index
            </p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-black rounded-[8px] border-2 border-white/5 border-dashed p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#BFF367]/5 to-transparent opacity-50" />
          <MessageSquare
            size={64}
            className="text-neutral-900 mb-6 relative z-10"
          />
          <h3 className="text-[12px] font-black text-neutral-700 uppercase tracking-[0.4em] font-inter mb-2 relative z-10">
            Feedback Vault Empty
          </h3>
          <p className="text-[11px] text-neutral-800 font-inter relative z-10 max-w-xs mx-auto">
            Client appraisals and performance metrics will be archived here upon
            receipt.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-black border border-white/5 rounded-[8px] overflow-hidden group hover:border-[#BFF367]/20 transition-all duration-500 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-3xl pointer-events-none" />
              <div className="p-8 lg:p-10 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                  <div className="flex gap-5">
                    <div
                      onClick={() =>
                        review.user?._id &&
                        navigate(`/profile/${review.user._id}`)
                      }
                      className="w-16 h-16 rounded-[8px] border border-white/5 overflow-hidden cursor-pointer hover:border-[#BFF367]/50 transition-all shadow-xl group-hover:scale-105"
                    >
                      {review.user?.profilePicture ? (
                        <img
                          src={review.user.profilePicture}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-[18px] font-black text-neutral-500 font-inter uppercase">
                          {review.user?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4
                        onClick={() =>
                          review.user?._id &&
                          navigate(`/profile/${review.user._id}`)
                        }
                        className="text-[18px] font-black text-white tracking-tight cursor-pointer hover:opacity-80 transition-opacity font-inter uppercase"
                        style={{ "--hover-color": themeColor }}
                      >
                        {review.user?.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#BFF367]/10 rounded-[6px] border border-[#BFF367]/20">
                          <BadgeCheck size={12} style={{ color: themeColor }} />
                          <p
                            className="text-[9px] font-black uppercase tracking-[0.1em] font-inter"
                            style={{ color: themeColor }}
                          >
                            Verified Client
                          </p>
                        </div>
                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest font-inter">
                          {format(new Date(review.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/[0.02] p-3 rounded-[8px] border border-white/5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < review.rating ? "" : "text-neutral-800"}
                        style={{
                          color: i < review.rating ? themeColor : undefined,
                          fill: i < review.rating ? themeColor : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative p-8 bg-white/[0.02] border border-white/5 rounded-[8px] mb-10 group-hover:border-[#BFF367]/10 transition-all">
                  <p className="text-[15px] text-neutral-400 font-inter leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </div>

                {review.reply ? (
                  <div
                    className="ml-6 md:ml-12 p-8 bg-white/[0.03] border-l-4 rounded-r-[2rem] shadow-inner"
                    style={{ borderLeftColor: themeColor }}
                  >
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-3 font-inter"
                      style={{ color: themeColor }}
                    >
                      <Reply size={14} /> Official Response
                    </p>
                    <p className="text-[14px] text-neutral-300 font-inter leading-relaxed">
                      "{review.reply}"
                    </p>
                  </div>
                ) : replyingTo === review._id ? (
                  <div className="ml-6 md:ml-12 space-y-6 animate-in slide-in-from-top-4 duration-300 relative z-20">
                    <div className="relative">
                      <textarea
                        placeholder="Draft your official response..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-[8px] p-6 text-[14px] text-white focus:border-[#BFF367]/50 outline-none h-32 resize-none font-inter font-medium transition-all"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="absolute top-4 right-4 p-2 text-neutral-600 hover:text-white transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleReply(review._id)}
                        disabled={actionLoading}
                        className="flex-[2] h-14 text-black rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl"
                        style={{
                          backgroundColor: themeColor,
                          boxShadow: `0 10px 25px ${themeColor}33`,
                        }}
                      >
                        {actionLoading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Send size={18} />
                        )}{" "}
                        Dispatch Response
                      </button>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="flex-1 h-14 bg-white/5 text-neutral-500 border border-white/5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(review._id)}
                    className="ml-6 md:ml-12 px-6 py-3 bg-white/[0.03] border border-white/5 rounded-[8px] text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-[#BFF367]/10 hover:border-[#BFF367]/30 transition-all font-inter"
                    style={{ color: themeColor }}
                  >
                    <MessageSquare size={16} /> Lodge Official Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
