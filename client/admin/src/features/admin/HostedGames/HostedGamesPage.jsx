import React, { useState, useEffect } from "react";
import {
  Trophy,
  Search,
  Filter,
  Trash2,
  Eye,
  MapPin,
  User,
  Activity,
  RefreshCw,
  X,
  Ban,
  CheckCircle,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import HostedGamesSkeleton from "./HostedGamesSkeleton";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "@components/shared/ConfirmationModal";import { Button, Input, Select } from "@kridaz/ui";


const HostedGamesPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "",
    target: null,
  });
  const navigate = useNavigate();

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/games/list");
      if (response.data.success) {
        setGames(response.data.games);
      }
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredGames.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGames.map((g) => g._id));
    }
  };

  const openDeleteModal = (game) => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_SINGLE",
      target: game,
      title: "Delete Hosted Game",
      message: `Are you sure you want to PERMANENTLY delete this ${game.gameType} match? This action is irreversible.`,
      confirmText: "Delete Match",
    });
  };

  const openBatchDeleteModal = () => {
    setModalConfig({
      isOpen: true,
      type: "DELETE_BATCH",
      target: selectedIds,
      title: "Batch Delete Games",
      message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected matches? This action cannot be undone.`,
      confirmText: `Delete ${selectedIds.length} Matches`,
    });
  };

  const handleConfirmAction = async () => {
    const { type, target } = modalConfig;

    try {
      if (type === "DELETE_SINGLE") {
        const response = await axiosInstance.delete(
          `/api/admin/games/${target._id}`
        );
        if (response.data.success) {
          setGames(games.filter((g) => g._id !== target._id));
        }
      } else if (type === "DELETE_BATCH") {
        const response = await axiosInstance.post(
          "/api/admin/games/batch-delete",
          { gameIds: target }
        );
        if (response.data.success) {
          setGames(games.filter((g) => !target.includes(g._id)));
          setSelectedIds([]);
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }

    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleBatchStatusUpdate = async (status) => {
    try {
      const response = await axiosInstance.put(
        "/api/admin/games/batch-status",
        { gameIds: selectedIds, status }
      );
      if (response.data.success) {
        setGames(
          games.map((g) => (selectedIds.includes(g._id) ? { ...g, status } : g))
        );
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Batch status update failed:", error);
    }
  };

  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.gameType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.host?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.ground?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "ALL" || game.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background text-white p-6 lg:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-4">
              <Trophy className="text-primary" size={36} />
              Hosted Games <span className="text-primary">Management</span>
            </h1>
            <p className="text-gray-500 mt-2 font-medium tracking-wide uppercase text-xs">
              Monitor, moderate and manage all community-organized match records
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={fetchGames}
              className="p-3 bg-white/5 border border-white/10 rounded-[8px] text-white/60 hover:text-primary hover:border-primary/40 transition-all"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </Button>
            <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-[8px] font-black text-sm uppercase tracking-tighter">
              {games.length} Total Games
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="sticky top-6 z-[40] bg-background border border-primary/30 rounded-[8px] p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-6 pl-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-black font-black text-xs">
                  {selectedIds.length}
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-primary">
                  Selected
                </span>
              </div>
              <Button
                onClick={() => setSelectedIds([])}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleBatchStatusUpdate("CANCELLED")}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Ban size={14} /> Cancel
              </Button>
              <Button
                onClick={() => handleBatchStatusUpdate("ACTIVE")}
                className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-[8px] text-green-400 font-black text-[10px] uppercase tracking-widest hover:bg-green-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle size={14} /> Reactivate
              </Button>
              <div className="w-px h-6 bg-white/10 mx-2" />
              <Button
                onClick={openBatchDeleteModal}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        {!selectedIds.length && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search by game type, host name or ground..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-6 text-white focus:outline-none focus:border-primary/40 transition-all font-medium"
              />
            </div>
            <div className="md:col-span-4 flex gap-2">
              <div className="relative flex-1">
                <Filter
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                  size={18}
                />
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-6 text-white appearance-none focus:outline-none focus:border-primary/40 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Games List */}
        {loading ? (
          <HostedGamesSkeleton />
        ) : filteredGames.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[8px] p-20 text-center">
            <Activity size={64} className="mx-auto text-white/10 mb-6" />
            <h3 className="text-xl font-bold text-white uppercase">
              No Games Found
            </h3>
            <p className="text-gray-500 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-background border border-white/5 rounded-[8px] text-[10px] font-black text-gray-500 uppercase tracking-widest items-center">
              <div className="col-span-1 flex justify-center">
                <Input
                  type="checkbox"
                  checked={
                    filteredGames.length > 0 &&
                    selectedIds.length === filteredGames.length
                  }
                  onChange={handleSelectAll}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                />
              </div>
              <div className="col-span-3">Game Type / ID</div>
              <div className="col-span-2">Host</div>
              <div className="col-span-3">Ground / Location</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filteredGames.map((game) => (
              <div
                key={game._id}
                onClick={() => handleSelect(game._id)}
                className={`group relative bg-background border transition-all duration-500 rounded-[8px] p-6 overflow-hidden cursor-pointer ${selectedIds.includes(game._id) ? "border-primary bg-primary/5" : "border-white/5 hover:border-primary/40"}`}
              >
                <div
                  className={`absolute inset-y-0 left-0 w-1 bg-primary transition-transform duration-500 ${selectedIds.includes(game._id) ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                  {/* Selection Checkbox */}
                  <div className="lg:col-span-1 flex items-center justify-center">
                    <Input
                      type="checkbox"
                      checked={selectedIds.includes(game._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelect(game._id);
                      }}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                    />
                  </div>

                  {/* Match Info */}
                  <div className="lg:col-span-3 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[8px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <Activity size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                        {game.gameType}
                      </h3>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">
                        ID: {game._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Host Info */}
                  <div className="lg:col-span-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 overflow-hidden border border-white/10">
                      {game.host?.profilePicture ? (
                        <img
                          src={game.host.profilePicture}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={14} />
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-white truncate">
                      {game.host?.name || "System"}
                    </p>
                  </div>

                  {/* Ground/Location */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 border border-white/5">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">
                        {game.ground?.name || "Private Venue"}
                      </p>
                      <p className="text-[10px] text-white/40 truncate font-medium">
                        {game.ground?.location ||
                          game.city ||
                          "Unknown Location"}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="lg:col-span-1">
                    <div
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] border text-[9px] font-black uppercase tracking-widest ${game.status === "ACTIVE" ? "bg-green-500/10 border-green-500/20 text-green-400" : game.status === "PENDING" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" : game.status === "CANCELLED" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`}
                    >
                      <div
                        className={`w-1 h-1 rounded-full ${game.status === "ACTIVE" ? "bg-green-400 shadow-[0_0_8px_#4ade80]" : game.status === "PENDING" ? "bg-yellow-400" : game.status === "CANCELLED" ? "bg-red-400" : "bg-amber-400"}`}
                      />
                      {game.status}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex justify-end gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/match/${game._id}`);
                      }}
                      className="p-2 rounded-[8px] bg-white/5 border border-white/10 text-white/40 hover:bg-primary hover:text-black hover:border-primary transition-all"
                    >
                      <Eye size={18} />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(game);
                      }}
                      className="p-2 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type="danger"
      />
    </div>
  );
};

export default HostedGamesPage;
