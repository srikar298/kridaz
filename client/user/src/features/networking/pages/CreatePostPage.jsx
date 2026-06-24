import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  X,
  Image as ImageIcon,
  Camera,
  Loader2,
  Send,
  ChevronDown,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  useCreatePostMutation,
  useUpdatePostMutation,
} from "@redux/api/communityApi";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import toast from "react-hot-toast";
import {
  useLazyGetCommunityUploadUrlQuery,
  useConfirmCommunityPostMutation,
} from "@redux/api/communityApi";
import { uploadFileToR2 } from "@utils/mediaUpload";import { Button, Input, Select, Textarea } from "@kridaz/ui";


const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const CreatePostPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const [createPost] = useCreatePostMutation();
  const [updatePost] = useUpdatePostMutation();

  const editingPost = location.state?.editingPost || null;
  const preSelectedFile = location.state?.preSelectedFile || null;

  const [getCommunityUploadUrl] = useLazyGetCommunityUploadUrlQuery();
  const [confirmCommunityPost] = useConfirmCommunityPostMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sport, setSport] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setSport(editingPost.sport || "");
      setMediaFiles([]);
      const media =
        editingPost.image || editingPost.imageUrl || editingPost.mediaUrl;
      setMediaPreviews(media ? [media] : []);
    } else {
      setTitle("");
      setContent("");
      setSport("");
      setMediaFiles([]);
      setMediaPreviews([]);

      const preSelectedFiles = location.state?.preSelectedFiles;

      if (preSelectedFiles && preSelectedFiles.length > 0) {
        const validFiles = preSelectedFiles.slice(0, 10); // Limit to 10
        setMediaFiles(validFiles);
        setMediaPreviews(validFiles.map((f) => URL.createObjectURL(f)));
      } else if (preSelectedFile) {
        setMediaFiles([preSelectedFile]);
        setMediaPreviews([URL.createObjectURL(preSelectedFile)]);
      }
    }
  }, [editingPost, preSelectedFile]);

  const handlePostImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.some((file) => file.type.startsWith("video"))) {
      toast.error("Only photos are allowed for posts", {
        id: "post-type-error",
      });
      e.target.value = "";
      return;
    }

    if (mediaFiles.length + files.length > 10) {
      toast.error("Maximum 10 images allowed", { id: "post-count-error" });
      e.target.value = "";
      return;
    }

    setMediaFiles((prev) => [...prev, ...files]);
    setMediaPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);

    e.target.value = "";
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) {
      return toast.error("Content or image is required");
    }

    setIsPublishing(true);
    try {
      if (editingPost && !editingPost.isPrefill) {
        const formData = new FormData();
        if (title) formData.append("title", title);
        if (content) formData.append("content", content);
        await updatePost({
          postId: editingPost._id || editingPost.id,
          formData,
        }).unwrap();
        toast.success("Post updated!");
        navigate("/community", { state: { scrollToTop: true } });
      } else {
        if (mediaFiles.length === 1 && !content.trim()) {
          // Use Flash Upload (Backgrounding) for single media without content
          dispatch(
            startUpload({
              id: Date.now().toString(),
              file: mediaFiles[0],
              previewUrl: mediaPreviews[0],
              metadata: {
                type: "community",
                title,
                content: content || "",
                sport: sport || "",
              },
            })
          );
          toast.success("Uploading post in background...");
          navigate("/community", { state: { scrollToTop: true } });
          return;
        }

        if (mediaFiles.length > 0) {
          // Foreground upload for multiple files or single file with content
          const mediaItems = [];
          for (const file of mediaFiles) {
            const { data: uploadData } = await getCommunityUploadUrl({
              contentType: file.type,
              fileName: file.name,
            });
            await uploadFileToR2(uploadData.uploadUrl, file);
            mediaItems.push({
              key: uploadData.key,
              mediaType: "image",
            });
          }
          await confirmCommunityPost({
            postId: Date.now().toString(),
            title,
            content,
            sport,
            mediaItems,
          }).unwrap();
          toast.success("Post created!");
        } else {
          // Plain text post
          const formData = new FormData();
          formData.append("title", title);
          formData.append("content", content);
          if (sport) formData.append("sport", sport);
          await createPost(formData).unwrap();
          toast.success("Post created!");
        }
        navigate("/community", { state: { scrollToTop: true } });
      }
    } catch (error) {
      toast.error(
        error?.data?.message || error.message || "Failed to save post"
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
            <div>
              <h3
                className="font-black text-lg text-white tracking-wide uppercase"
                style={HEADING_STYLE}
              >
                {editingPost ? "Edit Post" : "Create Post"}
              </h3>
              <p
                className="text-xs text-neutral-500 font-medium tracking-tight mt-0.5"
                style={SUBHEADING_STYLE}
              >
                Share something with the community
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!editingPost && (
              <div className="relative">
                <Select
                  className="border border-transparent rounded-[8px] py-2 pl-3 pr-8 text-black text-xs font-bold focus:outline-none transition-all appearance-none cursor-pointer bg-primary"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                  }}
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="" className="bg-neutral-950 text-white">
                    All Sports
                  </option>
                  {[
                    "Cricket",
                    "Football",
                    "Rugby",
                    "Baseball",
                    "Hockey",
                    "Athletics",
                  ].map((s) => (
                    <option
                      key={s}
                      value={s.toUpperCase()}
                      className="bg-neutral-950 text-white"
                    >
                      {s}
                    </option>
                  ))}
                </Select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-black/50">
                  <ChevronDown size={14} />
                </div>
              </div>
            )}
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
            <div
              className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider mt-1"
              style={SUBHEADING_STYLE}
            >
              <Globe size={12} />
              <span>Posting publicly</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCreatePost}
          className="relative px-5 pb-5 pt-3 flex flex-col flex-1 min-h-0 z-10 space-y-4"
        >
          <div className="relative group/content flex-1 flex flex-col min-h-0 w-full">
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              placeholder="What’s happening in your match? Share updates, highlights, or announcements…"
              maxLength={1000}
              style={{ ...SUBHEADING_STYLE, minHeight: "150px" }}
              className="w-full bg-transparent border-none focus:ring-0 p-1 text-white text-base md:text-lg outline-none transition-all duration-300 resize-none placeholder:text-white/30 overflow-hidden"
            />
            {content.length > 0 && (
              <span
                className="absolute right-1 bottom-1 text-xs font-bold text-neutral-500"
                style={SUBHEADING_STYLE}
              >
                {content.length}/1000
              </span>
            )}
          </div>

          {mediaPreviews.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 min-h-0 w-full shrink-0 snap-x snap-mandatory scrollbar-hide">
              {mediaPreviews.map((preview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.97, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -5 }}
                  className={`relative ${mediaPreviews.length === 1 ? "w-full" : "w-[85%]"} aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 group shadow-lg shrink-0 snap-center bg-neutral-900`}
                >
                  <img
                    src={preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />

                  {!editingPost && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.08, backgroundColor: "var(--destructive)" }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        const newFiles = [...mediaFiles];
                        const newPreviews = [...mediaPreviews];
                        newFiles.splice(index, 1);
                        newPreviews.splice(index, 1);
                        setMediaFiles(newFiles);
                        setMediaPreviews(newPreviews);
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer z-10 hover:bg-red-500/80"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-2">
              {!editingPost && (
                <>
                  <label className="relative cursor-pointer">
                    <motion.div
                      style={SUBHEADING_STYLE}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(85,222,232,0.08)",
                        border: "1px solid rgba(85,222,232,0.2)",
                        color: "var(--primary)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-primary transition-all flex items-center justify-center"
                      title="Take Photo"
                    >
                      <Camera size={20} />
                    </motion.div>
                    <Input
                      type="file"
                      multiple
                      onChange={handlePostImageChange}
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                    />
                  </label>
                  <label className="relative cursor-pointer">
                    <motion.div
                      style={SUBHEADING_STYLE}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(85,222,232,0.08)",
                        border: "1px solid rgba(85,222,232,0.2)",
                        color: "var(--primary)",
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-primary transition-all flex items-center justify-center"
                      title="Add Image from Gallery"
                    >
                      <ImageIcon size={20} />
                    </motion.div>
                    <Input
                      type="file"
                      multiple
                      onChange={handlePostImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={
                  isPublishing || (!content.trim() && mediaFiles.length === 0)
                }
                className="bg-primary text-black px-6 py-3 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-100 disabled:bg-primary/20 disabled:text-black/80 hover:bg-[#a5db4b]"
              >
                {isPublishing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {isPublishing ? "Posting..." : "POST"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;
