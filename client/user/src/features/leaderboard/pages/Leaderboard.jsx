import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trophy, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const PRI = "#BFF367";
const GRAD = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";

const HEADING_STYLE = { fontFamily: "'Open Sans', sans-serif" };
const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState("Cricket");
  const [category, setCategory] = useState("batting"); // 'batting', 'bowling', or sport-specific stats
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const sports = [{ name: "Cricket", image: "/Cricket_transparent.png" }];

  // Map sport to categories
  const sportCategories = {
    Cricket: ["batting", "bowling"],
    Football: ["goals", "assists"],
    Pickleball: ["singles", "doubles"],
    Badminton: ["singles", "doubles"],
    Tennis: ["singles", "doubles"],
  };

  useEffect(() => {
    // Reset category when sport changes
    setCategory(sportCategories[selectedSport][0]);
  }, [selectedSport]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // In a real app, we would pass sport and category to the API
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/leaderboard?sport=${selectedSport.toLowerCase()}&category=${category}`
        );
        if (response.data.success) {
          setPlayers(response.data.players || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [category, selectedSport]);

  const getRankIcon = (rank) => {
    if (rank === 1)
      return (
        <div className="w-8 h-10 bg-gradient-to-b from-[#BFF367] to-[#BFF367] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(85,222,232,0.4)] border border-[#BFF367]/30 text-black font-black">
          1
        </div>
      );
    if (rank === 2)
      return (
        <div className="w-8 h-10 bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(148,163,184,0.4)] border border-gray-200/30 text-black font-black">
          2
        </div>
      );
    if (rank === 3)
      return (
        <div className="w-8 h-10 bg-gradient-to-b from-[#BFF367] to-[#BFF367] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(180,83,9,0.4)] border border-[#BFF367]/30 text-black font-black">
          3
        </div>
      );
    return <span className="text-gray-500 font-bold ml-3">{rank}</span>;
  };

  return (
    <div className="h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-[400px] z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2073&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover opacity-20 filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 px-4 sm:px-8 py-6 sm:py-10 max-w-[1400px] mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-12">
            <Trophy
              size={40}
              className="text-[#BFF367] mb-4 drop-shadow-[0_0_10px_rgba(85,222,232,0.5)]"
            />
            <h1
              className="text-5xl font-black tracking-tighter uppercase mb-2"
              style={HEADING_STYLE}
            >
              {selectedSport}{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Leaderboard
              </span>
            </h1>
            <p
              className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]"
              style={SUBHEADING_STYLE}
            >
              Dominating the turf worldwide
            </p>
            <div
              className="w-12 h-1 rounded-full mt-4"
              style={{ background: GRAD }}
            ></div>
          </div>

          {/* Category & Filters Row */}
          <div className="flex flex-col w-full mb-8">
            <div className="flex justify-center gap-3 mb-6">
              {sportCategories[selectedSport].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2 rounded-full text-[13px] font-medium capitalize transition-all ${category === cat ? "bg-[#BFF367] text-black" : "bg-[#111] text-gray-400 hover:bg-[#1a1a1a]"}`}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end mb-4 px-2">
              <div className="flex gap-2">
                <select className="bg-transparent text-gray-500 text-xs outline-none cursor-pointer">
                  <option>All Time</option>
                  <option>Monthly</option>
                  <option>Weekly</option>
                </select>
                <select className="bg-transparent text-gray-500 text-xs outline-none cursor-pointer">
                  <option>Worldwide</option>
                  <option>National</option>
                  <option>Regional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Area Container */}
          <div className="w-full">
            {/* List Area */}
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                  <div
                    className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4"
                    style={{
                      borderColor: "#BFF367",
                      borderTopColor: "transparent",
                      background: "none",
                    }}
                  />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                    Retrieving Arena Data...
                  </p>
                </div>
              ) : players.length > 0 ? (
                players.map((player, idx) => (
                  <motion.div
                    key={player.id || player._id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() =>
                      navigate(`/profile/${player.id || player._id}`)
                    }
                    className="flex items-center bg-white/[0.03] border border-white/5 rounded-[12px] p-4 hover:bg-white/[0.05] transition-all cursor-pointer shadow-lg relative"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative w-14 h-14 rounded-full flex-shrink-0">
                        <img
                          src={
                            player.profilePicture ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`
                          }
                          alt=""
                          className="w-full h-full object-cover rounded-full border border-white/10"
                        />
                        {player.isPro && (
                          <span className="absolute -top-1 -right-2 bg-[#BFF367] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-white text-[15px] font-medium leading-tight truncate max-w-[120px]">
                            {player.name}
                          </h3>
                          <span
                            className="text-gray-500 text-[11px] italic truncate max-w-[130px] inline-block"
                            title={player.city || ""}
                          >
                            (
                            {player.city
                              ? `India, ${player.city.split(",")[0].trim()}`
                              : "India"}
                            )
                          </span>
                        </div>
                        <div className="text-gray-400 text-[12px] mt-1 flex flex-wrap items-center gap-x-1.5">
                          {category === "batting" ? (
                            <>
                              <span>
                                Inn: {player.cricketStats?.matchesPlayed || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span className="font-bold text-white">
                                Runs: {player.cricketStats?.totalRuns || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                Avg: {player.cricketStats?.average || "0.00"}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                SR: {player.cricketStats?.strikeRate || "0.00"}
                              </span>
                            </>
                          ) : category === "bowling" ? (
                            <>
                              <span>
                                Inn: {player.cricketStats?.matchesPlayed || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span className="font-bold text-white">
                                W: {player.cricketStats?.totalWickets || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                Eco: {player.cricketStats?.economy || "0.00"}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                SR: {player.cricketStats?.strikeRate || "0.00"}
                              </span>
                            </>
                          ) : (
                            <>
                              <span>
                                Mat: {player.cricketStats?.matchesPlayed || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span className="font-bold text-white">
                                Dismissals:{" "}
                                {player.cricketStats?.dismissals || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                Catches: {player.cricketStats?.catches || 0}
                              </span>{" "}
                              <span className="text-white/20">|</span>
                              <span>
                                St.: {player.cricketStats?.stumpings || 0}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[32px] font-light text-white ml-4 w-12 text-right">
                      {idx + 1}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-40">
                  <LayoutGrid size={48} className="text-white/5 mb-4" />
                  <p className="text-gray-600 font-black uppercase text-xs tracking-widest">
                    No rankings available yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
