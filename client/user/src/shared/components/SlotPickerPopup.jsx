import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mail,
  Gift,
  Users,
  X,
  Check,
  Loader2,
  Send,
  ShieldCheck,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import { Button, Input } from "@kridaz/ui";


const SlotPickerPopup = ({ isOpen, onClose, onSelect, gameId, slotId }) => {
  const [activeTab, setActiveTab] = useState("followers"); // 'followers' | 'email' | 'teams'
  const [searchTerm, setSearchTerm] = useState("");
  const [email, setEmail] = useState("");
  const [followers, setFollowers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFollowers();
      fetchTeams();
    }
  }, [isOpen]);

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        "/api/hosted-game/followers-for-slot"
      );
      if (res.data.success) {
        setFollowers(res.data.people || []);
      }
    } catch (err) {
      toast.error("Failed to fetch network");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get("/api/team");
      if (res.data.success) {
        setTeams(res.data.teams || []);
      }
    } catch (err) {
      console.error("Failed to fetch teams");
    }
  };

  const handleInvitePlayer = async (player) => {
    if (!gameId) {
      // Draft Mode (used during creation)
      onSelect(player);
      onClose();
      return;
    }

    setSending(true);
    try {
      const res = await axiosInstance.post("/api/hosted-game/assign-slot", {
        gameId,
        slotId,
        playerId: player._id,
      });
      if (res.data.success) {
        toast.success("Player assigned to slot!");
        onSelect(res.data.player);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign player");
    } finally {
      setSending(false);
    }
  };

  const handleEmailInvite = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (!gameId) {
      // Draft Mode
      onSelect({ email, isCustom: true });
      onClose();
      return;
    }

    setSending(true);
    try {
      const res = await axiosInstance.post(
        "/api/hosted-game/invite-custom-player",
        {
          gameId,
          slotId,
          email,
        }
      );
      if (res.data.success) {
        toast.success("Invitation sent to " + email);
        onSelect({ email, isCustom: true });
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const filteredFollowers = (followers || []).filter(
    (f) =>
      f?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[8px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  Assign Slot
                </h2>
                <p className="text-sm text-neutral-500 font-medium">
                  Choose a player or invite someone new
                </p>
              </div>
              <Button
                onClick={onClose}
                className="p-3 bg-neutral-800 rounded-[8px] text-neutral-400 hover:text-white transition-colors"
               aria-label="Close">
                <X size={20} />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-black/40 mx-8 mt-6 rounded-[8px] border border-white/5">
              <Button
                onClick={() => setActiveTab("followers")}
                className={`flex-1 py-3 rounded-[8px] flex items-center justify-center gap-2 text-[10px] font-black transition-all ${activeTab === "followers" ? "bg-yellow-500 text-black" : "text-neutral-500 hover:text-white"}`}
              >
                <Users size={14} /> Network
              </Button>
              <Button
                onClick={() => setActiveTab("teams")}
                className={`flex-1 py-3 rounded-[8px] flex items-center justify-center gap-2 text-[10px] font-black transition-all ${activeTab === "teams" ? "bg-yellow-500 text-black" : "text-neutral-500 hover:text-white"}`}
              >
                <ShieldCheck size={14} /> My Teams
              </Button>
              <Button
                onClick={() => setActiveTab("email")}
                className={`flex-1 py-3 rounded-[8px] flex items-center justify-center gap-2 text-[10px] font-black transition-all ${activeTab === "email" ? "bg-yellow-500 text-black" : "text-neutral-500 hover:text-white"}`}
              >
                <Mail size={14} /> Email
              </Button>
            </div>

            <div className="p-8 min-h-[400px]">
              {activeTab === "followers" ? (
                <div className="space-y-6">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={18}
                    />
                    <Input
                      type="text"
                      placeholder="Search network..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-[8px] py-4 pl-12 pr-4 text-sm font-medium focus:border-yellow-500/50 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2
                          className="animate-spin text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary"
                          size={32}
                        />
                        <p className="text-sm text-neutral-500 font-black uppercase tracking-widest">
                          Searching Network...
                        </p>
                      </div>
                    ) : filteredFollowers.length > 0 ? (
                      filteredFollowers.map((follower) => (
                        <div
                          key={follower._id}
                          className="group p-4 bg-black/20 border border-white/5 rounded-[8px] flex items-center justify-between hover:border-yellow-500/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 shrink-0 rounded-[8px] bg-neutral-800 overflow-hidden flex items-center justify-center border border-neutral-700/50">
                              {follower.profilePicture ? (
                                <img
                                  src={follower.profilePicture}
                                  alt={follower.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-black text-primary uppercase">
                                  {follower.name
                                    ? follower.name.charAt(0)
                                    : "?"}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-sm">
                                {follower.name}
                              </h4>
                              <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">
                                {follower.city}, {follower.state}
                              </p>
                            </div>
                          </div>
                          <Button
                            disabled={sending}
                            onClick={() => handleInvitePlayer(follower)}
                            className="p-3 bg-yellow-500 text-black rounded-[8px] hover:bg-yellow-400 transition-all disabled:opacity-50"
                          >
                            <Gift size={18} />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <Users className="mx-auto text-neutral-800" size={48} />
                        <p className="text-sm text-neutral-500 font-medium italic">
                          No users found matching "{searchTerm}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "teams" ? (
                <div className="space-y-6">
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {teams.length > 0 ? (
                      teams.map((team) => (
                        <div key={team._id} className="space-y-2">
                          <div className="px-4 py-2 bg-neutral-800/50 rounded-[8px] flex items-center gap-2">
                            <ShieldCheck
                              size={14}
                              className="text-yellow-500"
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                              {team.name} Members
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {team.members?.map((member) => (
                              <div
                                key={member.user?._id || member._id}
                                className="group p-3 bg-black/20 border border-white/5 rounded-[8px] flex items-center justify-between hover:border-yellow-500/30 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-white/5 overflow-hidden">
                                    <img
                                      src={
                                        member.user?.profilePicture ||
                                        `https://api.dicebear.com/7.x/initials/svg?seed=${member.user?.name || member.name}`
                                      }
                                      alt={member.user?.name || member.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-xs">
                                      {member.user?.name || member.name}
                                    </h4>
                                    <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest">
                                      {member.role === "CAPTAIN"
                                        ? "Captain"
                                        : "Player"}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  disabled={sending}
                                  onClick={() =>
                                    handleInvitePlayer(
                                      member.user || {
                                        _id: member._id,
                                        name: member.name,
                                        isCustom: true,
                                      }
                                    )
                                  }
                                  className="p-2 bg-gradient-to-r from-primary/10 to-primary/10 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary rounded-lg hover:bg-gradient-to-r from-primary to-primary hover:text-black transition-all disabled:opacity-50"
                                >
                                  <Check size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 space-y-3">
                        <ShieldCheck
                          className="mx-auto text-neutral-800"
                          size={48}
                        />
                        <p className="text-sm text-neutral-500 font-medium italic">
                          You haven't created any teams yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 py-4">
                  <div className="space-y-4 text-center">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-[8px] flex items-center justify-center mx-auto">
                      <Mail className="text-yellow-500" size={32} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">
                        Gift a Slot
                      </h3>
                      <p className="text-sm text-neutral-500 font-medium px-4">
                        Know someone who isn't on Kridaz yet? Send them a magic
                        invite link. They'll be automatically added to this game
                        when they join.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">
                      Recipient Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                        size={18}
                      />
                      <Input
                        type="email"
                        placeholder="player@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-[8px] py-5 pl-12 pr-4 text-sm font-black focus:border-yellow-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    disabled={sending || !email}
                    onClick={handleEmailInvite}
                    className="w-full py-5 bg-yellow-500 text-black font-black rounded-[8px] hover:bg-yellow-400 transition-all shadow-[0_10px_30px_rgba(234,179,8,0.2)] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Send size={20} />
                    )}
                    SEND MAGIC INVITE
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Tip */}
            <div className="p-6 bg-black/20 border-t border-white/5 text-center">
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em]">
                Players will receive a notification and link to confirm their
                spot
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SlotPickerPopup;
