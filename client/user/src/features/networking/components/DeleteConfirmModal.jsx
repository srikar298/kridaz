import { X, Trash2 } from "lucide-react";
import { motion } from "framer-motion";import { Button } from "@kridaz/ui";


const DeleteConfirmModal = ({ onClose, onConfirm, isDeleting }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!isDeleting ? onClose : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative z-20 w-full max-w-[360px] bg-card rounded-[16px] border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>

          <h3
            className="text-xl font-bold text-white mb-2"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
          >
            Delete Post
          </h3>
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            Are you sure you want to delete this post? This action cannot be
            undone.
          </p>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-[12px] bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-[12px] bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmModal;
