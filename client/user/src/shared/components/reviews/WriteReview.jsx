import { Star } from "lucide-react";
import { useState } from "react";
import { Button, Textarea } from "@kridaz/ui";


const WriteReview = ({
  rating,
  review,
  isSubmitting,
  onClose,
  onRatingChange,
  onReviewChange,
  onSubmit,
}) => {
  const [ratingError, setRatingError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if a rating has been selected
    if (rating === 0) {
      setRatingError(true);
      return;
    }
    setRatingError(false);
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-border rounded-[8px] p-8 w-full max-w-md shadow-2xl relative">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-6">
          Write a Review
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-all duration-200 hover:scale-110 ${star <= rating ? "text-primary fill-primary" : "text-zinc-800 hover:text-zinc-600"}`}
                  onClick={() => onRatingChange(star)}
                />
              ))}
            </div>
            {ratingError && (
              <div className="text-red-500 text-xs font-bold uppercase tracking-widest mt-3">
                Please select a rating.
              </div>
            )}
          </div>
          <div className="mb-8">
            <label
              htmlFor="review"
              className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3"
            >
              Your Review
            </label>
            <Textarea
              id="review"
              rows="4"
              className="w-full bg-background border border-border rounded-[8px] p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-primary transition-colors resize-none"
              value={review}
              onChange={onReviewChange}
              placeholder="Share your experience playing here..."
              title="Please enter your review"
            ></Textarea>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              className="px-6 py-3 rounded-[8px] font-black uppercase text-xs tracking-widest text-zinc-400 hover:text-white hover:bg-background transition-all"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 py-3 rounded-[8px] bg-primary text-black font-black uppercase text-xs tracking-widest hover:bg-[#b3e600] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReview;
