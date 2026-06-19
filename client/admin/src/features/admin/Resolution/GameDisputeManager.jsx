import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle,
  Search,
  Trophy,
  User,
  Users,
} from "lucide-react";
import useGameDisputes from "@hooks/admin/useGameDisputes";

const GameDisputeManager = () => {
  const { disputedGames, loading, processingId, resolveDispute } =
    useGameDisputes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState(null);

  const [decision, setDecision] = useState("TRANSFER_TO_HOST");
  const [refundInputs, setRefundInputs] = useState({});

  const filteredGames = disputedGames.filter((game) => {
    return (
      game.gameType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.host?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleRefundInputChange = (userId, value) => {
    setRefundInputs((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleConfirmResolve = async () => {
    if (processingId === selectedGame.id) return;

    let refunds = [];
    if (decision === "REFUND_SELECTED") {
      refunds = Object.entries(refundInputs)
        .map(([userId, amount]) => ({
          userId,
          amount: parseFloat(amount) || 0,
        }))
        .filter((r) => r.amount > 0);
    }

    try {
      await resolveDispute(selectedGame.id, decision, refunds);
      setSelectedGame(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      <div className="flex-none p-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert className="text-orange-500" size={32} />
              Game Disputes
            </h1>
            <p className="text-gray-400 mt-2 font-medium tracking-wide">
              Manage and resolve hosted game disputes
            </p>
          </div>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search games or host..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-white/5 border border-white/10 rounded-[8px] pl-12 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-all font-bold"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 pb-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-6 h-full">
            {/* Left Panel: Dispute List */}
            <div
              className={`w-full ${selectedGame ? "hidden lg:block lg:w-1/3 xl:w-1/4" : "max-w-4xl"} h-full overflow-y-auto no-scrollbar space-y-4 pr-2`}
            >
              {filteredGames.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-[8px] border border-white/5">
                  <CheckCircle
                    size={48}
                    className="text-green-500 mx-auto mb-4 opacity-50"
                  />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                    No Active Game Disputes
                  </p>
                </div>
              ) : (
                filteredGames.map((game) => (
                  <button
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game);
                      setDecision("TRANSFER_TO_HOST");
                      setRefundInputs({});
                    }}
                    className={`w-full text-left p-5 rounded-[8px] transition-all duration-300 border ${selectedGame?.id === game.id ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-orange-500" />
                        <span className="font-bold text-white uppercase text-xs tracking-wider">
                          {game.gameType} Match -{" "}
                          {new Date(game.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 border border-orange-500/20">
                        Disputed
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-3">
                      {game.disputes?.[0]?.reason || "No reason provided"}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500 font-bold">
                      <span>Host: {game.host?.name}</span>
                      <span>â‚¹{game.perPlayerCharge} / slot</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Right Panel: Dispute Details */}
            {selectedGame && (
              <div className="flex-1 bg-white/5 rounded-[8px] border border-white/10 flex flex-col h-full overflow-hidden animate-fade-in relative">
                <div className="p-6 md:p-8 border-b border-white/5 flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                        {selectedGame.name}
                      </h2>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider bg-orange-400/10 px-3 py-1 rounded-full">
                          Disputed
                        </span>
                        <span className="text-gray-400 text-sm font-bold">
                          Host: {selectedGame.host?.name}
                        </span>
                        <span className="text-gray-400 text-sm font-bold">
                          â‚¹{selectedGame.perPlayerCharge}/player
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedGame(null)}
                      className="lg:hidden p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <ShieldAlert size={20} className="text-white" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Disputes info */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <ShieldAlert size={16} className="text-orange-500" />{" "}
                        Disputed By
                      </h3>
                      <div className="space-y-3">
                        {selectedGame.disputes?.map((d) => (
                          <div
                            key={d.id}
                            className="p-4 bg-[#0a0a0a] rounded-[8px] border border-white/5"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white">
                                {d.raisedBy?.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(d.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">{d.reason}</p>
                          </div>
                        ))}
                      </div>

                      <h3 className="text-sm font-black text-white uppercase tracking-widest mt-8 flex items-center gap-2">
                        <Users size={16} className="text-orange-500" /> Joined
                        Players
                      </h3>
                      <div className="space-y-3">
                        {selectedGame.slots?.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-4 bg-[#0a0a0a] rounded-[8px] border border-white/5"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <User size={16} className="text-gray-400" />
                                <div>
                                  <p className="text-sm font-bold text-white">
                                    {slot.user?.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {slot.user?.phone}
                                  </p>
                                </div>
                              </div>
                              {decision === "REFUND_SELECTED" && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-400">
                                    Refund:
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={selectedGame.perPlayerCharge}
                                    placeholder="0"
                                    className="w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-white text-right focus:outline-none focus:border-orange-500 font-bold"
                                    value={refundInputs[slot.user?.id] || ""}
                                    onChange={(e) =>
                                      handleRefundInputChange(
                                        slot.user?.id,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Resolution Form */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">
                        Resolution Decision
                      </h3>

                      <div className="space-y-3">
                        <button
                          onClick={() => setDecision("TRANSFER_TO_HOST")}
                          className={`w-full flex items-center justify-between p-4 rounded-[8px] border transition-all ${decision === "TRANSFER_TO_HOST" ? "bg-orange-500/10 border-orange-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                          <span
                            className={`font-bold uppercase tracking-wider text-sm ${decision === "TRANSFER_TO_HOST" ? "text-orange-500" : "text-white"}`}
                          >
                            Transfer All to Host
                          </span>
                          {decision === "TRANSFER_TO_HOST" && (
                            <CheckCircle
                              size={18}
                              className="text-orange-500"
                            />
                          )}
                        </button>

                        <button
                          onClick={() => setDecision("REFUND_SELECTED")}
                          className={`w-full flex items-center justify-between p-4 rounded-[8px] border transition-all ${decision === "REFUND_SELECTED" ? "bg-orange-500/10 border-orange-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                        >
                          <span
                            className={`font-bold uppercase tracking-wider text-sm ${decision === "REFUND_SELECTED" ? "text-orange-500" : "text-white"}`}
                          >
                            Refund Selected Players
                          </span>
                          {decision === "REFUND_SELECTED" && (
                            <CheckCircle
                              size={18}
                              className="text-orange-500"
                            />
                          )}
                        </button>
                      </div>

                      <div className="mt-8 pt-8 border-t border-white/5">
                        <button
                          onClick={handleConfirmResolve}
                          disabled={
                            processingId === selectedGame.id ||
                            (decision === "REFUND_SELECTED" &&
                              Object.keys(refundInputs).length === 0)
                          }
                          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-black rounded-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-30 shadow-[0_10px_20px_rgba(249,115,22,0.2)]"
                        >
                          {processingId === selectedGame.id
                            ? "Processing..."
                            : "Confirm Resolution"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDisputeManager;
