import React, { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  CornerDownRight,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";

const ReviewsTab = ({ role }) => {
  const user = useSelector((state) => state.auth?.user);
  const ownerId = user?.ownerProfile?.id || "";

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5.0);
  const [numReviews, setNumReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Reply status state
  const [replyingTo, setReplyingTo] = useState(null); // reviewId
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [feedback, setFeedback] = useState("");

  const fetchProfileAndReviews = async () => {
    if (!ownerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`/api/professional/details/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data.professional) {
        setReviews(res.data.reviews || []);
        setRating(res.data.professional.rating || 5.0);
        setNumReviews(res.data.professional.numReviews || 0);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndReviews();
  }, [ownerId]);

  const handleReplySubmit = async (e, reviewId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    setFeedback("");
    try {
      const token = localStorage.getItem("token") || "";
      await axios.post(
        "/api/professional/review/reply",
        {
          reviewId,
          reply: replyText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFeedback("Reply submitted successfully!");
      setReplyText("");
      setReplyingTo(null);
      fetchProfileAndReviews();
    } catch (err) {
      setFeedback("Failed to submit reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Star breakdown calculation
  const getStarBreakdown = () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating));
      counts[star]++;
    });
    return counts;
  };

  const starCounts = getStarBreakdown();

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Overall Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-[#141414] border border-[#2D2D2D] items-center">
        <div className="text-center space-y-2 md:border-r md:border-[#2D2D2D] py-4">
          <h2 className="text-5xl font-black text-[#BFF367]">
            {rating.toFixed(1)}
          </h2>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={
                  s <= Math.round(rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }
              />
            ))}
          </div>
          <p className="text-xs text-[#878C9F] font-semibold uppercase tracking-wider">
            {numReviews} Reviews total
          </p>
        </div>

        <div className="md:col-span-2 space-y-2 py-4 px-0 md:px-6">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars] || 0;
            const percentage = numReviews > 0 ? (count / numReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-[#878C9F] text-right font-semibold">
                  {stars}
                </span>
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-2 bg-black rounded-full overflow-hidden border border-[#2D2D2D]">
                  <div
                    className="h-full bg-[#BFF367] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-[#878C9F] text-left font-semibold">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#878C9F] border-b border-[#2D2D2D] pb-3">
          Customer Testimonials
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-[#878C9F]">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center bg-[#141414] border border-[#2D2D2D] rounded-2xl space-y-4">
            <div className="mx-auto w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="font-bold">No feedback yet</h4>
              <p className="text-sm text-[#878C9F] mt-1">
                Completed bookings and check-ins will accumulate feedback here.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#BFF367]/10 text-[#BFF367] flex items-center justify-center font-bold text-sm uppercase">
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        {review.user?.name || "Anonymous User"}
                      </h4>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            className={
                              s <= review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#878C9F] font-semibold">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed pl-13">
                  {review.comment}
                </p>

                {/* Reply section */}
                {review.reply ? (
                  <div className="ml-8 p-4 rounded-xl bg-black/40 border border-[#2D2D2D] space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#BFF367] font-bold">
                      <CornerDownRight size={14} />
                      <span>Your Response</span>
                      {review.replyDate && (
                        <span className="text-[10px] text-[#878C9F] font-normal">
                          •{" "}
                          {new Date(review.replyDate).toLocaleDateString(
                            "en-IN",
                            { dateStyle: "medium" }
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {review.reply}
                    </p>
                  </div>
                ) : replyingTo === review.id ? (
                  <form
                    onSubmit={(e) => handleReplySubmit(e, review.id)}
                    className="ml-8 space-y-2 border-l border-[#2D2D2D] pl-4"
                  >
                    <textarea
                      required
                      placeholder="Write your response to the user..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-black border border-[#2D2D2D] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#BFF367] min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="border border-[#2D2D2D] hover:bg-white/5 text-white font-semibold rounded-lg px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReply}
                        className="bg-[#BFF367] hover:bg-[#44cdd7] text-black font-semibold rounded-lg px-4 py-1.5 text-xs"
                      >
                        Submit Response
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex justify-end pr-2">
                    <button
                      onClick={() => {
                        setReplyingTo(review.id);
                        setReplyText("");
                      }}
                      className="text-xs text-[#BFF367] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Reply to testimonial</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;
