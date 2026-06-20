import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, X, Loader2, MapPin } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";import { Button, Input } from "@kridaz/ui";


const HireOfficialModal = ({ isOpen, onClose, gameId, role, onInviteSent }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.length >= 3) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/search-officials?query=${query}`,
        { withCredentials: true }
      );
      setResults(res.data.officials || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (officialId) => {
    setInvitingId(officialId);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hosted-game/invite-official`,
        {
          gameId,
          officialId,
          type: role.toUpperCase(),
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(`Invitation sent to ${role}!`);
        onInviteSent();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[8px] overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black italic tracking-tighter uppercase">
                  Hire {role}
                </h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest text-wrap">
                  Search by name, username, phone or email
                </p>
              </div>
              <Button
                onClick={onClose}
                className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <Input
                  type="text"
                  placeholder="Type 3+ characters to search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-[8px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-yellow-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {loading ? (
                  <div className="py-10 text-center">
                    <Loader2
                      className="mx-auto mb-2 animate-spin text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary"
                      size={24}
                    />
                    <p className="text-xs text-neutral-500 uppercase font-black">
                      Searching officials...
                    </p>
                  </div>
                ) : results.length > 0 ? (
                  results.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 bg-neutral-800/40 border border-neutral-800 rounded-[8px] hover:border-neutral-700 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt=""
                            className="w-10 h-10 rounded-full border border-neutral-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-neutral-700">
                            <User size={20} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight text-white">
                            {user.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-bold uppercase">
                            <MapPin size={10} /> {user.location}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleInvite(user._id)}
                        disabled={invitingId === user._id}
                        className="px-4 py-2 bg-yellow-500 text-black text-[10px] font-black rounded-[8px] uppercase hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                      >
                        {invitingId === user._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    </div>
                  ))
                ) : query.length >= 3 ? (
                  <div className="py-10 text-center opacity-50">
                    <Search
                      className="mx-auto mb-2 text-neutral-600"
                      size={24}
                    />
                    <p className="text-xs text-neutral-500 uppercase font-black">
                      No officials found
                    </p>
                  </div>
                ) : (
                  <div className="py-10 text-center opacity-30">
                    <User className="mx-auto mb-2 text-neutral-600" size={24} />
                    <p className="text-xs text-neutral-500 uppercase font-black italic">
                      Search to find officials
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-900/80 border-t border-neutral-800 flex justify-end">
              <Button
                onClick={onClose}
                className="px-6 py-2 text-xs font-black text-neutral-400 uppercase hover:text-white transition-colors"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HireOfficialModal;
