import React, { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  updateProgress,
  updateStatus,
  updateId,
  setUploadError,
  clearUpload,
} from "@redux/slices/mediaUploadSlice";
import {
  useLazyGetReelUploadUrlQuery,
  useConfirmReelUploadMutation,
} from "@redux/api/reelsApi";
import {
  useLazyGetCommunityUploadUrlQuery,
  useConfirmCommunityPostMutation,
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation,
} from "@redux/api/communityApi";
import { uploadFileToR2 } from "@utils/mediaUpload";
import toast from "react-hot-toast";import { Button } from "@kridaz/ui";


const BackgroundUploadManager = () => {
  const dispatch = useDispatch();
  const { activeUpload } = useSelector((state) => state.mediaUpload);
  const [getReelUploadUrl] = useLazyGetReelUploadUrlQuery();
  const [confirmReel] = useConfirmReelUploadMutation();

  const [getCommunityUploadUrl] = useLazyGetCommunityUploadUrlQuery();
  const [confirmCommunity] = useConfirmCommunityPostMutation();

  const [getStoryUploadUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStory] = useConfirmStoryUploadMutation();

  // Track if we are currently processing the active upload to avoid double triggers
  const processingId = useRef(null);

  useEffect(() => {
    if (
      activeUpload &&
      activeUpload.status === "uploading" &&
      processingId.current !== activeUpload.id
    ) {
      processUpload(activeUpload);
    }
  }, [activeUpload]);

  const processUpload = async (upload) => {
    processingId.current = upload.id;
    const type = upload.metadata?.type || "reel";

    try {
      if (!upload.file || !(upload.file instanceof File)) {
        throw new Error("File lost or corrupted. Please try again.");
      }

      let uploadUrl, key, dbId;

      // 1. Get Pre-signed URL based on type
      if (type === "community") {
        const { data } = await getCommunityUploadUrl({
          contentType: upload.file.type,
          fileName: upload.file.name,
        });
        uploadUrl = data?.uploadUrl;
        key = data?.key;
        dbId = data?.postId;
      } else if (type === "story") {
        const { data } = await getStoryUploadUrl({
          contentType: upload.file.type,
          fileName: upload.file.name,
        });
        uploadUrl = data?.uploadUrl;
        key = data?.key;
        dbId = data?.storyId;
      } else {
        const { data } = await getReelUploadUrl({
          contentType: upload.file.type,
          fileName: upload.file.name,
        });
        uploadUrl = data?.uploadUrl;
        key = data?.key;
        dbId = data?.reelId;
      }

      if (!uploadUrl) throw new Error("Failed to get upload authorization.");

      // Sync ID for socket events
      if (dbId) {
        dispatch(updateId(dbId));
        processingId.current = dbId;
      }

      // 2. Upload Direct to R2
      await uploadFileToR2(uploadUrl, upload.file, (progress) => {
        dispatch(updateProgress(progress));
        if (progress === 100) dispatch(updateStatus("finalizing"));
      });

      // 3. Confirm with Backend
      if (type === "community") {
        await confirmCommunity({
          postId: dbId,
          key,
          mediaType: upload.file.type.startsWith("video") ? "video" : "image",
          title: upload.metadata.title,
          content: upload.metadata.content,
        }).unwrap();
      } else if (type === "story") {
        await confirmStory({
          storyId: dbId,
          key,
          mediaType: upload.file.type.startsWith("video") ? "video" : "image",
          content: upload.metadata.content,
          durationDays: upload.metadata.durationDays,
        }).unwrap();
      } else {
        await confirmReel({
          reelId: dbId,
          key,
          caption: upload.metadata.caption,
          hashtags: upload.metadata.hashtags,
        }).unwrap();
      }

      dispatch(updateStatus("success"));
      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} shared successfully!`
      );

      setTimeout(() => {
        dispatch(clearUpload());
      }, 3000);
    } catch (error) {
      console.error("[BACKGROUND_UPLOAD_FAILED]", error);
      dispatch(setUploadError(error.message || "Upload failed"));
      toast.error(error.message || "Upload failed. Check your connection.");
    } finally {
      processingId.current = null;
    }
  };

  if (!activeUpload) return null;

  const { progress, status, error } = activeUpload;
  const type = activeUpload.metadata?.type || "reel";

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="bg-card border border-white/10 rounded-[8px] p-2 shadow-2xl max-w-sm mx-auto pointer-events-auto flex items-center gap-3"
        >
          {/* Preview Thumbnail (Optimistic) */}
          <div className="w-8 h-10 bg-white/5 rounded-md overflow-hidden flex-shrink-0 border border-white/5">
            {activeUpload.previewUrl ? (
              <video
                src={activeUpload.previewUrl}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 size={14} className="animate-spin text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-white truncate">
                {status === "uploading" &&
                  `Uploading ${type === "community" ? "Post" : type === "story" ? "Story" : "Reel"}...`}
                {status === "finalizing" && "Finalizing..."}
                {status === "success" && "Shared Successfully!"}
                {status === "error" && "Upload Failed"}
              </p>
              <span className="text-[10px] font-medium text-gray-400">
                {status === "uploading" && `${progress}%`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${status === "error" ? "bg-red-500" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${status === "error" ? 100 : progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {status !== "success" && status !== "error" && (
              <p className="text-[9px] text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary mt-1 flex items-center gap-1">
                <AlertTriangle size={8} />
                Do not close or refresh the app
              </p>
            )}

            {status === "error" && (
              <p className="text-[9px] text-red-500 mt-0.5 truncate">{error}</p>
            )}
          </div>

          <div className="flex-shrink-0 pr-1">
            {status === "uploading" || status === "finalizing" ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : status === "success" ? (
              <CheckCircle size={16} className="text-primary" />
            ) : (
              <Button onClick={() => dispatch(clearUpload())}>
                <XCircle size={16} className="text-red-500" />
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BackgroundUploadManager;
