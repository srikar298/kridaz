import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";import { Button } from "@kridaz/ui";


const TeamMembersModal = ({ isOpen, onClose, team }) => {
  const navigate = useNavigate();

  if (!team) return null;

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-background border border-white/10 rounded-[8px] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[8px] bg-card border border-white/10 flex items-center justify-center overflow-hidden">
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="text-primary" size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{team.name}</h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest">
                    {team.memberCount} Squad Members
                  </p>
                </div>
              </div>
              <Button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {team.members?.map((member, idx) => (
                  <div
                    key={member.user?._id || idx}
                    className="flex items-center justify-between p-3 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => {
                          if (member.user?._id)
                            navigate(`/profile/${member.user._id}`);
                        }}
                        className="w-10 h-10 rounded-full border border-white/10 overflow-hidden cursor-pointer hover:border-primary transition-all"
                      >
                        {member.user?.profilePicture ? (
                          <img
                            src={member.user.profilePicture}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs text-white/40 uppercase">
                            {member.user?.name?.[0] || "P"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                            {member.user?.name}
                          </p>
                          {member.role === "OWNER" && (
                            <Shield size={10} className="text-primary" />
                          )}
                        </div>
                        <p className="text-[10px] text-white/20 font-medium uppercase tracking-wider">
                          @{member.user?.username || "player"}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        if (member.user?._id)
                          navigate(`/profile/${member.user._id}`);
                      }}
                      className="p-2 rounded-[8px] bg-white/5 text-white/40 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black"
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <Button
                onClick={() => navigate(`/team/${team._id}`)}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary hover:brightness-[1.04] text-black font-black text-xs uppercase tracking-[0.2em] rounded-[8px] shadow-lg shadow-[var(--primary)]/10 hover:shadow-[var(--primary)]/15 transition-all hover:scale-[1.02] active:scale-[0.98] duration-300"
              >
                View Full Team Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TeamMembersModal;
