import React, { useState } from "react";
import { Button } from "@kridaz/ui";
import { ArrowRight, ArrowLeft, MapPin, Plus, X, Building2 } from "lucide-react";
import LocationVenuePicker from "@components/modals/LocationVenuePicker";

const Step5Venues = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    venues: formData.venues || [],
  });

  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleVenueSelect = (venueData) => {
    // venueData comes from LocationVenuePicker
    if (!localData.venues.find((v) => v.displayName === venueData.displayName)) {
      setLocalData((prev) => ({
        ...prev,
        venues: [...prev.venues, venueData],
      }));
    }
  };

  const removeVenue = (displayName) => {
    setLocalData((prev) => ({
      ...prev,
      venues: prev.venues.filter((v) => v.displayName !== displayName),
    }));
  };

  const submit = () => {
    onNext({ venues: localData.venues });
  };

  const isValid = localData.venues.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={16} className="text-secondary" />
            Tournament Venues
          </h2>
          <span className="text-xs text-white/50">
            {localData.venues.length} Added
          </span>
        </div>

        {/* Selected Venues */}
        {localData.venues.length > 0 && (
          <div className="space-y-2 mb-6">
            {localData.venues.map((v) => (
              <div
                key={v.displayName}
                className="flex items-center justify-between bg-card border border-primary/30 p-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                    {v.type === "CUSTOM" ? (
                      <MapPin size={18} className="text-white/50" />
                    ) : (
                      <Building2 size={18} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white line-clamp-1">{v.displayName}</p>
                    <p className="text-[10px] text-white/50 line-clamp-1">
                      {v.address || `${v.city || ''} ${v.state || ''}`.trim()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => removeVenue(v.displayName)}
                  className="p-2 text-white/40 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => setIsPickerOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-card border border-white/10 hover:border-primary/50 text-white p-4 rounded-xl transition-all"
        >
          <Plus size={18} className="text-primary" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Add Ground
          </span>
        </Button>
      </section>

      <LocationVenuePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleVenueSelect}
      />

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

export default Step5Venues;
