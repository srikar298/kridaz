import { useEffect, useRef } from "react";
import { Play, Youtube } from "lucide-react";
import { gsap } from "gsap";

const PRI = "#BFF367";

export const VideoSection = ({ videos = [] }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (videos.length > 0) {
      const scrollWidth = scrollRef.current.scrollWidth;
      const viewportWidth = scrollRef.current.offsetWidth;

      // Infinite horizontal scroll effect using GSAP
      const animation = gsap.to(scrollRef.current, {
        x: -(scrollWidth / 2),
        duration: 30,
        ease: "none",
        repeat: -1,
      });

      scrollRef.current.addEventListener("mouseenter", () => animation.pause());
      scrollRef.current.addEventListener("mouseleave", () => animation.play());

      return () => {
        animation.kill();
      };
    }
  }, [videos]);

  if (!videos || videos.length === 0) return null;

  // Duplicate videos for seamless infinite scroll
  const displayVideos = [...videos, ...videos];

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <section className="pt-2 lg:pt-4 pb-6 lg:pb-10 bg-black overflow-hidden border-t border-white/5">
      <div className="w-full px-4 lg:px-12 mb-12 flex items-end justify-between">
        <div>
          <h2 className="font-display text-5xl md:text-7xl uppercase leading-none text-white tracking-tight">
            Playbook <span style={{ color: PRI }}>Highlights</span>
          </h2>
          <p className="font-script text-2xl mt-2" style={{ color: PRI }}>
            watch the elite in action
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">
          <Youtube size={14} />
          Dynamic_Feed_v2.0
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-6 px-6 cursor-grab active:cursor-grabbing"
          style={{ width: "max-content" }}
        >
          {displayVideos.map((video, idx) => {
            const videoId = getYoutubeId(video.youtubeUrl);
            const thumbUrl = videoId
              ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
              : "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80";

            return (
              <div
                key={`${video._id}-${idx}`}
                className="w-[350px] md:w-[450px] aspect-video rounded-[8px] overflow-hidden border border-white/10 relative group bg-[#111]"
              >
                <img
                  src={thumbUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 flex items-center justify-center text-primary scale-90 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(85,222,232,0.3)]">
                    <Play size={28} fill={PRI} />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6">
                  <h3 className="font-display text-xl text-white uppercase tracking-wider line-clamp-1">
                    {video.title}
                  </h3>
                </div>

                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 z-10"
                  aria-label={`Watch ${video.title}`}
                />
              </div>
            );
          })}
        </div>

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />
      </div>
    </section>
  );
};
