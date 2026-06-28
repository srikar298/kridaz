import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@kridaz/ui";

import {
  ChevronRight,
} from "lucide-react";
import ProfessionalCard from "../../features/networking/components/ProfessionalCard";

const GRAD = "linear-gradient(90deg, var(--primary) 0%, var(--primary) 100%)";

export default function ProfessionalsSection({
  featureFlags,
  professionals,
  professionalsLoading,
}) {
  const navigate = useNavigate();

  if (!featureFlags["find_professionals"]) return null;
  if (!professionalsLoading && (!professionals || professionals.length === 0)) return null;

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
              <ProfessionalCard 
                key={pro._id || pro.id} 
                pro={pro} 
                getInitials={(name) => name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)} 
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
