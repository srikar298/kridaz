import React, { useState } from "react";
import { Button, Input } from "@kridaz/ui";
import { ArrowRight, ArrowLeft, Calendar, Clock, Minus, Plus } from "lucide-react";

const MATCH_TIMINGS = ["Day", "Night", "Day & Night"];
const MATCHES_ON = ["Weekdays", "Weekends", "All Days"];

const Step4Dates = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    startDate: formData.startDate
      ? new Date(formData.startDate).toISOString().split("T")[0]
      : "",
    endDate: formData.endDate
      ? new Date(formData.endDate).toISOString().split("T")[0]
      : "",
    details: {
      ...formData.details,
      matchTiming: formData.details?.matchTiming || "Day",
      matchesOn: formData.details?.matchesOn || "Weekends",
      durationDays: formData.details?.durationDays || 2,
      matchesPerDay: formData.details?.matchesPerDay || 4,
    },
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const updateDetails = (field, value) => {
    setLocalData((prev) => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }));
  };

  const submit = () => {
    onNext({
      startDate: localData.startDate
        ? new Date(localData.startDate).toISOString()
        : null,
      endDate: localData.endDate
        ? new Date(localData.endDate).toISOString()
        : null,
      details: localData.details,
    });
  };

  const isValid = localData.startDate;

  const renderDateInput = (label, name, value, required = false) => (
    <div className="bg-card border border-white/5 p-4 rounded-xl flex items-center justify-between group focus-within:border-primary transition-colors">
      <div className="flex flex-col">
        <span className="text-xs text-white/50 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        <Input
          type="date"
          name={name}
          value={value}
          onChange={handleDateChange}
          className="bg-transparent text-white font-bold text-sm focus:outline-none [color-scheme:dark]"
        />
      </div>
      <Calendar
        size={18}
        className="text-white/20 group-focus-within:text-primary transition-colors"
      />
    </div>
  );

  const renderSelectChips = (options, currentVal, field) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          onClick={() => updateDetails(field, opt)}
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
            updateDetails(field, Math.max(min, localData.details[field] - 1))
          }
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData.details[field] <= min}
        >
          <Minus size={14} />
        </Button>
        <span className="text-lg font-black w-8 text-center text-primary">
          {localData.details[field]}
        </span>
        <Button
          onClick={() =>
            updateDetails(field, Math.min(max, localData.details[field] + 1))
          }
          className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          disabled={localData.details[field] >= max}
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
          <Calendar size={16} className="text-secondary" />
          Tournament Dates
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {renderDateInput(
            "Start Date",
            "startDate",
            localData.startDate,
            true
          )}
          {renderDateInput("End Date", "endDate", localData.endDate)}
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <Clock size={16} className="text-[#FFD700]" />
          Match Timings
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white/50 mb-2">Matches On</h3>
            {renderSelectChips(MATCHES_ON, localData.details.matchesOn, "matchesOn")}
          </div>

          <div>
            <h3 className="text-xs font-bold text-white/50 mb-2">Timing</h3>
            {renderSelectChips(MATCH_TIMINGS, localData.details.matchTiming, "matchTiming")}
          </div>

          <div className="space-y-3 pt-4">
            {renderStepper("Tournament Duration (Days)", "durationDays", 1, 60)}
            {renderStepper("Matches per day", "matchesPerDay", 1, 10)}
          </div>
        </div>
      </section>

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
            disabled={!isValid || isLoading}
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

export default Step4Dates;
