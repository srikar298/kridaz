import { useState } from "react";
import { X, Trophy, Check, Loader2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const SPORTS = [
  "Cricket",
  "Football",
  "Badminton",
  "Tennis",
  "Basketball",
  "Table Tennis",
  "Volleyball",
  "Hockey",
  "Swimming",
  "Pickleball",
];

const InterestsModal = ({ isOpen, onClose, onSaved }) => {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSport = (sport) => {
    setSelected((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      toast.error("Please select at least one sport");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/api/user/auth/update-interests",
        { sportTypes: selected }
      );
      if (response.data.success) {
        toast.success("Preferences saved!");
        onSaved && onSaved(selected);
        onClose();
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#000000] border border-[#2D2D2D] w-full max-w-lg rounded-[8px] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                Your Arena
              </h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                Select the sports you live for
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#000000] rounded-full transition-colors text-white/40"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SPORTS.map((sport) => {
              const isSelected = selected.includes(sport);
              return (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`flex items-center justify-between p-4 rounded-[8px] border transition-all duration-300 ${isSelected ? "bg-[#BFF367] border-[#BFF367] text-black scale-[1.02]" : "bg-[#000000] border-[#2D2D2D] text-white/60 hover:border-white/20"}`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">
                    {sport}
                  </span>
                  {isSelected ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current opacity-20" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-white text-black py-4 rounded-[8px] font-black uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Trophy size={16} />
              )}
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestsModal;
