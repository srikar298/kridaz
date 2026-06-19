import React from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircleReply,
  Activity,
} from "lucide-react";
import useVenueOwnerReviews from "@hooks/venue-owner/useVenueOwnerReviews";
import ReviewsSkeleton from "./ReviewSkeleton";
import { useNavigate } from "react-router-dom";

const VenueOwnerReviews = () => {
  const { turfs, selectedTurf, setSelectedTurf, loading, error } =
    useVenueOwnerReviews();
  const navigate = useNavigate();

  if (loading) return <ReviewsSkeleton />;
  if (error)
    return (
      <div className="text-red-500 p-4 font-bold uppercase tracking-wider">
        {error}
      </div>
    );

  const currentTurf = turfs.find((t) => t.id === selectedTurf);
  const reviews = currentTurf?.reviews || [];

  // Analytics Calculations
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(
          1
        )
      : 0;
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const criticalReviews = reviews.filter((r) => r.rating <= 2).length;

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="px-1 lg:px-3 lg:pt-2 lg:pb-3 space-y-8 animate-fade-in pt-0 pb-4 h-full relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B3DC26]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B3DC26]/5 blur-[120px] pointer-events-none" />
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] mt-2 sm:mt-0 font-bold font-['Open_Sans'] tracking-tight uppercase leading-none whitespace-nowrap">
                Customer Reviews
              </h2>
            </div>
            <p className="text-white/70 font-inter font-light text-[14px] md:text-[20px] mt-2">
              Monitor player sentiment and service quality.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar: Venue Selection */}
          <div className="w-full lg:w-1/3 space-y-4 md:space-y-6">
            <div className="bg-[#121212] border border-white/10 rounded-[16px] p-4 md:p-6 shadow-[var(--shadow-2)]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-3 bg-[#B3DC26] rounded-full" />
                <h3 className="text-[12px] font-bold font-['Open_Sans'] text-white/70 uppercase tracking-[0.5px]">
                  Select Arena
                </h3>
              </div>

              <ul className="space-y-3">
                {turfs.map((turf) => (
                  <li key={turf.id}>
                    <button
                      className={`w-full text-left p-4 rounded-[16px] border transition-all flex justify-between items-center group ${selectedTurf === turf.id ? "bg-[#B3DC26]/10 border-[#B3DC26]/40 text-white" : "bg-[#1B1B1B] border-white/10 text-white/70 hover:border-[#B3DC26]/20 hover:text-white"}`}
                      onClick={() => setSelectedTurf(turf.id)}
                    >
                      <span className="font-bold text-[13px] uppercase tracking-widest">
                        {turf.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-[16px] font-bold text-[11px] flex items-center gap-1.5 ${selectedTurf === turf.id ? "bg-gradient-to-r from-[#55DEE8] to-[#B3DC26] shadow-[0_8px_24px_rgba(179,220,38,0.15)] border-none text-black" : "bg-[#1B1B1B] text-white/70 border border-white/10 group-hover:border-[#B3DC26]/20"}`}
                      >
                        <Star
                          size={11}
                          className={
                            selectedTurf === turf.id ? "fill-black" : ""
                          }
                        />
                        {turf.avgRating.toFixed(1)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Content Area: Analytics & Reviews */}
          <div className="w-full lg:w-2/3 space-y-6">
            {currentTurf ? (
              <>
                {/* Analytics Dashboard */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#121212] border border-white/10 rounded-[16px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Star
                        size={40}
                        className="text-[#B3DC26] fill-[#BFF367]"
                      />
                    </div>
                    <p className="text-[12px] font-bold font-['Open_Sans'] text-white/70 uppercase tracking-[0.5px] mb-1">
                      Average Score
                    </p>
                    <h3 className="text-2xl font-semibold text-white tracking-tight flex items-baseline gap-2">
                      {avgRating}{" "}
                      <span className="text-[12px] text-white/70">/ 5.0</span>
                    </h3>
                  </div>

                  <div className="bg-[#121212] border border-white/10 rounded-[16px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#B3DC26]/30 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Activity size={40} className="text-[#B3DC26]" />
                    </div>
                    <p className="text-[12px] font-bold font-['Open_Sans'] text-white/70 uppercase tracking-[0.5px] mb-1">
                      Total Reviews
                    </p>
                    <h3 className="text-2xl font-semibold text-[#B3DC26] tracking-tight">
                      {totalReviews}
                    </h3>
                    <p className="text-[11px] text-[#444] mt-1 font-medium tracking-wide">
                      All Time Ratings
                    </p>
                  </div>
                </div>

                {/* Review List */}
                <div className="bg-[#121212] border border-white/10 rounded-[16px] p-6 space-y-6 shadow-[var(--shadow-2)]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <h2 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#B3DC26] rounded-full"></span>
                      Feedback Logs ({totalReviews})
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-[#1B1B1B] border border-white/10 p-5 rounded-[16px] hover:border-[#B3DC26]/30 transition-colors group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() =>
                                  review.user?._id &&
                                  navigate(`/profile/${review.user._id}`)
                                }
                                className="w-10 h-10 rounded-full border border-white/10 overflow-hidden cursor-pointer hover:border-[#B3DC26] transition-all"
                              >
                                {review.user?.profilePicture ? (
                                  <img
                                    src={review.user.profilePicture}
                                    alt={review.userName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] font-black text-white/70">
                                    {review.userName.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3
                                  onClick={() =>
                                    review.user?._id &&
                                    navigate(`/profile/${review.user._id}`)
                                  }
                                  className="text-[13px] font-bold text-white uppercase tracking-widest cursor-pointer hover:text-[#B3DC26] transition-colors"
                                >
                                  {review.userName}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold text-[#B3DC26] uppercase tracking-widest">
                                    Verified Booking
                                  </p>
                                  <span className="text-[8px] text-white/70">
                                    GÇó
                                  </span>
                                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                    {new Date(
                                      review.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-[#111] px-2 py-1 rounded-[16px] border border-white/10">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={`${i < review.rating ? "text-[#B3DC26] fill-[#BFF367]" : "text-[#333]"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-white/70 text-sm leading-relaxed mb-4">
                            &quot;{review.comment}&quot;
                          </p>
                          <div className="flex justify-end border-t border-white/10 pt-3">
                            <button className="text-[10px] font-bold text-white/70 uppercase tracking-widest hover:text-[#B3DC26] flex items-center gap-1.5 transition-colors">
                              <MessageCircleReply size={12} /> Respond to
                              Customer
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-[16px] bg-[#000000]">
                        <Activity size={32} className="text-[#333] mb-4" />
                        <p className="text-[12px] font-bold font-['Open_Sans'] text-white/70 uppercase tracking-[0.5px]">
                          No telemetry data available.
                        </p>
                        <p className="text-[11px] text-[#444] mt-2 font-medium tracking-wide italic">
                          Awaiting customer engagement metrics.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full min-h-[250px] md:min-h-[400px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[16px] bg-[#000000] shadow-[var(--shadow-2)] p-6 text-center">
                <Activity className="w-6 h-6 md:w-10 md:h-10 text-[#333] mb-4" />
                <p className="text-[10px] md:text-[12px] font-bold font-['Open_Sans'] text-white/70 uppercase tracking-[0.5px]">
                  Select a facility to initialize telemetry stream.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueOwnerReviews;
