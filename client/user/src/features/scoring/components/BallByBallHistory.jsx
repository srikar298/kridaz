import React, { useState, useMemo } from "react";
import { Shield } from "lucide-react";
import { Button } from "@kridaz/ui";


const ballColor = (ball) => {
  if (ball.isWicket) return "bg-red-600 text-white";
  if (ball.isExtra) return "bg-yellow-500 text-black";
  if (ball.runs === 6) return "bg-primary text-black";
  if (ball.runs === 4) return "bg-green-500 text-black";
  if (ball.runs === 0) return "bg-white/10 text-gray-400";
  return "bg-white/20 text-white";
};

const ballLabel = (ball) => {
  if (ball.isWicket) return "W";
  if (ball.extraType === "WIDE") return "Wd";
  if (ball.extraType === "NO_BALL") return "Nb";
  return String(ball.runs ?? "-");
};

const BallByBallHistory = ({ matchData }) => {
  const [filterOver, setFilterOver] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPlayer, setFilterPlayer] = useState("all");

  const timeline = matchData?.timeline || [];

  const maxOver = useMemo(
    () => Math.max(0, ...timeline.map((b) => b.over ?? 0)),
    [timeline]
  );
  const overOptions = useMemo(
    () => Array.from({ length: maxOver + 1 }, (_, i) => i),
    [maxOver]
  );

  const players = useMemo(() => {
    const pMap = new Map();
    timeline.forEach((b) => {
      if (b.batter?._id) pMap.set(b.batter._id, b.batter.name);
      if (b.bowler?._id) pMap.set(b.bowler._id, b.bowler.name);
    });
    return Array.from(pMap.entries()).map(([id, name]) => ({ id, name }));
  }, [timeline]);

  const filtered = useMemo(() => {
    return timeline.filter((ball) => {
      const overMatch =
        filterOver === "all" || ball.over === parseInt(filterOver);
      const typeMatch =
        filterType === "all" ||
        (filterType === "wicket" && ball.isWicket) ||
        (filterType === "boundary" && (ball.runs === 4 || ball.runs === 6)) ||
        (filterType === "extra" && ball.isExtra) ||
        (filterType === "dot" && !ball.isExtra && ball.runs === 0);
      const playerMatch =
        filterPlayer === "all" ||
        ball.batter?._id === filterPlayer ||
        ball.bowler?._id === filterPlayer;
      return overMatch && typeMatch && playerMatch;
    });
  }, [timeline, filterOver, filterType, filterPlayer]);

  const groupedByOver = useMemo(() => {
    const groups = {};
    filtered.forEach((ball) => {
      const key = ball.over ?? 0;
      if (!groups[key]) groups[key] = [];
      groups[key].push(ball);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            ["all", "All"],
            ["wicket", "Wickets"],
            ["boundary", "Boundaries"],
            ["extra", "Extras"],
            ["dot", "Dots"],
          ].map(([val, label]) => (
            <Button
              key={val}
              onClick={() => setFilterType(val)}
              className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${filterType === val ? "bg-primary text-black" : "bg-white/5 text-gray-500 border border-white/10"}`}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Button
            onClick={() => setFilterPlayer("all")}
            className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${filterPlayer === "all" ? "bg-white/20 text-white" : "bg-white/5 text-gray-500 border border-white/10"}`}
          >
            All Players
          </Button>
          {players.map((p) => (
            <Button
              key={p.id}
              onClick={() => setFilterPlayer(p.id)}
              className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${filterPlayer === p.id ? "bg-white/20 text-white" : "bg-white/5 text-gray-500 border border-white/10"}`}
            >
              {p.name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <Button
            onClick={() => setFilterOver("all")}
            className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${filterOver === "all" ? "bg-white/20 text-white" : "bg-white/5 text-gray-500 border border-white/10"}`}
          >
            All Overs
          </Button>
          {overOptions.map((ov) => (
            <Button
              key={ov}
              onClick={() => setFilterOver(String(ov))}
              className={`px-4 py-2 rounded-[8px] text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0 ${filterOver === String(ov) ? "bg-white/20 text-white" : "bg-white/5 text-gray-500 border border-white/10"}`}
            >
              Over {ov + 1}
            </Button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.keys(groupedByOver)
          .sort((a, b) => b - a)
          .map((over) => (
            <div key={over} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
                  OVER {parseInt(over) + 1}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="space-y-3">
                {groupedByOver[over]
                  .slice()
                  .reverse()
                  .map((ball, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[8px] group hover:bg-white/[0.04] transition-all"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${ballColor(ball)}`}
                      >
                        {ballLabel(ball)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-black uppercase truncate">
                            {ball.batter?.name || "Unknown"}
                          </p>
                          <span className="text-[8px] text-gray-600 uppercase font-black">
                            vs
                          </span>
                          <p className="text-[10px] font-black uppercase truncate text-gray-400">
                            {ball.bowler?.name || "Unknown"}
                          </p>
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                          {ball.isWicket
                            ? `OUT - ${ball.wicketType}`
                            : ball.isExtra
                              ? `${ball.extraType} + ${ball.runs} RUNS`
                              : `${ball.runs} RUNS`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white opacity-40 uppercase tracking-tighter">
                          {ball.over}.{ball.ball}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}

        {filtered.length === 0 && (
          <div className="py-20 text-center bg-white/[0.02] rounded-[8px] border border-dashed border-white/10">
            <Shield size={32} className="mx-auto mb-4 text-gray-800" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              No records match your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BallByBallHistory;
