import React, { useState } from "react";
import {
  Coffee,
  Clock,
  Utensils,
  Columns,
  CloudRain,
  MoreHorizontal,
  AlertTriangle,
  Users,
  HelpCircle,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MatchExitModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedHelp, setSelectedHelp] = useState(null);

  if (!isOpen) return null;

  const statuses = [
    { id: "drinks", label: "Drinks", icon: Coffee },
    { id: "timed_out", label: "Timed out", icon: Clock },
    { id: "lunch", label: "Lunch", icon: Utensils },
    { id: "stumps", label: "Stumps", icon: Columns },
    { id: "rain", label: "Rain", icon: CloudRain },
    { id: "other", label: "Other", icon: MoreHorizontal },
  ];

  const helpOptions = [
    { id: "scoring_mistake", label: "Scoring Mistake", icon: AlertTriangle },
    { id: "change_scorer", label: "Change Scorer", icon: Users },
    { id: "facing_problem", label: "Facing Problem", icon: HelpCircle },
    { id: "testing", label: "Testing", icon: CheckSquare },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-sm">
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-[450px] bg-[#000] sm:rounded-[12px] rounded-t-[16px] overflow-hidden flex flex-col font-inter border border-white/5 shadow-2xl relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />

          <div className="p-6 space-y-8 overflow-y-auto max-h-[80vh] pb-8">
            <div>
              <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-4">
                Set Match Status
              </p>
              <div className="grid grid-cols-3 gap-2">
                {statuses.map((status) => {
                  const Icon = status.icon;
                  const isSelected = selectedStatus === status.id;
                  return (
                    <button
                      key={status.id}
                      onClick={() =>
                        setSelectedStatus(isSelected ? null : status.id)
                      }
                      className={`flex flex-col items-center justify-center p-3 py-5 rounded-[8px] border ${isSelected ? "bg-[#222] border-[#00C187]/50 shadow-[0_0_15px_rgba(0,193,135,0.15)]" : "bg-[#222] border-white/10 hover:border-white/20"} transition-all`}
                    >
                      <Icon
                        size={20}
                        className={`mb-2 ${isSelected ? "text-[#00C187]" : "text-neutral-500"}`}
                        strokeWidth={2}
                      />
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider text-center ${isSelected ? "text-[#00C187]" : "text-neutral-400"}`}
                      >
                        {status.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-4">
                Need Help?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {helpOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedHelp === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        setSelectedHelp(isSelected ? null : option.id)
                      }
                      className={`flex flex-col items-center justify-center p-3 py-5 rounded-[8px] border ${isSelected ? "bg-[#222] border-[#00C187]/50 shadow-[0_0_15px_rgba(0,193,135,0.15)]" : "bg-[#222] border-white/10 hover:border-white/20"} transition-all`}
                    >
                      <Icon
                        size={20}
                        className={`mb-2 ${isSelected ? "text-[#00C187]" : "text-neutral-500"}`}
                        strokeWidth={2}
                      />
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider text-center ${isSelected ? "text-[#00C187]" : "text-neutral-400"}`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t border-white/5 bg-[#0a0a0a]">
            <button
              onClick={onClose}
              className="flex-1 py-[14.5px] rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/10"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onConfirm({ status: selectedStatus, help: selectedHelp })
              }
              className="flex-1 py-[14.5px] rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all bg-[#222] text-[#00C187] border border-white/10 hover:bg-[#00C187] hover:text-black hover:border-[#00C187]"
            >
              Ok
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MatchExitModal;
