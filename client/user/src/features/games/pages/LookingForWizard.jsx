import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";
import MaterialDateTimePicker from "../../../shared/components/MaterialDateTimePicker";
import LocationVenuePicker from "../../../shared/components/modals/LocationVenuePicker";
import { Button, Input, Select, Textarea } from "@kridaz/ui";
import { MapPin, Calendar, Clock, Phone, MessageCircle, ChevronDown, ArrowLeft } from "lucide-react";
import { LOOKING_FOR_CATEGORIES, CONTACT_PREFERENCES } from "../constants/LookingForConfig";

const LookingForWizard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  // Initialize defaults
  const defaultCategory = LOOKING_FOR_CATEGORIES[0];
  const defaultSport = defaultCategory.subCategories[0];

  // Core Form State
  const [formData, setFormData] = useState({
    categoryId: defaultCategory.id,
    sportId: defaultSport.id,
    roles: [],
    requirementScope: defaultCategory.fields.find(f => f.name === "requirementScope")?.options?.[0] || "A Match",
    date: "",
    time: "",
    location: user?.city && user?.state ? `${user.city}, ${user.state}` : "",
    city: user?.city || "",
    state: user?.state || "",
    budget: "",
    experienceLevel: "Any",
    genderPreference: "Mixed / Any",
    ageGroup: "Any Age",
    description: "",
    contactPreference: "KRIDAZ_DM"
  });

  // Modal open states
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const selectedCategory = LOOKING_FOR_CATEGORIES.find(c => c.id === formData.categoryId) || defaultCategory;
  const selectedSport = selectedCategory.subCategories?.find(s => s.id === formData.sportId) || selectedCategory.subCategories?.[0];

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = LOOKING_FOR_CATEGORIES.find(c => c.id === catId);
    if (!cat) return;
    const firstSport = cat.subCategories?.[0]?.id || "";
    const firstScope = cat.fields?.find(f => f.name === "requirementScope")?.options?.[0] || "";
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      sportId: firstSport,
      roles: [],
      requirementScope: firstScope
    }));
  };

  const handleSportChange = (e) => {
    const sportId = e.target.value;
    setFormData(prev => ({
      ...prev,
      sportId: sportId,
      roles: []
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData((prev) => {
      const isSelected = prev.roles.includes(role);
      if (isSelected) {
        return { ...prev, roles: prev.roles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...prev.roles, role] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.categoryId || !formData.sportId) {
      toast.error("Please select a category and sport");
      return;
    }
    if (formData.roles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }
    if (!formData.location) {
      toast.error("Please select a location");
      return;
    }
    if (!formData.date || !formData.time) {
      toast.error("Please select date and time");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: `Looking for ${selectedCategory?.label} - ${selectedSport?.label}`,
        content: formData.description || `Looking for ${formData.roles.join(", ")}`,
        postType: "LOOKING_FOR",
        metadata: {
          categoryId: formData.categoryId,
          categoryLabel: selectedCategory?.label,
          sportId: formData.sportId,
          sportLabel: selectedSport?.label,
          roles: formData.roles,
          requirementScope: formData.requirementScope,
          locationStr: formData.location,
          city: formData.city,
          state: formData.state,
          date: formData.date,
          time: formData.time,
          budget: formData.budget,
          experienceLevel: formData.experienceLevel,
          genderPreference: formData.genderPreference,
          ageGroup: formData.ageGroup,
          description: formData.description,
          contactPreference: formData.contactPreference
        }
      };
      
      const res = await axiosInstance.post("/api/user/community", payload);
      if (res.data.success) {
        toast.success("Post created successfully!");
        const newPostId = res.data.post.id || res.data.post._id;
        navigate(`/join-games?lookingForPostId=${newPostId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const displayFullDateTime = () => {
    if (!formData.date || !formData.time) return "Select Date & Time";
    try {
      const d = new Date(formData.date);
      return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} at ${formData.time}`;
    } catch (e) {
      return `${formData.date} ${formData.time}`;
    }
  };

  return (
    <div className="h-full bg-background text-white pt-4 pb-4 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-[20px] sm:text-3xl xl:text-4xl font-black mb-1 sm:mb-2 tracking-tight font-open-sans normal-case truncate">
              Post a Requirement
            </h1>
            <p className="text-xs sm:text-[14px] text-white/70">
              Find players, professionals, or services in your area.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6">
          
          {/* Category Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white uppercase tracking-widest">
              What are you looking for?
            </label>
            <Select 
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="h-12 w-full bg-background border border-white/10 rounded-[12px] text-white font-bold"
            >
              {LOOKING_FOR_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-neutral-900 text-white font-semibold">
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Sport / Subcategory Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white uppercase tracking-widest">
              {formData.categoryId === "SERVICES" ? "Select Service Type" : "Select Sport"}
            </label>
            <Select 
              value={formData.sportId}
              onChange={handleSportChange}
              className="h-12 w-full bg-background border border-white/10 rounded-[12px] text-white font-bold"
            >
              {selectedCategory.subCategories?.map(sub => (
                <option key={sub.id} value={sub.id} className="bg-neutral-900 text-white font-semibold">
                  {sub.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Roles Selection (Toggles) */}
          {selectedSport && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-widest">
                Roles Needed (Select Multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedSport.roles.map((role) => {
                  const isSelected = formData.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        isSelected 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-background border-white/10 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location & Date/Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location Button (Opens LocationVenuePicker) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-widest">
                Location
              </label>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-cyan-400/60 rounded-[12px] h-12 px-3.5 text-sm font-bold text-white transition-all text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin size={18} className="text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {formData.location || "Select Venue or Area..."}
                  </span>
                </div>
                <ChevronDown size={16} className="text-white/50 shrink-0" />
              </button>
            </div>

            {/* Date & Time Button (Opens MaterialDateTimePicker) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-widest">
                Date & Time
              </label>
              <button
                type="button"
                onClick={() => setShowDateTimePicker(true)}
                className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-cyan-400/60 rounded-[12px] h-12 px-3.5 text-sm font-bold text-white transition-all text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Calendar size={18} className="text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {displayFullDateTime()}
                  </span>
                </div>
                <ChevronDown size={16} className="text-white/50 shrink-0" />
              </button>
            </div>
          </div>

          {/* Scope / Duration */}
          {selectedCategory.fields?.some(f => f.name === "requirementScope") && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-widest">
                Duration / Scope
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.fields.find(f => f.name === "requirementScope").options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, requirementScope: opt }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                      formData.requirementScope === opt
                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                        : "bg-background border-white/10 hover:border-white/30"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Budget */}
            {selectedCategory.fields?.some(f => f.name === "budget") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-widest">
                  Budget (₹) - Optional
                </label>
                <Input 
                  type="number"
                  placeholder="e.g. 500"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  className="h-12 bg-background border border-white/10 rounded-[12px] text-white pl-4"
                />
              </div>
            )}

            {/* Experience Level */}
            {selectedCategory.fields?.some(f => f.name === "experienceLevel") && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-white uppercase tracking-widest">
                  Experience Required
                </label>
                <Select 
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                  className="h-12 w-full bg-background border border-white/10 rounded-[12px] text-white font-bold"
                >
                  {selectedCategory.fields.find(f => f.name === "experienceLevel").options.map(opt => (
                    <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Gender & Age Row (For Players Category) */}
          {(selectedCategory.fields?.some(f => f.name === "genderPreference") || selectedCategory.fields?.some(f => f.name === "ageGroup")) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gender Preference */}
              {selectedCategory.fields?.some(f => f.name === "genderPreference") && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white uppercase tracking-widest">
                    Gender Preference
                  </label>
                  <Select 
                    value={formData.genderPreference}
                    onChange={(e) => setFormData(prev => ({ ...prev, genderPreference: e.target.value }))}
                    className="h-12 w-full bg-background border border-white/10 rounded-[12px] text-white font-bold"
                  >
                    {selectedCategory.fields.find(f => f.name === "genderPreference").options.map(opt => (
                      <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Age Group */}
              {selectedCategory.fields?.some(f => f.name === "ageGroup") && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white uppercase tracking-widest">
                    Age Group
                  </label>
                  <Select 
                    value={formData.ageGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                    className="h-12 w-full bg-background border border-white/10 rounded-[12px] text-white font-bold"
                  >
                    {selectedCategory.fields.find(f => f.name === "ageGroup").options.map(opt => (
                      <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white uppercase tracking-widest">
              Specific Requirements / Description
            </label>
            <Textarea 
              placeholder="e.g. Need a pace bowler who can bat a bit. Match is on astroturf..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="resize-none bg-background border border-white/10 rounded-[12px] p-4 text-white text-sm"
            />
          </div>

          {/* Contact Preference */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white uppercase tracking-widest">
              How should people contact you?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTACT_PREFERENCES.map(pref => (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contactPreference: pref.id }))}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                    formData.contactPreference === pref.id
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-background border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  {pref.id === "KRIDAZ_DM" && <MessageCircle size={18} />}
                  {pref.id === "WHATSAPP" && <MessageCircle size={18} />}
                  {pref.id === "CALL" && <Phone size={18} />}
                  <span className="text-sm font-bold">{pref.label}</span>
                </button>
              ))}
            </div>
            {formData.contactPreference !== "KRIDAZ_DM" && (
              <p className="text-xs text-cyan-400/80 mt-1 flex items-center gap-1.5 font-bold">
                Note: Selecting Call or WhatsApp will reveal your phone number ({user?.phone || 'Not available'}) on the community card.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <Button 
              onClick={handleSubmit} 
              loading={loading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-primary text-black font-extrabold text-sm border-0 rounded-[12px]"
            >
              Post Requirement
            </Button>
          </div>

        </div>
      </div>
      
      {/* Date Picker Modal */}
      <MaterialDateTimePicker
        isOpen={showDateTimePicker}
        onClose={() => setShowDateTimePicker(false)}
        onSelect={(dateStr, timeStr) => {
          setFormData((prev) => ({
            ...prev,
            date: dateStr,
            time: timeStr
          }));
        }}
        initialDate={formData.date || null}
        initialTime={formData.time || null}
      />

      {/* Location Picker Modal */}
      <LocationVenuePicker 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelect={(data) => {
          setFormData((prev) => ({
            ...prev,
            location: data.displayName,
            city: data.city,
            state: data.state
          }));
        }}
      />
    </div>
  );
};

export default LookingForWizard;
