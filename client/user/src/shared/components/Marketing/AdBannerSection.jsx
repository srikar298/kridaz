import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { gsap } from "gsap";

const PRI = "#BFF367";

export const AdBannerSection = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRef = useRef(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const bannerDuration = 7000; // Increase slightly for videos to 7 seconds

  useEffect(() => {
    if (banners.length > 0) {
      startTimer();
    }
    return () => stopTimer();
  }, [currentIndex, banners]);

  useEffect(() => {
    // Reset video control states when changing slides
    setIsMuted(true);
    setIsPlaying(true);
  }, [currentIndex]);

  const startTimer = () => {
    stopTimer();

    // Reset and animate progress bar
    gsap.set(progressRef.current, { width: "0%" });
    gsap.to(progressRef.current, {
      width: "100%",
      duration: bannerDuration / 1000,
      ease: "none",
      onComplete: nextSlide,
    });
  };

  const stopTimer = () => {
    gsap.killTweensOf(progressRef.current);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        stopTimer();
      } else {
        videoRef.current.play();
        startTimer();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const isVideo = !!currentBanner.videoUrl;

  return (
    <section className="relative w-full overflow-hidden bg-black py-0">
      <div className="w-full px-1 md:px-2">
        <div className="relative group aspect-[16/9] rounded-[8px] md:rounded-[8px] overflow-hidden border border-white/10 shadow-2xl">
          {/* Banner Media Container (Horizontal Slides) */}
          <div
            className="flex h-full w-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner, idx) => {
              const isBannerVideo = !!banner.videoUrl;
              const isCurrent = idx === currentIndex;
              return (
                <div key={idx} className="relative w-full h-full shrink-0">
                  {isBannerVideo ? (
                    <video
                      ref={isCurrent ? videoRef : null}
                      src={banner.videoUrl}
                      className="w-full h-full object-cover opacity-90"
                      autoPlay={isCurrent}
                      muted={isMuted}
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  {banner.targetUrl && (
                    <a
                      href={banner.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-20"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Video Control Overlays */}
          {isVideo && (
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} className="fill-white hover:fill-black" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-primary hover:text-black transition-all"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}

          {/* Indicators */}
          <div className="absolute bottom-6 right-8 flex gap-2 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 rounded-full transition-all ${idx === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-white/20 hover:bg-white/40"}`}
                style={idx === currentIndex ? { backgroundColor: PRI } : {}}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
