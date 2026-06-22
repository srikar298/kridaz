import React, { useState } from "react";
import { ArrowRight, ArrowLeft, ShieldCheck, CreditCard } from "lucide-react";import { Button, Input } from "@kridaz/ui";


const Step6Officials = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    officials: formData.officials || [], // { role, count, needed }
    details: {
      officialsPayment: formData.details?.officialsPayment || "Organizer",
      requireKridazOfficials: formData.details?.requireKridazOfficials ?? true,
    },
  });

  const [officialsConfig, setOfficialsConfig] = useState({
    Umpire: { needed: false, count: 2 },
    Scorer: { needed: false, count: 1 },
    Commentator: { needed: false, count: 1 },
    Streamer: { needed: false, count: 1 },
  });

  const handleToggle = (role) => {
    setOfficialsConfig((prev) => ({
      ...prev,
      [role]: { ...prev[role], needed: !prev[role].needed },
    }));
  };

  const handleCountChange = (role, delta) => {
    setOfficialsConfig((prev) => ({
      ...prev,
      [role]: { ...prev[role], count: Math.max(1, prev[role].count + delta) },
    }));
  };

  const submit = () => {
    // Transform config to array
    const officialsArray = Object.entries(officialsConfig)
      .filter(([_, config]) => config.needed)
      .map(([role, config]) => ({ role, count: config.count }));

    onNext({
      officials: officialsArray,
      details: localData.details,
    });
  };

  const renderOfficialCard = (role, icon) => {
    const config = officialsConfig[role];
    return (
      <div
        className={`p-4 rounded-xl border transition-all ${config.needed ? "bg-card border-primary" : "bg-background border-white/5 opacity-60"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${config.needed ? "bg-primary text-black" : "bg-card text-white/50"}`}
            >
              {icon}
            </div>
            <p className="font-bold text-white text-sm">{role}</p>
          </div>
          <Button
            onClick={() => handleToggle(role)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold ${config.needed ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {config.needed ? "Remove" : "Require"}
          </Button>
        </div>

        {config.needed && (
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xs text-white/50">
              Number required per match
            </span>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleCountChange(role, -1)}
                className="w-6 h-6 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30"
                disabled={config.count <= 1}
              >
                -
              </Button>
              <span className="text-sm font-black w-4 text-center">
                {config.count}
              </span>
              <Button
                onClick={() => handleCountChange(role, 1)}
                className="w-6 h-6 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10"
              >
                +
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={16} className="text-secondary" />
          Require KRIDAZ Officials
        </h2>

        <label className="flex items-center gap-3 p-4 bg-card rounded-xl border border-white/5 cursor-pointer hover:border-white/20 transition-colors mb-6">
          <div className="relative flex items-center justify-center">
            <Input
              type="checkbox"
              checked={localData.details.requireKridazOfficials}
              onChange={(e) =>
                setLocalData((prev) => ({
                  ...prev,
                  details: {
                    ...prev.details,
                    requireKridazOfficials: e.target.checked,
                  },
                }))
              }
              className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-transparent checked:bg-secondary checked:border-secondary transition-all"
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
          <div>
            <p className="text-sm font-bold text-white">
              Hire KRIDAZ Certified Officials
            </p>
            <p className="text-xs text-white/40">
              Verified professionals with ratings and reviews
            </p>
          </div>
        </label>

        {localData.details.requireKridazOfficials && (
          <div className="grid gap-3">
            {renderOfficialCard("Umpire", <ShieldCheck size={18} />)}
            {renderOfficialCard(
              "Scorer",
              <span className="font-black text-xs">0.0</span>
            )}
            {renderOfficialCard(
              "Commentator",
              <span className="font-black text-xs">🎙️</span>
            )}
            {renderOfficialCard(
              "Streamer",
              <span className="font-black text-xs">🎥</span>
            )}
          </div>
        )}
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <CreditCard size={16} className="text-primary" />
          Match Fees
        </h2>

        <div className="space-y-3">
          <p className="text-xs text-white/50">Who pays the officials?</p>
          <div className="flex gap-3">
            <Button
              onClick={() =>
                setLocalData((prev) => ({
                  ...prev,
                  details: { ...prev.details, officialsPayment: "Organizer" },
                }))
              }
              className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                localData.details.officialsPayment === "Organizer"
                  ? "bg-primary border-primary text-black font-black"
                  : "bg-card border-white/10 text-white/70 hover:border-white/30 font-bold"
              }`}
            >
              Organizer Pays
            </Button>
            <Button
              onClick={() =>
                setLocalData((prev) => ({
                  ...prev,
                  details: { ...prev.details, officialsPayment: "Teams" },
                }))
              }
              className={`flex-1 p-4 rounded-xl border text-center transition-all ${
                localData.details.officialsPayment === "Teams"
                  ? "bg-primary border-primary text-black font-black"
                  : "bg-card border-white/10 text-white/70 hover:border-white/30 font-bold"
              }`}
            >
              Teams Split
            </Button>
          </div>
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

export default Step6Officials;
