import { useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useReportPostMutation } from "@redux/api/communityApi";
import toast from "react-hot-toast";
import { Button, Input, Textarea } from "@kridaz/ui";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const reasons = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Inappropriate content",
  "Intellectual property violation",
  "Other",
];

const ReportModal = ({ postId, onClose }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reportPost, { isLoading }] = useReportPostMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason =
      selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!finalReason) {
      return toast.error("Please select or enter a reason for reporting");
    }

    try {
      await reportPost({ postId, reason: finalReason }).unwrap();
      toast.success("Post reported successfully. Thank you.");
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to report post");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#030303]/75 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative w-full max-w-md bg-neutral-950 border border-white/10 rounded-[8px] overflow-hidden shadow-2xl p-6"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" size={20} />
            <h3
              className="font-black text-base text-white tracking-wide"
              style={HEADING_STYLE}
            >
              Report Post
            </h3>
          </div>
          <Button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
           aria-label="Close">
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 rounded-[8px] bg-white/[0.02] border border-white/5 hover:border-white/10 cursor-pointer transition-all"
              >
                <Input
                  type="radio"
                  name="report-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-[var(--primary)]"
                />
                <span
                  className="text-xs text-white/90 font-medium"
                  style={SUBHEADING_STYLE}
                >
                  {reason}
                </span>
              </label>
            ))}
          </div>

          {selectedReason === "Other" && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify your reason..."
              className="w-full bg-white/[0.01] border border-white/10 focus:border-primary/30 rounded-[8px] p-3 text-white text-xs outline-none transition-all duration-300 resize-none h-20 placeholder:text-white/20"
              style={SUBHEADING_STYLE}
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-[8px] text-xs font-bold text-neutral-400 hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              className="bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 h-9 rounded-[8px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Report
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ReportModal;
