import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetPostReportsQuery,
  useDeleteAdminPostMutation,
} from "@redux/api/communityApi";
import { format } from "date-fns";
import { Button } from "@kridaz/ui";


const CommunityPosts = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetPostReportsQuery({
    page,
    limit: 20,
  });
  const [deleteAdminPost] = useDeleteAdminPostMutation();

  const reports = data?.data || [];
  const pagination = data?.pagination || {};

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this post?")
    )
      return;
    try {
      await deleteAdminPost(postId).unwrap();
      toast.success("Post deleted successfully");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete post");
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <ShieldAlert className="text-secondary" size={32} />
          Reported Posts
        </h1>
        <p className="text-white/50 font-medium">
          Manage and review community posts reported by users.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-background border border-white/5 rounded-[8px] p-16 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-white/20" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            No Reports Found
          </h3>
          <p className="text-white/40 text-sm">
            There are no reported posts to review at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-background border border-white/5 rounded-[8px] overflow-hidden flex flex-col"
            >
              {/* Post Preview */}
              <div className="relative h-48 bg-neutral-900 border-b border-white/5 flex items-center justify-center overflow-hidden">
                {report.post?.image ? (
                  <img
                    src={report.post.image}
                    alt="Reported post"
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <div className="text-white/20 text-sm italic p-4 text-center">
                    &quot;{report.post?.content || "No content"}&quot;
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded-[4px] backdrop-blur-md border border-red-500/20">
                  REPORTED
                </div>
              </div>

              {/* Report Details */}
              <div className="p-5 flex-1 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Reason</h4>
                  <p className="text-[13px] text-white/60 bg-white/5 p-3 rounded-[6px] border border-white/5">
                    &quot;{report.reason}&quot;
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <span className="text-white/40 block mb-0.5">
                      Reported By
                    </span>
                    <span className="font-bold text-white/80">
                      {report.reporter?.name || "Unknown"}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-0.5">
                      Post Author
                    </span>
                    <span className="font-bold text-white/80">
                      {report.post?.adminId?.name || "Unknown"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-white/40 block mb-0.5">Date</span>
                    <span className="font-medium text-white/60">
                      {report.createdAt
                        ? format(
                            new Date(report.createdAt),
                            "MMM d, yyyy - h:mm a"
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-3 border-t border-white/5">
                  <Button
                    onClick={() => handleDeletePost(report.post?._id)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors py-2 rounded-[6px] text-[12px] font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete Post
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-background border border-white/10 rounded-[6px] text-white/60 hover:text-white disabled:opacity-50 text-[12px] font-bold transition-colors"
          >
            Prev
          </Button>
          <span className="text-[12px] font-bold text-white/40 px-4">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-background border border-white/10 rounded-[6px] text-white/60 hover:text-white disabled:opacity-50 text-[12px] font-bold transition-colors"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommunityPosts;
