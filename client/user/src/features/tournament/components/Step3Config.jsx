import React, { useState } from "react";
import { Button } from "@kridaz/ui";

import {
  ArrowRight,
  ArrowLeft,
  Trophy,
  Flag,
  Shield,
  Activity,
  Minus,
  Plus,
  Users
} from "lucide-react";

const SPORTS = [
  "Cricket",
  "Football",
  "Badminton",
  "Kabaddi",
  "Volleyball",
  "Tennis",
  "Others",
];
const TYPES = [
  "Round Robin",
  "Knockout",
  "League + Knockout",
  "Pool Based",
  "Direct Final",
  "Champions League Style",
];
const FORMATS = {
  Cricket: ["T10", "T15", "T20", "T30", "ODI", "Test"],
  Football: ["5A", "7A", "11A"],
  Others: ["Standard"],
};
const BALL_TYPES = [
  "Leather",
  "Tennis",
  "Soft Tennis",
  "Tape Ball",
  "Plastic",
  "Box Cricket",
];
const CATEGORIES = [
  "Open",
  "Corporate",
  "Community",
  "School",
  "College/University",
  "Series",
  "Others",
];
const PITCH_TYPES = ["Rough", "Semi Turf", "Astroturf", "Matting"];
const MATCH_TYPES = [
  "Limited Overs",
  "Box Turf Cricket",
  "Pair Cricket",
  "Test Match",
  "The 100",
];

const Step3Config = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    sport: formData.sport || "Cricket",
    category: formData.category || "Open",
    type: formData.type || "Knockout",
    format: formData.format || "T20",
    ballType: formData.ballType || "Tennis",
    pitchType: formData.pitchType || "Turf",
    matchType: formData.matchType || "Limited Overs",
    maxTeams: formData.maxTeams || 8,
    minPlayersPerTeam: formData.details?.minPlayersPerTeam || formData.minPlayersPerTeam || 11,
    maxPlayersPerTeam: formData.details?.maxPlayersPerTeam || formData.maxPlayersPerTeam || 15,
    numberOfWinners: formData.numberOfWinners || 1,
  });

  const updateField = (field, value) => {
    setLocalData((prev) => ({
      ...prev,
      [field]: value,
      // Reset format if sport changes
      ...(field === "sport"
        ? { format: FORMATS[value]?.[0] || FORMATS.Others[0] }
        : {}),
    }));
  };

  const submit = () => {
    onNext({
      ...localData,
      details: {
        ...formData.details,
        minPlayersPerTeam: localData.minPlayersPerTeam,
        maxPlayersPerTeam: localData.maxPlayersPerTeam,
      },
    });
  };

  const renderSelectChips = (options, currentVal, field) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          onClick={() => updateField(field, opt)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
            currentVal === opt
              ? "bg-primary text-black border-primary"
              : "bg-card text-white/70 border-white/10 hover:border-white/30"
          }`}
        >
          {opt}
        </Button>
      ))}
    </div>
  );

  const renderStepper = (label, field, min, max) => (
    <div className="flex items-center justify-between bg-card border border-white/5 p-4 rounded-2xl">
      <span className="text-sm font-bold text-white/90">{label}</span>
      <div className="flex items-center gap-4">
        <Button
          onClick={() =>
            updateField(field, Math.max(min, localData[field] - 1))
          }
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData[field] <= min}
        >
          <Minus size={14} />
        </Button>
        <span className="text-lg font-black w-8 text-center text-primary">
          {localData[field]}
        </span>
        <Button
          onClick={() =>
            updateField(field, Math.min(max, localData[field] + 1))
          }
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData[field] >= max}
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-secondary" />
          Sport
        </h2>
        {renderSelectChips(SPORTS, localData.sport, "sport")}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Users size={16} className="text-primary" />
          Category
        </h2>
        {renderSelectChips(CATEGORIES, localData.category, "category")}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Trophy size={16} className="text-primary" />
          Tournament Type
        </h2>
        {renderSelectChips(TYPES, localData.type, "type")}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Flag size={16} className="text-secondary" />
          Match Format
        </h2>
        {renderSelectChips(
          FORMATS[localData.sport] || FORMATS.Others,
          localData.format,
          "format"
        )}
      </section>

      {localData.sport === "Cricket" && (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-[#FFD700]" />
              Ball Type
            </h2>
            {renderSelectChips(BALL_TYPES, localData.ballType, "ballType")}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-[#FFD700]" />
              Pitch Type
            </h2>
            {renderSelectChips(PITCH_TYPES, localData.pitchType, "pitchType")}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
              <Flag size={16} className="text-[#FFD700]" />
              Match Type
            </h2>
            {renderSelectChips(MATCH_TYPES, localData.matchType, "matchType")}
          </section>
        </>
      )}

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest">
          Match Settings
        </h2>
        <div className="space-y-3">
          {renderStepper("Number of Teams", "maxTeams", 2, 128)}
          {renderStepper("Number of Winners", "numberOfWinners", 1, 8)}
          {renderStepper(
            "Minimum Players per Team",
            "minPlayersPerTeam",
            1,
            20
          )}
          {renderStepper(
            "Maximum Players per Team",
            "maxPlayersPerTeam",
            localData.minPlayersPerTeam,
            30
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
           aria-label="Next">
            {isLoading ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3Config;
