import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Trophy, ShieldCheck, Zap, Search } from "lucide-react";
import { Button } from "@kridaz/ui";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

export default function HostGameLanding() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const tiles = [
    {
      id: "TOURNAMENT",
      label: "Host Tournament",
      icon: <Trophy size={20} className="text-[#FFD700]" />,
      desc: "League, Knockout, IPL Style",
      route: "/tournament/create",
      disabled: true,
    },
    {
      id: "QUICK_MATCH",
      label: "Quick Match",
      icon: <Zap size={20} className="text-[#00E5FF]" />,
      desc: "Find players nearby",
      route: "/host-game/quick",
    },
    {
      id: "PRO_MATCH",
      label: "Pro Match",
      icon: <ShieldCheck size={20} className="text-[#BFF367]" />,
      desc: "Team vs Team",
      route: "/host-game/pro",
    },
    {
      id: "LOOKING_FOR",
      label: "Looking For",
      icon: <Search size={20} />,
      desc: "Hire or find players",
      route: "/host-game/looking-for",
    },
  ];

  const handleTileClick = (tile) => {
    if (tile.disabled) return;

    if (!user?.city || !user?.state) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">
              Please fill out your location (City & State) in your profile first!
            </span>
            <Button
              onClick={() => {
                navigate("/profile");
                toast.dismiss(t.id);
              }}
              className="bg-primary text-black text-xs py-1 px-3 mt-1 w-fit rounded-full hover:bg-primary/80"
            >
              Complete Profile
            </Button>
          </div>
        ),
        { duration: 5000 }
      );
      return;
    }

    navigate(tile.route);
  };

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-6 pb-24 overflow-x-hidden font-inter flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-6"
      >
        <div className="text-center space-y-2 mb-8">
          <h1
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white"
            style={HEADING_STYLE}
          >
            Create A <span className="text-primary">Match</span>
          </h1>
          <p
            className="text-xs sm:text-sm text-white/50 tracking-widest uppercase font-medium max-w-md mx-auto"
            style={SUBHEADING_STYLE}
          >
            Choose your match type and set it up
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-white/70 mb-3 uppercase tracking-widest flex items-center gap-2">
            <div className="w-[3px] h-[14px] bg-gradient-to-b from-secondary to-primary rounded-full" />
            Matches & Players
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiles.map((tile) => (
              <button
                type="button"
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`group relative rounded-[16px] p-[1.5px] transition-all duration-300 overflow-hidden text-center flex flex-col text-left ${
                  tile.disabled ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                }`}
              >
                {/* Gradient Border Overlay - Only visible on hover */}
                {!tile.disabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[16px]" />
                )}

                {/* Normal Border Overlay - Fades out on hover */}
                <div className={`absolute inset-0 border-[1.5px] border-white/10 ${!tile.disabled ? "group-hover:opacity-0" : ""} transition-opacity duration-300 rounded-[16px]`} />

                <div className="relative bg-background rounded-[15px] p-3 sm:p-4 h-full w-full flex flex-col items-center justify-center">
                  <div className={`w-10 h-10 rounded-full bg-card text-white/70 flex items-center justify-center mb-2 transition-colors ${!tile.disabled ? "group-hover:text-primary" : ""}`}>
                    {tile.icon}
                  </div>
                  <h3
                    className="text-[10px] sm:text-xs font-black mb-1 uppercase text-white tracking-widest text-center w-full"
                    style={HEADING_STYLE}
                  >
                    {tile.label}
                  </h3>
                  <p
                    className="text-[9px] text-white/50 tracking-wider text-center w-full"
                    style={SUBHEADING_STYLE}
                  >
                    {tile.desc}
                  </p>
                  {tile.disabled && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-[15px] z-10">
                      <span className="transform -rotate-12 border border-primary text-primary font-black text-[10px] px-2 py-1 tracking-widest uppercase rounded">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
