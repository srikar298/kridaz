import React, { useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Paintbrush,
  ArrowRight,
  Upload,
} from "lucide-react";
import { useUploadTournamentPosterMutation } from "../../../redux/api/tournamentApi";
import { Button, Input, Textarea } from "@kridaz/ui";


const Step1Cover = ({ formData, onNext, isLoading, tournamentId }) => {
  const [localData, setLocalData] = useState({
    name: formData.name || "",
    posterUrl: formData.posterUrl || "",
    details: {
      about: formData.details?.about || "",
      awards: formData.details?.awards || "",
      facilities: formData.details?.facilities || "",
      refreshments: formData.details?.refreshments || "",
    },
  });

  const [uploadPoster, { isLoading: isUploading }] =
    useUploadTournamentPosterMutation();

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

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !tournamentId) return; // Need draft created first to attach file
    // Ideally, we might just keep the file in local state and upload on next if tournamentId doesn't exist yet
    // For simplicity, we'll assume the poster is uploaded after the draft is created in Step 2, or we handle it here if it's already a draft.
  };

  const submit = () => {
    onNext(localData);
  };

  const isFormValid = localData.name.length >= 3;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Poster Upload Section */}
      <section>
        <h2 className="text-sm font-black text-white/90 uppercase tracking-widest mb-4">
          Tournament Cover
        </h2>

        <div className="relative w-full aspect-video md:aspect-[21/9] bg-card rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden group hover:border-primary/50 transition-colors">
          {localData.posterUrl ? (
            <img
              src={localData.posterUrl}
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
                <Button className="flex items-center gap-2 px-4 py-2 bg-card rounded-full text-xs font-bold hover:bg-white/10 transition-colors">
                  <ImageIcon size={14} /> Gallery
                </Button>
                <Button className="flex items-center gap-2 px-4 py-2 bg-card rounded-full text-xs font-bold hover:bg-white/10 transition-colors">
                  <Camera size={14} /> Camera
                </Button>
                <Button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary/20 to-primary/20 border border-primary/30 text-primary rounded-full text-xs font-bold hover:opacity-80 transition-opacity">
                  <Paintbrush size={14} /> Design in KRIDAZ
                </Button>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <Input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handlePosterUpload}
            disabled={!tournamentId} // Just as an example, needs better UX if not draft yet
            title={
              !tournamentId ? "Name your tournament first to upload poster" : ""
            }
          />
        </div>
        {!tournamentId && (
          <p className="text-[10px] text-white/40 mt-2 text-center">
            Save tournament name first to upload a poster
          </p>
        )}
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
          <Input
            type="text"
            name="awards"
            value={localData.details.awards}
            onChange={handleDetailsChange}
            placeholder="Awards (e.g. Man of the Match, Best Bowler)"
            className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <Input
            type="text"
            name="facilities"
            value={localData.details.facilities}
            onChange={handleDetailsChange}
            placeholder="Facilities (e.g. Parking, Washrooms, Pavilion)"
            className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
          <Input
            type="text"
            name="refreshments"
            value={localData.details.refreshments}
            onChange={handleDetailsChange}
            placeholder="Refreshments (e.g. Energy drinks, Lunch provided)"
            className="w-full bg-card border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          />
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
        <div className="max-w-4xl mx-auto flex justify-end">
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
