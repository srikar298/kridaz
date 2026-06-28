import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAddTurfReviewMutation, useUpdateTurfReviewMutation } from "@redux/api/turfApi";
import { Button } from "@kridaz/ui";

const RateVenueModal = ({ turf, onClose, onSuccess, existingReview }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview?.comment || "");
  const [addReview, { isLoading: isAdding }] = useAddTurfReviewMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateTurfReviewMutation();
  
  const isLoading = isAdding || isUpdating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!review.trim()) {
      toast.error("Please write a review.");
      return;
    }

    try {
      if (existingReview) {
        await updateReview({
          turfId: turf.id || turf._id,
          rating,
          review,
        }).unwrap();
        toast.success("Review updated successfully!");
      } else {
        await addReview({
          turfId: turf.id || turf._id,
          rating,
          review,
        }).unwrap();
        toast.success("Thank you for your rating!");
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.data?.message || "Failed to submit rating.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-[#1A1D21] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-[101]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
              {existingReview ? "Edit Rating" : `Rate ${turf?.name}`}
            </h3>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={16} className="text-white/60 hover:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                How was your experience?
              </p>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-primary text-primary"
                          : "fill-transparent text-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Write a Review
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share details of your experience at this venue..."
                className="w-full h-32 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-primary text-black hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit Rating"}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RateVenueModal;
