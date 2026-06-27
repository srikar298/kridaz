import React from "react";
import { Link } from "react-router-dom";

export default function PromotionsSection({ marketingContent }) {
  const banners = marketingContent?.banners || [];
  const promotions = banners
    .filter((b) => b.type === "PROMOTION" && b.isActive)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="!mt-8 px-2 space-y-4">
      {/* Dynamic Promotions */}
      {promotions.map((promo) => {
        const Wrapper = promo.targetUrl ? "a" : "div";
        const wrapperProps = promo.targetUrl
          ? {
              href: promo.targetUrl,
              target: "_blank",
              rel: "noopener noreferrer",
            }
          : {};

        return (
          <Wrapper
            key={promo._id || promo.id}
            {...wrapperProps}
            className="relative block overflow-hidden rounded-2xl w-full aspect-video shadow-[0_4px_20px_rgba(0,0,0,0.5)] group border border-white/[0.05] hover:border-primary/50 transition-all duration-300 cursor-pointer"
          >
            {promo.videoUrl ? (
              <video
                src={promo.videoUrl}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                style={{
                  backgroundImage: `url('${promo.imageUrl || ""}')`,
                }}
              />
            )}
          </Wrapper>
        );
      })}

      {/* Static Host Your Venue */}
      {promotions.length === 0 && (
        <Link
          to="/business/venue"
          className="relative block overflow-hidden rounded-2xl w-full aspect-video shadow-[0_4px_20px_rgba(0,0,0,0.5)] group border border-white/[0.05] hover:border-primary/50 transition-all duration-300"
        >
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: "url('/host-venue-bg-custom-2.webp')",
            }}
          />
          <div className="relative z-10 w-[45%] h-full p-4 flex flex-col justify-center gap-1.5 pl-5">
            <h3 className="text-[16px] leading-tight font-black text-white uppercase drop-shadow-lg">
              Host Your Venue
            </h3>
            <p className="text-[9px] font-medium text-white/90 leading-snug drop-shadow-md">
              Partner with us to list your turf and manage bookings seamlessly.
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}
