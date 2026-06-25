import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@kridaz/ui";

import {
  Star,
  Shield,
  Video,
  Activity,
  Award,
  Check,
  ChevronRight,
} from "lucide-react";

const GRAD = "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)";

export default function ProfessionalsSection({
  featureFlags,
  professionals,
  professionalsLoading,
}) {
  const navigate = useNavigate();

  if (!featureFlags["find_professionals"]) return null;

  return (
    <section
      className="py-6 lg:py-12 px-4 lg:px-12 border-b"
      style={{ backgroundColor: "#000", borderColor: "var(--card)" }}
    >
      <div className="w-full">
        <div className="relative flex flex-row items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="relative">
            <div
              className="absolute -left-6 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full shadow-[0_0_25px_rgba(85,222,232,0.5)] hidden md:block"
              style={{ background: GRAD }}
            ></div>
            <h2
              className="text-[14px] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              Pro{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Experts
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 mr-4">
              {["ALL SPORTS", "CRICKET", "BADMINTON", "FOOTBALL", "TENNIS"].map(
                (tab, i) => (
                  <Button
                    key={tab}
                    className={`px-6 py-2.5 rounded-full font-black text-[10px] shrink-0 transition-all duration-300 uppercase tracking-widest border ${
                      i === 0
                        ? "text-black shadow-[0_0_15px_rgba(85,222,232,0.3)]"
                        : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white"
                    }`}
                    style={
                      i === 0
                        ? {
                            background:
                              "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)",
                            borderColor: "var(--primary)",
                          }
                        : {}
                    }
                  >
                    {tab}
                  </Button>
                )
              )}
            </div>
            <Link
              to="/professionals"
              className="flex items-center gap-1 font-semibold text-[10px] md:text-[15px] transition-all hover:text-primary text-muted-foreground whitespace-nowrap"
            >
              View All <span className="hidden md:inline">Pros</span>{" "}
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-3 md:gap-4">
          {professionalsLoading ? (
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-[1/1.3] rounded-[8px] bg-white/5 border border-white/5 animate-pulse"
              />
            ))
          ) : professionals.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-[8px]">
              <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">
                No professionals active in your area
              </p>
            </div>
          ) : (
            professionals.slice(0, 8).map((pro) => (
              <div
                key={pro._id || pro.id}
                className="group cursor-pointer"
                onClick={() =>
                  navigate(`/profile/${pro.userId || pro.id || pro._id}`)
                }
              >
                <div className="relative bg-card rounded-[8px] p-1.5 border border-white/5 transition-all duration-500 hover:border-primary/20 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                  {/* Compact Profile Image Section */}
                  <div className="relative aspect-[1/1.2] rounded-[8px] overflow-hidden block mb-2.5">
                    <div className="w-full h-full bg-card flex items-center justify-center">
                      {pro.profilePicture ? (
                        <img
                          src={pro.profilePicture}
                          alt={pro.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextElementSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="relative z-10 flex items-center justify-center w-full h-full bg-gradient-to-br from-card to-background"
                        style={{
                          display: pro.profilePicture ? "none" : "flex",
                        }}
                      >
                        <span className="text-primary font-black text-3xl tracking-tighter opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                          {pro.name
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 z-20">
                      <div className="px-2 py-1 rounded-[6px] bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-primary text-[8px] font-bold shadow-lg">
                        ₹{pro.price || "500"}/
                        {pro.role === "coach" ? "hr" : "match"}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="absolute top-2 left-2 z-20">
                      <div className="px-2 py-1 rounded-[6px] bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-[8px] font-black tracking-widest gap-1 shadow-lg">
                        {pro.role === "umpire" ? (
                          <Shield size={8} className="text-primary" />
                        ) : pro.role === "streamer" ? (
                          <Video size={8} className="text-primary" />
                        ) : pro.role === "scorer" ? (
                          <Activity size={8} className="text-primary" />
                        ) : (
                          <Award size={8} className="text-primary" />
                        )}
                        <span className="text-primary">
                          {pro.role?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-1.5 pb-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <h3 className="text-white font-bold text-[13px] tracking-tight group-hover:text-primary transition-colors line-clamp-1 font-open-sans capitalize">
                        {pro.name?.toLowerCase()}
                      </h3>
                      <div className="flex items-center justify-center w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0">
                        <Check
                          size={7}
                          strokeWidth={4}
                          className="text-white"
                        />
                      </div>
                    </div>

                    <p className="text-white/40 text-[9px] font-medium leading-tight mb-3 line-clamp-1">
                      <span className="capitalize">
                        {pro.businessDetails?.specialization?.toLowerCase() ||
                          "expert coach"}
                      </span>{" "}
                      •{" "}
                      {pro.businessDetails?.experience?.toLowerCase() ||
                        "5+ years"}
                    </p>

                    {/* Bottom Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-white/80">
                          <Star
                            size={12}
                            className="text-primary fill-primary"
                          />
                          <span className="text-[10px] font-bold">
                            {pro.rating?.toFixed(1) || "5.0"}
                          </span>
                        </div>
                        <div className="flex items-center text-white/30">
                          <span className="text-[9px] font-medium">
                            ({pro.numReviews || 0})
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/profile/${pro.userId || pro.id || pro._id}`
                          );
                        }}
                        className="px-4 py-2 rounded-[8px] font-black text-[9px] uppercase tracking-wider transition-all duration-300 text-black hover:scale-105 shadow-[0_0_15px_rgba(85,222,232,0.3)]"
                        style={{ background: GRAD }}
                      >
                        BOOK
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
