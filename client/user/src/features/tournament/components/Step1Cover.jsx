import React, { useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Paintbrush,
  ArrowRight,
  Upload,
} from "lucide-react";
import { Button, Input, Textarea } from "@kridaz/ui";


const Step1Cover = ({ formData, onNext, onBack, isLoading, tournamentId }) => {
  const [localData, setLocalData] = useState({
    name: formData.name || "",
    logoUrl: formData.logoUrl || "",
    posterUrl: formData.posterUrl || "",
    logoFile: null,
    posterFile: null,
    logoPreview: formData.logoUrl || "",
    posterPreview: formData.posterUrl || "",
    details: {
      about: formData.details?.about || "",
      awards: Array.isArray(formData.details?.awards) ? formData.details.awards : (formData.details?.awards ? [formData.details.awards] : []),
      facilities: Array.isArray(formData.details?.facilities) ? formData.details.facilities : (formData.details?.facilities ? [formData.details.facilities] : []),
      refreshments: Array.isArray(formData.details?.refreshments) ? formData.details.refreshments : (formData.details?.refreshments ? [formData.details.refreshments] : []),
    },
  });



  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      details: { ...prev.details, [name]: value },
    }));
  };

  const toggleArrayItem = (field, item) => {
    setLocalData((prev) => {
      const currentArray = prev.details[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return {
        ...prev,
        details: { ...prev.details, [field]: newArray },
      };
    });
  };

  const AWARDS_OPTIONS = [
    "Man of the Match", "Best Bowler", "Best Batsman", "Player of the Tournament", 
    "Best Fielder", "Best Wicket Keeper", "Man of the Series", "Most Sixes", "Most Wickets"
  ];

  const FACILITIES_OPTIONS = [
    "Parking", "Washrooms", "Pavilion", "Drinking Water", 
    "Floodlights", "Seating Area", "First Aid", "Canteen"
  ];

  const REFRESHMENTS_OPTIONS = [
    "Energy Drinks", "Lunch Provided", "Snacks", "Tea/Coffee", "Dinner", "Breakfast"
  ];

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLocalData((prev) => ({
      ...prev,
      posterFile: file,
      posterPreview: URL.createObjectURL(file),
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLocalData((prev) => ({
      ...prev,
      logoFile: file,
      logoPreview: URL.createObjectURL(file),
    }));
  };

  const submit = () => {
    onNext(localData);
  };

  const isFormValid = localData.name.length >= 3;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Media Upload Section */}
      <section>
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest mb-4">
          Tournament Media
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo Upload */}
          <div className="w-full md:w-1/3 aspect-square bg-card rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group hover:border-secondary/50 transition-colors">
            {localData.logoPreview ? (
              <img
                src={localData.logoPreview}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="text-secondary" size={20} />
                </div>
                <p className="text-xs font-bold text-white mb-1">
                  Upload Logo
                </p>
                <p className="text-[10px] text-white/40">1:1 ratio</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              onChange={handleLogoUpload}
              title="Upload Logo"
            />
          </div>

          {/* Poster Upload */}
          <div className="relative w-full md:w-2/3 aspect-video md:aspect-[21/9] bg-card rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors">
            {localData.posterPreview ? (
              <img
                src={localData.posterPreview}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-primary" size={24} />
                </div>
                <p className="text-sm font-bold text-white mb-1">
                  Upload Tournament Poster
                </p>
                <p className="text-xs text-white/40 mb-6">
                  16:9 ratio recommended
                </p>

                <div className="flex flex-wrap justify-center gap-3">
                  <Button type="button" className="flex items-center gap-2 px-4 py-2 bg-card rounded-full text-xs font-bold hover:bg-white/10 transition-colors pointer-events-none">
                    <ImageIcon size={14} /> Gallery
                  </Button>
                  <Button type="button" className="flex items-center gap-2 px-4 py-2 bg-card rounded-full text-xs font-bold hover:bg-white/10 transition-colors pointer-events-none">
                    <Camera size={14} /> Camera
                  </Button>
                  <Button type="button" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary/20 to-primary/20 border border-primary/30 text-primary rounded-full text-xs font-bold hover:opacity-80 transition-opacity pointer-events-none">
                    <Paintbrush size={14} /> Design in KRIDAZ
                  </Button>
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handlePosterUpload}
              title="Upload Poster"
            />
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-4 bg-secondary rounded-full" />
          Tournament Name
        </h2>
        <div>
          <Input
            type="text"
            name="name"
            value={localData.name}
            onChange={handleTextChange}
            placeholder="e.g. RPL Season 3, Hyderabad Corporate League..."
            className="w-full bg-card border border-white/5 rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-secondary transition-colors"
          />
        </div>
      </section>

      {/* Description */}
      <section className="space-y-4">
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-4 bg-primary rounded-full" />
          Tournament Description
        </h2>

        <div className="space-y-3">
          <Textarea
            name="about"
            value={localData.details.about}
            onChange={handleDetailsChange}
            placeholder="About Tournament (History, rules, vibe)"
            className="w-full bg-card border border-white/5 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-primary transition-colors min-h-[100px]"
          />

          <div className="space-y-2 mt-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Awards</label>
            <div className="flex flex-wrap gap-2">
              {AWARDS_OPTIONS.map((opt) => {
                const isSelected = localData.details.awards.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleArrayItem("awards", opt)}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-primary text-black border-primary"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Facilities</label>
            <div className="flex flex-wrap gap-2">
              {FACILITIES_OPTIONS.map((opt) => {
                const isSelected = localData.details.facilities.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleArrayItem("facilities", opt)}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-primary text-black border-primary"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Refreshments</label>
            <div className="flex flex-wrap gap-2">
              {REFRESHMENTS_OPTIONS.map((opt) => {
                const isSelected = localData.details.refreshments.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleArrayItem("refreshments", opt)}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-primary text-black border-primary"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Organizer Profile (Read Only for now, derived from user) */}
      {/* 
      <section className="space-y-4">
        ... Organizer Profile section UI
      </section>
      */}

      {/* Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-12 pb-6 px-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!isFormValid || isLoading}
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

export default Step1Cover;
