import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Search,
  Plus,
  X,
  Building2,
} from "lucide-react";
// import { useSearchVenuesQuery } from '@redux/api/venueApi'; // If we have one

const Step4Venues = ({ formData, onNext, onBack, isLoading }) => {
  const [localData, setLocalData] = useState({
    venues: formData.venues || [], // Each venue: { id, name, location, isCustom }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customVenue, setCustomVenue] = useState({ name: "", location: "" });

  // Mock search results
  const mockSearchResults = [
    { id: "v1", name: "Hitex Sports Arena", location: "Madhapur, Hyderabad" },
    { id: "v2", name: "Astro Park", location: "Banjara Hills, Hyderabad" },
  ].filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      searchQuery.length > 1
  );

  const addVenue = (venue) => {
    if (
      !localData.venues.find((v) => v.id === venue.id || v.name === venue.name)
    ) {
      setLocalData((prev) => ({
        ...prev,
        venues: [...prev.venues, venue],
      }));
    }
    setSearchQuery("");
  };

  const removeVenue = (idOrName) => {
    setLocalData((prev) => ({
      ...prev,
      venues: prev.venues.filter(
        (v) => v.id !== idOrName && v.name !== idOrName
      ),
    }));
  };

  const handleAddCustom = () => {
    if (customVenue.name.length > 2) {
      addVenue({
        id: `custom-${Date.now()}`,
        name: customVenue.name,
        location: customVenue.location,
        isCustom: true,
      });
      setCustomVenue({ name: "", location: "" });
      setShowCustomForm(false);
    }
  };

  const submit = () => {
    // Backend expects an array of Venue IDs ideally, or we can just save it to metadata
    onNext({ venues: localData.venues });
  };

  const isValid = localData.venues.length > 0;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={16} className="text-[#55DEE8]" />
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
                key={v.id || v.name}
                className="flex items-center justify-between bg-[#111] border border-[#BFF367]/30 p-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                    {v.isCustom ? (
                      <Building2 size={18} className="text-white/50" />
                    ) : (
                      <MapPin size={18} className="text-[#BFF367]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{v.name}</p>
                    <p className="text-[10px] text-white/50">{v.location}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeVenue(v.id || v.name)}
                  className="p-2 text-white/40 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search size={18} className="text-white/40" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search KRIDAZ Venues..."
            className="w-full bg-[#111] border border-white/5 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#55DEE8] transition-colors"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length > 1 && (
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden mt-2">
            {mockSearchResults.length > 0 ? (
              mockSearchResults.map((venue) => (
                <button
                  key={venue.id}
                  onClick={() => addVenue(venue)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{venue.name}</p>
                    <p className="text-[10px] text-white/50">
                      {venue.location}
                    </p>
                  </div>
                  <Plus size={18} className="text-[#BFF367]" />
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-white/50">
                No venues found on Kridaz
              </div>
            )}
          </div>
        )}

        {/* Custom Venue Form */}
        <div className="pt-4">
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              className="text-xs font-bold text-[#55DEE8] flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Add Custom Venue (Not on Kridaz)
            </button>
          ) : (
            <div className="bg-[#111] border border-white/5 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-white/70 uppercase mb-2">
                Custom Venue
              </h3>
              <input
                type="text"
                placeholder="Venue Name"
                value={customVenue.name}
                onChange={(e) =>
                  setCustomVenue((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-sm text-white focus:outline-none focus:border-[#BFF367] transition-colors"
              />
              <input
                type="text"
                placeholder="Location / Address"
                value={customVenue.location}
                onChange={(e) =>
                  setCustomVenue((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-sm text-white focus:outline-none focus:border-[#BFF367] transition-colors"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCustomForm(false)}
                  className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustom}
                  disabled={customVenue.name.length < 3}
                  className="px-4 py-2 text-xs font-bold bg-[#1a1a1a] text-white rounded-full hover:bg-white/10 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#000] via-[#000]/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/70 hover:text-white px-4 py-2 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            onClick={submit}
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 bg-[#BFF367] text-black font-black px-8 py-4 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-widest text-xs"
          >
            {isLoading ? "Saving..." : "Continue"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Venues;
