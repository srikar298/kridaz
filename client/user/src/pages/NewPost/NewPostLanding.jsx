import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Image as ImageIcon,
  Video,
  Sparkles,
  SwitchCamera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const POST_TYPES = ["Post", "Reel", "Story"];

const NewPostLanding = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const holdTimerRef = useRef(null);

  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Reel");
  const [facingMode, setFacingMode] = useState("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef(0);
  const [previewMedia, setPreviewMedia] = useState(null);

  useEffect(() => {
    recordingDurationRef.current = recordingDuration;
  }, [recordingDuration]);

  const startCamera = useCallback(async () => {
    // Ensure any existing streams are fully stopped before starting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      try {
        const mediaStreamFallback = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        setStream(mediaStreamFallback);
        streamRef.current = mediaStreamFallback;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStreamFallback;
        }
      } catch (fallbackErr) {
        console.error("Error accessing camera fallback:", fallbackErr);
      }
    }
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        // Also fire stop event manually just in case
        try {
          track.enabled = false;
        } catch (e) {
          /* ignore */
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => {
        track.stop();
        try {
          track.enabled = false;
        } catch (e) {
          /* ignore */
        }
      });
      videoRef.current.srcObject = null;
    }
    setStream((prevStream) => {
      if (prevStream) {
        prevStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
  }, []);

  // Start the camera when the component mounts
  useEffect(() => {
    startCamera();

    // Cleanup camera when leaving the page
    return () => {
      stopCamera();
    };
  }, [startCamera]); // We handle stream dependencies in stopCamera

  // No need for a separate useEffect to re-attach stream as it's handled by startCamera

  // Handle Recording Timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-stop recording at 60 seconds
  useEffect(() => {
    if (isRecording && recordingDuration >= 60) {
      stopRecording();
    }
  }, [recordingDuration, isRecording]);

  const setPreview = (file) => {
    const isVideo = file.type.startsWith("video");
    setPreviewMedia({
      file,
      type: isVideo ? "video" : "image",
      url: URL.createObjectURL(file),
    });
    stopCamera();
  };

  const handleMediaCaptured = useCallback(
    (file) => {
      if (activeTab === "Reel") {
        navigate("/reels/upload", { state: { preSelectedFile: file } });
      } else if (activeTab === "Post") {
        navigate("/create-post", { state: { preSelectedFile: file } });
      } else if (activeTab === "Story") {
        navigate("/create-story", { state: { preSelectedFile: file } });
      }
    },
    [activeTab, navigate]
  );

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          setPreview(file);
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    try {
      let options = {};
      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          options = { mimeType: "video/mp4" };
        } else if (
          MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ) {
          options = { mimeType: "video/webm;codecs=vp9,opus" };
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          options = { mimeType: "video/webm" };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordingDurationRef.current < 5) return;

        const finalMimeType = mediaRecorder.mimeType || "video/webm";
        const ext = finalMimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(recordedChunksRef.current, {
          type: finalMimeType,
        });
        const file = new File([blob], `video.${ext}`, { type: finalMimeType });
        setPreview(file);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      if (recordingDurationRef.current < 5) {
        import("react-hot-toast").then((module) => {
          module.default.error("Video must be at least 5 seconds long", {
            id: "video-duration-error",
          });
        });
        mediaRecorderRef.current.onstop = null; // Discard
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handlePointerDown = (e) => {
    // Prevent context menu or long press text selection
    e.preventDefault();

    // For Posts, we only allow taking photos (tapping), not recording video
    if (activeTab === "Post") return;

    holdTimerRef.current = setTimeout(() => {
      startRecording();
    }, 500); // 500ms hold to start recording video
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    } else {
      // If we didn't hold long enough to trigger recording, it's a photo tap
      if (activeTab === "Reel") {
        import("react-hot-toast").then((module) => {
          module.default.error("Reels must be a video.", {
            id: "reel-photo-error",
          });
        });
        return;
      }
      takePhoto();
    }
  };

  // Handle Tab Switch
  const handleTabSwitch = (type) => {
    if (type === "Post") {
      navigate("/create-post");
      return;
    }
    setActiveTab(type);
  };

  const handleGalleryUpload = () => {
    // Determine accepted file types based on active tab
    let acceptTypes = "image/*,video/*";
    if (activeTab === "Reel") {
      acceptTypes = "video/*";
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = acceptTypes;
    input.multiple = activeTab === "Post";
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        if (activeTab === "Post") {
          // If we allow multiple, bypass duration check for images and navigate directly
          navigate("/create-post", { state: { preSelectedFiles: files } });
        } else {
          const file = files[0];
          if (file.type.startsWith("video")) {
            const videoElement = document.createElement("video");
            videoElement.preload = "metadata";
            videoElement.onloadedmetadata = () => {
              window.URL.revokeObjectURL(videoElement.src);
              if (videoElement.duration < 5) {
                import("react-hot-toast").then((module) => {
                  module.default.error(
                    "Video must be at least 5 seconds long",
                    { id: "video-duration-error" }
                  );
                });
                return;
              }
              handleMediaCaptured(file);
            };
            videoElement.src = URL.createObjectURL(file);
          } else {
            if (activeTab === "Reel") {
              import("react-hot-toast").then((module) => {
                module.default.error("Photos are not allowed on Reels", {
                  id: "reel-photo-error",
                });
              });
              return;
            }
            handleMediaCaptured(file);
          }
        }
      }
    };
    input.click();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (previewMedia) {
    return (
      <div className="w-full h-[100dvh] relative bg-black overflow-hidden font-sans">
        {previewMedia.type === "video" ? (
          <video
            src={previewMedia.url}
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            autoPlay
            loop
            playsInline
            muted
            controls
          />
        ) : (
          <img
            src={previewMedia.url}
            className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
            alt="Preview"
          />
        )}

        {/* Top Controls */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
          <Button
            onClick={() => {
              URL.revokeObjectURL(previewMedia.url);
              setPreviewMedia(null);
              startCamera();
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors"
          >
            <X size={24} />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 w-full z-20 flex justify-between items-center px-6 pb-12 pointer-events-auto">
          {/* Spacer for flex distribution */}
          <div className="flex-1" />

          <Button
            onClick={() => handleMediaCaptured(previewMedia.file)}
            className="px-8 py-3 bg-primary text-black font-bold uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(191,243,103,0.3)] hover:scale-105 active:scale-95 transition-all"
          >
            Continue
          </Button>

          <div className="flex-1 flex justify-end">
            <Button
              onClick={() => {
                URL.revokeObjectURL(previewMedia.url);
                setPreviewMedia(null);
                startCamera();
              }}
              className="px-6 py-2.5 bg-white/10 backdrop-blur-md text-white font-medium rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              Retake
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] relative bg-black overflow-hidden font-sans">
      {/* Live Camera Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Gradient for visibility of top controls */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <Button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10 hover:bg-black/60 transition-colors"
        >
          <X size={24} />
        </Button>
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-500/80 backdrop-blur-md px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold">
              {formatTime(recordingDuration)}
            </span>
          </div>
        )}
        <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center border border-white/10">
          <Sparkles size={20} className="text-primary" />
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="absolute bottom-0 left-0 w-full z-20 flex flex-col items-center pb-6 pointer-events-auto">
        {/* Post Type Selector */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex gap-1 shadow-2xl mb-4">
          {POST_TYPES.map((type) => (
            <Button
              key={type}
              onClick={() => handleTabSwitch(type)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === type
                  ? "bg-white text-black shadow-md scale-105"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {type}
            </Button>
          ))}
        </div>

        {/* Actions Row */}
        <div className="relative flex items-center justify-center w-full h-24 mt-2">
          {/* Upload Button */}
          <Button
            onClick={handleGalleryUpload}
            className={`absolute transition-all duration-300 flex items-center justify-center gap-1 hover:bg-white/10 bg-black/60 backdrop-blur-md border border-white/20 rounded-full shadow-xl left-4 px-2.5 py-1 z-10`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center`}
            >
              {activeTab === "Reel" ? (
                <Video size={12} className="text-primary" />
              ) : (
                <ImageIcon size={12} className="text-primary" />
              )}
            </div>
            <span className="text-[9px] font-bold text-white tracking-wide uppercase pr-0.5">
              Upload
            </span>
          </Button>

          {/* Capture Button */}
          <Button
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp} // Safety to stop if finger slides off
            className={`w-20 h-20 rounded-full border-[4px] flex items-center justify-center transition-all duration-300 z-20 ${isRecording ? "border-red-500/50 scale-110" : "border-white/50 hover:scale-105 active:scale-95"}`}
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 ${isRecording ? "bg-red-500 scale-75 rounded-[12px]" : "bg-white"}`}
            >
              {!isRecording && (
                <div className="w-14 h-14 border-[2px] border-black/10 rounded-full" />
              )}
            </div>
          </Button>

          {/* Flip Camera Button */}
          <Button
            onClick={toggleCamera}
            className={`absolute transition-all duration-300 flex items-center justify-center w-11 h-11 hover:bg-white/10 bg-black/60 backdrop-blur-md border border-white/20 rounded-full shadow-xl right-4 z-10`}
          >
            <SwitchCamera size={20} className="text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewPostLanding;
