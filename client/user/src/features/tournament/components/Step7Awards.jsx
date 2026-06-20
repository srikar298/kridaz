import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Trophy, Medal, Star } from "lucide-react";import { Button, Input } from "@kridaz/ui";


const Step7Awards = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    prizePool: formData.prizePool || "",
    details: {
      winnerPrize: formData.details?.winnerPrize || "",
      runnerUpPrize: formData.details?.runnerUpPrize || "",
      individualAwards: formData.details?.individualAwards || {
        manOfTheSeries: true,
        bestBowler: true,
        bestBatsman: true,
      },
    },
  });

  const handleNumChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value ? Number(value) : "" }));
  };

  const handleDetailsNumChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      details: { ...prev.details, [name]: value ? Number(value) : "" },
    }));
  };

  const toggleAward = (award) => {
    setLocalData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        individualAwards: {
          ...prev.details.individualAwards,
          [award]: !prev.details.individualAwards[award],
        },
      },
    }));
  };

  const submit = () => {
    onNext(localData);
  };

  const renderAwardCheckbox = (key, label, icon) => (
    <label className="flex items-center gap-3 p-4 bg-card rounded-xl border border-white/5 cursor-pointer hover:border-[#FFD700]/50 transition-colors">
      <div className="relative flex items-center justify-center">
        <Input
          type="checkbox"
          checked={localData.details.individualAwards[key]}
          onChange={() => toggleAward(key)}
          className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-transparent checked:bg-[#FFD700] checked:border-[#FFD700] transition-all"
        />
        <div className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
          <svg
            width="12"
            height="10"
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 9.4L0 5.4L1.4 4L4 6.6L10.6 0L12 1.4L4 9.4Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-bold text-white">{label}</p>
      </div>
    </label>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={16} className="text-[#FFD700]" />
          Cash Prizes
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-2">
              Total Prize Pool (â‚¹)
            </label>
            <Input
              type="number"
              name="prizePool"
              value={localData.prizePool}
              onChange={handleNumChange}
              placeholder="e.g. 100000"
              className="w-full bg-card border border-[#FFD700]/30 rounded-xl px-4 py-4 text-lg font-black text-[#FFD700] focus:outline-none focus:border-[#FFD700] transition-colors text-center"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-2">
                Winner Prize
              </label>
              <Input
                type="number"
                name="winnerPrize"
                value={localData.details.winnerPrize}
                onChange={handleDetailsNumChange}
                placeholder="â‚¹"
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-2">
                Runner Up Prize
              </label>
              <Input
                type="number"
                name="runnerUpPrize"
                value={localData.details.runnerUpPrize}
                onChange={handleDetailsNumChange}
                placeholder="â‚¹"
                className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-[#FFD700] transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Medal size={16} className="text-primary" />
          Individual Awards
        </h2>

        <div className="grid gap-3">
          {renderAwardCheckbox(
            "manOfTheSeries",
            "Player of the Tournament",
            <Star size={16} className="text-primary" />
          )}
          {renderAwardCheckbox(
            "bestBowler",
            "Best Bowler",
            <Trophy size={16} className="text-secondary" />
          )}
          {renderAwardCheckbox(
            "bestBatsman",
            "Best Batsman",
            <Trophy size={16} className="text-[#FFD700]" />
          )}
        </div>
      </section>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </Button>

          <Button
            onClick={submit}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step7Awards;
