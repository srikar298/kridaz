import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  X,
  Image as ImageIcon,
  Loader2,
  Plus,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useLazyGetStoryUploadUrlQuery,
  useConfirmStoryUploadMutation,
} from "@redux/api/communityApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import { uploadFileToR2 } from "@utils/mediaUpload";
import toast from "react-hot-toast";
import GlobalBackButton from "@/shared/components/GlobalBackButton";
import { Button, Input, Select, Textarea } from "@kridaz/ui";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const CreateStoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [getStoryUploadUrl] = useLazyGetStoryUploadUrlQuery();
  const [confirmStoryUpload] = useConfirmStoryUploadMutation();

  const preSelectedFile = location.state?.preSelectedFile || null;

  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [durationDays, setDurationDays] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (preSelectedFile) {
      setMediaFiles([preSelectedFile]);
      setMediaPreviews([URL.createObjectURL(preSelectedFile)]);
    }
  }, [preSelectedFile]);

  const handleStoryMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const hasVideo = files.some((file) => file.type.startsWith("video"));

    if (hasVideo) {
      if (files.length > 1) {
        toast.error("You can only upload 1 video at a time");
        e.target.value = "";
        return;
      }

      const videoFile = files[0];
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 60) {
          toast.error("Video cannot be longer than 60 seconds");
          e.target.value = "";
          return;
        }
        if (videoElement.duration < 5) {
          toast.error("Video must be at least 5 seconds long");
          e.target.value = "";
          return;
        }
        setMediaFiles([videoFile]);
        setMediaPreviews([URL.createObjectURL(videoFile)]);
      };
      videoElement.src = URL.createObjectURL(videoFile);
      return;
    }

    if (files.length > 10) {
      toast.error("Maximum 10 images allowed");
      e.target.value = "";
      return;
    }

    setMediaFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setMediaPreviews(previews);
  };

  const handleUploadStory = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      return toast.error("Story must have content or media");
    }

    // If exactly one media file and no content, use Flash Upload (Backgrounding)
    if (mediaFiles.length === 1 && !content.trim()) {
      const file = mediaFiles[0];
      dispatch(
        startUpload({
          id: Date.now().toString(),
          file,
          previewUrl: URL.createObjectURL(file),
          metadata: {
            type: "story",
            content: "",
            durationDays,
          },
        })
      );
      toast.success("Uploading story in background...");
      navigate("/community", { state: { scrollToTop: true } });
      return;
    }

    setIsPublishing(true);
    try {
      const mediaItems = [];

      // 1. Upload each media file (Fallback for multi-file/text stories)
      for (const file of mediaFiles) {
        const uploadData = await getStoryUploadUrl({
          contentType: file.type,
          fileName: file.name,
        }).unwrap();

        await uploadFileToR2(uploadData.uploadUrl, file);

        mediaItems.push({
          key: uploadData.key,
          mediaType:
            file.type.startsWith("video") ||
            file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)
              ? "video"
              : "image",
        });
      }

      // 2. Confirm Story
      await confirmStoryUpload({
        content,
        durationDays,
        mediaItems,
      }).unwrap();

      toast.success("Story uploaded!");
      navigate("/community", { state: { scrollToTop: true } });
    } catch (error) {
      toast.error(
        error?.data?.message || error.message || "Failed to upload story"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] w-full min-h-[100dvh] bg-black/95 flex items-center justify-center md:p-6 overflow-hidden">
      <div className="w-full h-[100dvh] md:h-full md:max-h-[800px] md:max-w-[500px] bg-[#050505] md:rounded-[32px] md:border md:border-white/10 shadow-2xl flex flex-col font-sans overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative px-5 py-4 border-b border-white/5 flex items-center justify-between gap-4 bg-black/40 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <GlobalBackButton />
            <div>
              <h3
                className="font-black text-lg text-white tracking-wide uppercase"
                style={HEADING_STYLE}
              >
                Create Story
              </h3>
              <p
                className="text-xs text-neutral-500 font-medium tracking-tight mt-0.5"
                style={SUBHEADING_STYLE}
              >
                Share quick updates with your community
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 pt-6 pb-2 relative z-10">
          <img
            src={user?.profilePicture || "/default-avatar.png"}
            className="w-10 h-10 rounded-full object-cover border border-white/10 bg-neutral-900"
            alt=""
          />
          <div>
            <span
              className="text-sm font-bold text-white block tracking-wide"
              style={SUBHEADING_STYLE}
            >
              {user?.username || user?.name || "Player"}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleUploadStory}
          className="relative px-5 pb-5 pt-3 flex flex-col flex-1 min-h-0 z-10 space-y-4"
        >
          <div className="relative group/content w-full">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a quick moment, match update, highlight, or announcement..."
              style={SUBHEADING_STYLE}
              className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/30 focus:bg-white/[0.04] rounded-xl min-h-[100px] p-4 text-white text-base outline-none transition-all duration-300 resize-none placeholder:text-white/30"
            />
          </div>

          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-xl">
            <span
              className="text-sm text-neutral-400 font-bold"
              style={SUBHEADING_STYLE}
            >
              Expiry Duration
            </span>
            <div className="relative">
              <Select
                className="border border-transparent rounded-[8px] py-2 pl-3 pr-8 text-black text-xs font-bold focus:outline-none transition-all appearance-none cursor-pointer bg-primary"
                style={{
                  fontFamily: "'Inter', sans-serif",
                }}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option
                    key={d}
                    value={d}
                    className="bg-neutral-950 text-white"
                  >
                    {d} {d === 1 ? "Day" : "Days"}
                  </option>
                ))}
              </Select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-black/50">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {mediaPreviews.length > 0 && (
            <div className="flex-1 min-h-0 flex items-center justify-center py-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-[9/16] h-full max-h-[45vh] rounded-2xl overflow-hidden border border-white/10 group shadow-2xl bg-neutral-900 mx-auto shrink-0"
              >
                {mediaFiles[0]?.type?.startsWith("video") ? (
                  <video
                    src={mediaPreviews[0]}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={mediaPreviews[0]}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span
                    className="text-xs font-bold text-white uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/10"
                    style={SUBHEADING_STYLE}
                  >
                    Preview
                  </span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08, backgroundColor: "var(--destructive)" }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setMediaFiles([]);
                    setMediaPreviews([]);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/75 rounded-full text-white transition-colors cursor-pointer z-10"
                  title="Remove media"
                >
                  <X size={16} />
                </motion.button>
              </motion.div>
            </div>
          )}

          <div className="flex-1" />

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-2">
              <div className="relative">
                <motion.button
                  type="button"
                  style={SUBHEADING_STYLE}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: "rgba(85,222,232,0.08)",
                    border: "1px solid rgba(85,222,232,0.2)",
                    color: "var(--primary)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-primary transition-all flex items-center justify-center cursor-pointer"
                  title="Upload Photo/Video"
                >
                  <ImageIcon size={20} />
                </motion.button>
                <Input
                  type="file"
                  multiple
                  onChange={handleStoryMediaChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*,video/*"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={
                  isPublishing ||
                  (!content.trim() && mediaPreviews.length === 0)
                }
                style={SUBHEADING_STYLE}
                className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer hover:bg-[#a5db4b]"
              >
                {isPublishing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {isPublishing ? "Posting..." : "POST STORY"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryPage;
