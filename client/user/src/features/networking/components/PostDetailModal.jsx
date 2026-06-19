import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetPostByIdQuery } from "@redux/api/communityApi";
import PostItem from "./PostItem";

const PostDetailModal = ({
  postId,
  onClose,
  user,
  isAdmin,
  gateInteraction,
  onUpdatePost,
  onDeletePost,
  onSharePost,
  onReportPost,
}) => {
  const { data, isLoading, error } = useGetPostByIdQuery(postId);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      {/* Blurred background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, y: 34, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", damping: 24, stiffness: 260 }}
        className="relative z-20 w-full max-h-[100dvh] overflow-y-auto sm:max-h-[90vh] sm:max-w-[470px] bg-[#0A0A0A] sm:rounded-[12px] sm:border border-white/10 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Close Button */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-3 border-b border-white/5 bg-[#0A0A0A]/90 backdrop-blur-md">
          <h3 className="text-[14px] font-bold text-white px-2">Post</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} className="text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="w-full flex-1 pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="text-[#BFF367] animate-spin" />
            </div>
          ) : error || !data?.post ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-white/50 text-sm font-medium">
                Post not found or deleted.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-white/10 rounded-full text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          ) : (
            <PostItem
              post={data.post}
              user={user}
              isAdmin={isAdmin}
              gateInteraction={gateInteraction}
              onUpdatePost={onUpdatePost}
              onDeletePost={(id) => {
                onDeletePost(id);
                onClose();
              }}
              onSharePost={onSharePost}
              onReportPost={onReportPost}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PostDetailModal;
