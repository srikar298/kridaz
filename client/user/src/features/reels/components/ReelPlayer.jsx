import React, { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useTrackHeartbeatMutation } from "@redux/api/reelsApi";
import Hls from "hls.js";

const ReelPlayer = ({ reelId, hlsUrl, isVisible, poster }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [trackHeartbeat] = useTrackHeartbeatMutation();
  const watchTimeRef = useRef(0);

  // CORS Proxy for local development
  const finalHlsUrl = React.useMemo(() => {
    if (!hlsUrl) return hlsUrl;
    const cdnUrl = import.meta.env.VITE_REELS_CDN_URL;
    if (import.meta.env.DEV && cdnUrl && hlsUrl.startsWith(cdnUrl)) {
      return hlsUrl.replace(cdnUrl, "/r2-reels");
    }
    return hlsUrl;
  }, [hlsUrl]);

  // Heartbeat tracking
  useEffect(() => {
    let interval;
    if (isVisible && videoRef.current && isLoaded) {
      interval = setInterval(() => {
        if (!videoRef.current.paused) {
          watchTimeRef.current += 1;
          // Send heartbeat every 5 seconds
          if (watchTimeRef.current % 5 === 0) {
            trackHeartbeat({
              reelId,
              watchTime: 5,
              completed: videoRef.current.ended,
            });
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      // Send final heartbeat on unmount/deactivate
      if (watchTimeRef.current % 5 !== 0 && watchTimeRef.current > 0) {
        trackHeartbeat({
          reelId,
          watchTime: watchTimeRef.current % 5,
          completed: videoRef.current?.ended,
        });
      }
      watchTimeRef.current = 0;
    };
  }, [isVisible, reelId, trackHeartbeat]);

  // HLS Initialization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    // Check for HLS support
    const src = finalHlsUrl || hlsUrl;
    if (src && (src.endsWith(".m3u8") || src.includes(".m3u8"))) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: false, // Don't download video segments until visible
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          // Manifest loaded
          if (isVisible) {
            hls.startLoad();
            video.play().catch(() => setIsPlaying(false));
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      }
    } else if (src) {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [finalHlsUrl]);

  // Visibility Play/Pause Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      if (hlsRef.current) {
        hlsRef.current.startLoad(); // Start loading segments for HLS
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
      setIsPlaying(false);
      // We don't call stopLoad() here because it would cancel the initial
      // manifest request for off-screen reels, causing them to break.
    }
  }, [isVisible]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center"
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        loop
        muted={isMuted}
        playsInline
        onCanPlay={() => setIsLoaded(true)}
        onLoadedData={() => setIsLoaded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Play/Pause Indicator Overlay (Mobile Style) */}
      {!isPlaying && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <Play size={64} className="text-white/80" fill="currentColor" />
        </div>
      )}

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-10 right-4 p-2 bg-black/40 rounded-[8px] text-white backdrop-blur-sm z-10"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Loading Spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default ReelPlayer;
