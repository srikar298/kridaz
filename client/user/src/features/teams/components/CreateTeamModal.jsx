import React, { useState, useRef } from "react";
import { useCreateTeamMutation } from "@redux/api/teamApi";
import { useUploadFileMutation } from "@redux/api/uploadApi";
import {
  X,
  Loader2,
  Users,
  Upload,
  Trash2,
  MapPin,
  Map,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Button, Input, Select } from "@kridaz/ui";


import {
  fetchStates,
  fetchCities,
} from "../../../shared/utils/locationService";

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    sport: "CRICKET",
    state: "",
    city: "",
    image: "",
  });

  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingEmblem, setIsGeneratingEmblem] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  React.useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true);
      const data = await fetchStates();
      setStates(data);
      setLoadingStates(false);
    };
    loadStates();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStateChange = async (e) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      city: "",
    }));

    if (selectedState) {
      setLoadingCities(true);
      const data = await fetchCities(selectedState);
      setCities(data);
      setLoadingCities(false);
    } else {
      setCities([]);
    }
  };

  const uploadFileHelper = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const response = await uploadFile(file).unwrap();
      if (response.success) {
        setFormData((prev) => ({ ...prev, image: response.url }));
        toast.success("Logo uploaded successfully");
      }
    } catch (err) {
      toast.error("Failed to upload logo");
      setPreview(null);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    await uploadFileHelper(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFileHelper(file);
    }
  };

  const handleRemoveLogo = (e) => {
    e.stopPropagation();
    setPreview(null);
    setFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Logo removed");
  };

  const generateEsportsEmblem = async (e) => {
    e.stopPropagation();
    if (!formData.name) {
      toast.error("Please type a Team Name first to generate an emblem");
      return;
    }

    setIsGeneratingEmblem(true);
    const loadingToast = toast.loading("Forging Emblem...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // 1. Cyberpunk backdrop glow
      ctx.fillStyle = "var(--background)";
      ctx.fillRect(0, 0, 512, 512);

      const radialGlow = ctx.createRadialGradient(256, 256, 40, 256, 256, 240);
      radialGlow.addColorStop(0, "rgba(85, 222, 232, 0.18)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 512, 512);

      // 2. Shield Polygon
      ctx.beginPath();
      ctx.moveTo(256, 40);
      ctx.lineTo(440, 120);
      ctx.lineTo(400, 360);
      ctx.lineTo(256, 470);
      ctx.lineTo(112, 360);
      ctx.lineTo(72, 120);
      ctx.closePath();

      ctx.fillStyle = "var(--card)";
      ctx.fill();

      // Carbon texture lines
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      ctx.lineWidth = 3;
      for (let y = 0; y < 512; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Cyber Gradient border
      const gradient = ctx.createLinearGradient(0, 40, 512, 470);
      gradient.addColorStop(0, "var(--primary)");
      gradient.addColorStop(1, "var(--primary)");

      ctx.beginPath();
      ctx.moveTo(256, 40);
      ctx.lineTo(440, 120);
      ctx.lineTo(400, 360);
      ctx.lineTo(256, 470);
      ctx.lineTo(112, 360);
      ctx.lineTo(72, 120);
      ctx.closePath();

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 10;
      ctx.lineJoin = "round";
      ctx.stroke();

      // Target decals
      ctx.strokeStyle = "rgba(85, 222, 232, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(256, 20);
      ctx.lineTo(256, 48);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(40, 256);
      ctx.lineTo(65, 256);
      ctx.moveTo(447, 256);
      ctx.lineTo(472, 256);
      ctx.stroke();

      // 4. Draw Initials
      const words = formData.name.trim().split(/\s+/);
      const initials = words
        .slice(0, 3)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      ctx.shadowColor = "var(--primary)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "var(--foreground)";
      ctx.font = 'italic 900 110px "Space Mono", "Bebas Neue", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initials || "K", 256, 230);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw active sport name banner
      ctx.fillStyle = gradient;
      ctx.font = 'black 22px "Inter", sans-serif';
      ctx.fillText(formData.sport || "TEAM", 256, 310);

      // Draw bottom squads label
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(140, 355, 232, 36);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeRect(140, 355, 232, 36);

      ctx.fillStyle = "var(--foreground)";
      ctx.font = 'bold 12px "Inter", sans-serif';
      const cityLabel = formData.city
        ? formData.city.toUpperCase().slice(0, 16)
        : "SQUAD";
      ctx.fillText(cityLabel, 256, 373);

      // 5. Convert & Upload
      canvas.toBlob(async (blob) => {
        const file = new File(
          [blob],
          `${formData.name.toLowerCase().replace(/\s+/g, "_")}_logo.png`,
          { type: "image/png" }
        );
        await uploadFileHelper(file);
        setIsGeneratingEmblem(false);
        toast.dismiss(loadingToast);
        toast.success("Dynamic Esports Emblem generated successfully!");
      }, "image/png");
    } catch (err) {
      console.error(err);
      setIsGeneratingEmblem(false);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate emblem");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Team name is required");

    try {
      const response = await createTeam({
        ...formData,
        type: "MY_TEAM",
      }).unwrap();
      toast.success("Team created successfully!");
      if (onSuccess) onSuccess(response.team);
      onClose();
      setFormData({
        name: "",
        sport: "CRICKET",
        state: "",
        city: "",
        image: "",
      });
      setPreview(null);
    } catch (err) {
      toast.error(err.data?.message || "Failed to create team");
    }
  };

  const isSubmitDisabled =
    !formData.name || isCreating || isUploading || isGeneratingEmblem;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-lg bg-background/90 border border-white/10 rounded-[8px] overflow-hidden shadow-[0_0_50px_rgba(85,222,232,0.1)] backdrop-blur-2xl z-10 my-4"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3
                  className="text-lg font-bold text-white tracking-tight"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Create Team
                </h3>
                <p
                  className="text-[11px] text-white/40 font-medium tracking-wide mt-0.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Build your squad and compete with others
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-9 h-9 rounded-[8px] bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 border border-white/5 transition-all hover:shadow-[0_0_15px_rgba(85,222,232,0.3)] hover:border-primary/30 duration-300"
               aria-label="Close">
                <X size={18} />
              </Button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              {/* Integrated Logo Upload Area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label
                    className="text-[9px] font-black text-white/40 uppercase tracking-widest"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Team Logo
                  </label>
                  {formData.name && (
                    <Button
                      type="button"
                      disabled={isGeneratingEmblem || isUploading}
                      onClick={generateEsportsEmblem}
                      className="text-[9px] font-black text-primary hover:text-primary disabled:text-white/20 uppercase tracking-wider flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none hover:shadow-[0_0_8px_rgba(85,222,232,0.4)]"
                    >
                      <Sparkles size={10} className="animate-pulse" /> Generate
                      Esports Emblem
                    </Button>
                  )}
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative h-24 rounded-[8px] bg-white/[0.02] border border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 group ${isDragging ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(85,222,232,0.15)]" : "border-white/10 hover:border-primary/40 hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(85,222,232,0.05)]"}`}
                >
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {preview ? (
                    <div className="w-full h-full relative group/preview flex items-center justify-center">
                      <img
                        src={preview}
                        alt="Team logo"
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center duration-300">
                        <Button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-[8px] shadow-lg transition-transform hover:scale-105 active:scale-95 duration-200"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : isUploading || isGeneratingEmblem ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2
                        className="text-primary animate-spin"
                        size={24}
                      />
                      <span
                        className="text-[10px] text-white/50 font-bold uppercase tracking-wider animate-pulse"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        {isGeneratingEmblem
                          ? "Forging Emblem..."
                          : "Uploading Logo..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-3">
                      <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center mb-1 group-hover:scale-105 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                        <Upload
                          size={14}
                          className="text-white/40 group-hover:text-primary transition-colors"
                        />
                      </div>
                      <span
                        className="text-[11px] font-bold text-white/80 tracking-wide uppercase"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Upload Team Logo
                      </span>
                      <span
                        className="text-[8px] text-white/30 font-medium uppercase tracking-widest mt-0.5"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        PNG, JPG up to 5MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ROW 1: Team Name & Sport */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Name */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label
                      className="text-[9px] font-black text-white/40 uppercase tracking-widest"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Team Name *
                    </label>
                    <span className="text-[8px] font-bold text-white/30 tracking-wider">
                      {formData.name.length} / 30
                    </span>
                  </div>
                  <div className="relative group">
                    <Users
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors duration-300"
                      size={15}
                    />
                    <Input
                      type="text"
                      name="name"
                      placeholder="e.g. Royal Strikers"
                      maxLength={30}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="w-full bg-white/[0.02] border border-white/10 rounded-[8px] py-2.5 pl-11 pr-4 text-white text-xs focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_rgba(85,222,232,0.1)] transition-all duration-300"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Sport */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label
                      className="text-[9px] font-black text-white/40 uppercase tracking-widest"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Sport
                    </label>
                    <span className="text-[8px] font-bold text-transparent select-none">
                      spacer
                    </span>
                  </div>
                  <div className="relative">
                    <Select
                      name="sport"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="w-full bg-card border border-white/10 rounded-[8px] py-2.5 px-4 text-white text-xs focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_rgba(85,222,232,0.1)] transition-all duration-300 appearance-none cursor-pointer"
                      value={formData.sport}
                      onChange={handleChange}
                    >
                      <option value="CRICKET">Cricket</option>
                      <option value="FOOTBALL">Football</option>
                      <option value="BADMINTON">Badminton</option>
                      <option value="VOLLEYBALL">Volleyball</option>
                      <option value="BASKETBALL">Basketball</option>
                    </Select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                      <Users size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 2: State & City */}
              <div className="grid grid-cols-2 gap-4">
                {/* State */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label
                      className="text-[9px] font-black text-white/40 uppercase tracking-widest"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      State
                    </label>
                  </div>
                  <div className="relative group">
                    <Map
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors duration-300"
                      size={15}
                    />
                    <Select
                      name="state"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="w-full bg-card border border-white/10 rounded-[8px] py-2.5 pl-11 pr-8 text-white text-xs focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_rgba(85,222,232,0.1)] transition-all duration-300 appearance-none cursor-pointer"
                      value={formData.state}
                      onChange={handleStateChange}
                    >
                      <option value="">Select State</option>
                      {states.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </Select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                      <Users size={12} />
                    </div>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label
                      className="text-[9px] font-black text-white/40 uppercase tracking-widest"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      City
                    </label>
                  </div>
                  <div className="relative group">
                    <MapPin
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors duration-300"
                      size={15}
                    />
                    <Select
                      name="city"
                      disabled={!formData.state}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      className="w-full bg-card border border-white/10 rounded-[8px] py-2.5 pl-11 pr-8 text-white text-xs focus:outline-none focus:border-primary/40 focus:shadow-[0_0_15px_rgba(85,222,232,0.1)] transition-all duration-300 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      value={formData.city}
                      onChange={handleChange}
                    >
                      <option value="">Select City</option>
                      {cities.map((ct) => (
                        <option key={ct} value={ct}>
                          {ct}
                        </option>
                      ))}
                    </Select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
                      <Users size={12} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                <Button
                  type="button"
                  onClick={onClose}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold rounded-[8px] border border-white/5 hover:border-white/10 transition-all duration-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitDisabled}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                  className="flex-[2] py-2.5 bg-gradient-to-r from-primary to-primary hover:brightness-[1.04] text-black font-black uppercase tracking-wider rounded-[8px] shadow-lg shadow-[var(--primary)]/10 hover:shadow-[var(--primary)]/15 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 text-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTeamModal;
