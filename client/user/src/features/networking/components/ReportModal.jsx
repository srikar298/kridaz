import { useState } from "react";
import { X, Loader2, AlertTriangle, ShieldCheck, Flag, Ban, MessageSquareWarning, Copyright, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useReportPostMutation } from "@redux/api/communityApi";
import { useReportReelMutation } from "@redux/api/reelsApi";
import toast from "react-hot-toast";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const reasons = [
  {
    id: "Spam or misleading",
    title: "Spam or Misleading",
    subtitle: "Fake, deceptive, or repetitive content",
    icon: Ban,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
  },
  {
    id: "Harassment or hate speech",
    title: "Harassment or Hate",
    subtitle: "Bullying, threats, or discriminatory language",
    icon: MessageSquareWarning,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    id: "Inappropriate content",
    title: "Inappropriate Content",
    subtitle: "Nudity, violence, or graphic material",
    icon: AlertTriangle,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
  },
  {
    id: "Intellectual property violation",
    title: "IP Violation",
    subtitle: "Stolen or copyrighted content",
    icon: Copyright,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "Other",
    title: "Something Else",
    subtitle: "Another reason not listed above",
    icon: MoreHorizontal,
    iconBg: "bg-white/5",
    iconColor: "text-white/60",
  },
];

/**
 * ReportModal - Shared modal for reporting posts and reels.
 * @param {string} type - "post" | "reel"
 * @param {string} postId - The ID of the post (when type="post")
 * @param {string} itemId - The ID of the item (when type="reel")
 * @param {function} onClose - Callback to close the modal
 */
const ReportModal = ({ type = "post", postId, itemId, onClose }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reportPost, { isLoading: isLoadingPost }] = useReportPostMutation();
  const [reportReel, { isLoading: isLoadingReel }] = useReportReelMutation();

  const isLoading = isLoadingPost || isLoadingReel;
  const targetId = type === "reel" ? itemId : postId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!finalReason) {
      return toast.error("Please select or enter a reason for reporting");
    }

    try {
      if (type === "reel") {
        await reportReel({ reelId: targetId, reason: finalReason }).unwrap();
        toast.success("Short reported successfully. Thank you.");
      } else {
        await reportPost({ postId: targetId, reason: finalReason }).unwrap();
        toast.success("Post reported successfully. Thank you.");
      }
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit report");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative w-full max-w-[380px] bg-[#111111] rounded-[20px] overflow-hidden shadow-2xl p-4 sm:p-5 border border-white/5 max-h-[95vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-4 mt-1">
          <div className="w-10 h-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mb-2">
            <AlertTriangle className="text-primary" size={18} />
          </div>
          <h2
            className="text-lg font-bold text-white mb-1 tracking-tight"
            style={HEADING_STYLE}
          >
            REPORT{" "}
            <span className="text-primary">
              {type === "reel" ? "SHORT" : "POST"}
            </span>
          </h2>
          <p className="text-white/50 text-xs text-center max-w-[220px] leading-tight">
            Help us keep Kridaz safe and positive for everyone.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reason List */}
          <div className="space-y-2">
            {reasons.map((reason) => {
              const isSelected = selectedReason === reason.id;
              const Icon = reason.icon;
              return (
                <label
                  key={reason.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-primary/5 border-primary/40"
                      : "bg-[#1A1A1A] border-transparent hover:bg-[#222222]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${reason.iconBg} ${reason.iconColor}`}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="flex-1">
                    <h4 className="text-white text-sm font-semibold">
                      {reason.title}
                    </h4>
                    <p className="text-white/40 text-[11px] mt-0.5 leading-tight">
                      {reason.subtitle}
                    </p>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-primary" : "border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  <input
                    type="radio"
                    name="report-reason"
                    value={reason.id}
                    checked={isSelected}
                    onChange={() => setSelectedReason(reason.id)}
                    className="sr-only"
                  />
                </label>
              );
            })}
          </div>

          {/* Custom Reason Textarea */}
          {selectedReason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify your reason..."
              className="w-full mt-3 bg-[#1A1A1A] border border-white/5 focus:border-primary/50 rounded-xl p-3 text-white text-xs outline-none transition-all duration-300 resize-none h-16 placeholder:text-white/30"
              style={SUBHEADING_STYLE}
            />
          )}

          {/* Anonymous Note */}
          <div className="flex items-start gap-2.5 mt-4 mb-4 p-3 rounded-xl bg-[#1A1A1A]">
            <ShieldCheck className="text-primary shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] text-white/50 leading-relaxed">
              Your report is anonymous. We'll review it and take action if it
              violates our{" "}
              <span className="text-primary cursor-pointer hover:underline font-medium">
                guidelines
              </span>
              .
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg text-xs font-bold text-white bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              className="flex-[1.5] h-10 rounded-lg text-xs font-bold text-black bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Flag size={14} />
              )}
              Report {type === "reel" ? "Short" : "Post"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReportModal;
