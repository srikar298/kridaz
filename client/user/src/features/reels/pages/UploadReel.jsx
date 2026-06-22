import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, Upload, X, Hash, Globe, MapPin } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { startUpload } from "@redux/slices/mediaUploadSlice";
import GlobalBackButton from "@/shared/components/GlobalBackButton";import { Button, Input, Select, Textarea } from "@kridaz/ui";


const UploadReel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [privacy, setPrivacy] = useState("Public");
  const [locationName, setLocationName] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // If a file was passed via navigation state (e.g. from NewPostLanding), use it immediately
    if (location.state?.preSelectedFile && !file) {
      const passedFile = location.state.preSelectedFile;
      if (passedFile.size > 100 * 1024 * 1024) {
        toast.error("File size too large. Max 100MB.");
      } else {
        setFile(passedFile);
        setPreview(URL.createObjectURL(passedFile));
      }

      // Clear the state so it doesn't re-trigger on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, file]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("video/")) {
        toast.error("Only videos are allowed for Reels.", {
          id: "reel-type-error",
        });
        e.target.value = "";
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("Video size must be less than 100MB", {
          id: "reel-size-error",
        });
        e.target.value = "";
        return;
      }

      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 60) {
          toast.error("Video cannot be longer than 60 seconds", {
            id: "video-duration-error",
          });
          e.target.value = "";
          return;
        }
        if (videoElement.duration < 5) {
          toast.error("Video must be at least 5 seconds long", {
            id: "video-duration-error",
          });
          e.target.value = "";
          return;
        }
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
      };
      videoElement.src = URL.createObjectURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Dispatch global background upload
    dispatch(
      startUpload({
        id: `reel-${Date.now()}`,
        file,
        previewUrl: preview,
        metadata: {
          caption,
          hashtags:
            hashtags
              .split(" ")
              .filter((t) => t.startsWith("#"))
              .map((t) => t.slice(1)) || [],
        },
      })
    );

    toast.success("Upload started in background");
    navigate("/community?tab=shots", { state: { scrollToTop: true } });
  };

  const clearForm = () => {
    setFile(null);
    setPreview(null);
    setCaption("");
    setHashtags("");
    setLocationName("");
  };

  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          const state = data.address?.state || "";
          setLocationName(
            city && state ? `${city}, ${state}` : city || state || "Unknown"
          );
        } catch {
          toast.error("Failed to fetch location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        toast.error("Location permission denied");
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {!preview ? (
        /* Step 1: Upload Zone (Full Screen Dark) */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center p-6 bg-black relative"
        >
          {/* Minimal Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <GlobalBackButton />
            <h1 className="text-sm font-bold tracking-widest uppercase">
              New Reel
            </h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <label className="cursor-pointer group relative flex flex-col items-center justify-center w-full h-full">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-[#86d328] shadow-[0_0_50px_rgba(191,243,103,0.3)] flex items-center justify-center mb-6"
            >
              <Upload
                size={32}
                strokeWidth={2.5}
                className="text-black ml-1 mb-1"
              />
            </motion.div>
            <h3 className="text-2xl font-black text-white tracking-wide">
              Select Video
            </h3>
            <p className="text-white/50 text-sm mt-2">
              MP4 or WebM • Up to 100MB
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </motion.div>
      ) : (
        /* Step 2: Details & Preview (Full Screen Overlay) */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 absolute inset-0 z-50 bg-black flex flex-col"
        >
          {/* Full Screen Background Video */}
          <video
            src={preview}
            className="absolute inset-0 w-full h-full object-cover z-0"
            muted
            loop
            autoPlay
            playsInline
          />

          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/60 to-transparent">
            <GlobalBackButton />
          </div>

          {/* Bottom Sheet Overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col justify-end">
            <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pb-6 px-4 md:px-8">
              <div className="max-w-md mx-auto space-y-4">
                {/* Caption Input */}
                <div className="relative">
                  <Textarea
                    value={caption}
                    onChange={(e) => {
                      setCaption(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="Write a caption..."
                    maxLength={150}
                    rows={1}
                    className="w-full bg-transparent text-white placeholder:text-white/60 text-lg md:text-xl outline-none resize-none overflow-hidden max-h-32 drop-shadow-md font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {/* Hashtags */}
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-[16px] px-4 py-3.5">
                    <Hash size={18} className="text-white/70" />
                    <Input
                      type="text"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      placeholder="Add hashtags..."
                      className="w-full bg-transparent text-white placeholder:text-white/50 text-[15px] outline-none font-medium"
                    />
                  </div>

                  <div className="flex gap-3">
                    {/* Location */}
                    <Button
                      onClick={!locationName ? fetchLocation : undefined}
                      className="flex-1 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-[16px] px-4 py-3.5 text-[15px] font-medium transition-colors hover:bg-black/60 min-w-0"
                    >
                      <MapPin size={18} className="text-white/70 shrink-0" />
                      <span className="truncate flex-1 text-left text-white/90">
                        {locationName
                          ? locationName
                          : isLocating
                            ? "Locating..."
                            : "Location"}
                      </span>
                      {locationName && (
                        <X
                          size={14}
                          className="text-white/50 hover:text-white ml-2 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationName("");
                          }}
                        />
                      )}
                    </Button>

                    {/* Privacy */}
                    <div className="relative flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-[16px] px-4 py-3.5 flex items-center gap-2 hover:bg-black/60 transition-colors">
                      <Globe size={18} className="text-white/70 shrink-0" />
                      <span className="text-white/90 text-[15px] font-medium truncate">
                        {privacy}
                      </span>
                      <Select
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      >
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!file || isPreparing}
                  className="w-full mt-4 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-[16px] shadow-[0_0_30px_rgba(191,243,103,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a6d855] transition-all text-[15px]"
                >
                  {isPreparing ? "Preparing..." : "Share Reel"}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default UploadReel;
