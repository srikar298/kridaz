import { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  AlignLeft,
  Loader2,
  Check,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { updateUser } from "@redux/slices/authSlice";
import { searchLocations } from "@utils/locationService";
import { Button, Input, Select, Textarea } from "@kridaz/ui";


export default function EditProfileModal({ isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    gender: "",
    location: "",
    interests: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef(null);

  // OTP states for phone change
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Username check states
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking'
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        location: user.location || user.city || "",
        interests: user.interests?.length ? user.interests : (user.sportTypes || []),
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "phone") {
      setShowOtpInput(false);
      setOtp("");
    }
  };

  // Location Autocomplete Effect
  useEffect(() => {
    if (!formData.location || formData.location.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocations(formData.location);
        setLocationSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.location]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (suggestion) => {
    setFormData({ ...formData, location: suggestion.display_name });
    setShowSuggestions(false);
  };

  // Username availability check
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.username || formData.username === user?.username) {
        setUsernameStatus(null);
        return;
      }

      if (formData.username.length < 3) {
        setUsernameStatus("short");
        return;
      }

      setIsCheckingUsername(true);
      setUsernameStatus("checking");

      try {
        const response = await axiosInstance.get(
          `/api/user/auth/check-username?username=${formData.username}`
        );
        setUsernameStatus(response.data.available ? "available" : "taken");
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameStatus(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.username, user?.username]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    setUploading(true);
    try {
      const response = await axiosInstance.post(
        "/api/user/auth/profile-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      dispatch(updateUser({ profilePicture: response.data.profilePicture }));
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneChanged = formData.phone && formData.phone !== (user?.phone || "");

    if (phoneChanged && !showOtpInput) {
      setSendingOtp(true);
      try {
        await axiosInstance.post("/api/user/auth/send-phone-otp", {
          phone: formData.phone,
        });
        setShowOtpInput(true);
        toast.success("OTP sent to your new phone number");
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      } finally {
        setSendingOtp(false);
      }
      return;
    }

    if (showOtpInput) {
      if (!otp) {
        toast.error("Please enter the OTP");
        return;
      }
      setVerifyingOtp(true);
      try {
        await axiosInstance.post("/api/user/auth/verify-phone-otp", {
          phone: formData.phone,
          otp,
        });
      } catch (error) {
        setVerifyingOtp(false);
        toast.error(error.response?.data?.message || "Invalid OTP");
        return; // Stop here if verification fails
      }
      setVerifyingOtp(false);
    }

    setLoading(true);
    try {
      const response = await axiosInstance.put(
        "/api/user/auth/updateProfile",
        formData
      );
      if (response.data.success) {
        dispatch(updateUser(response.data.user));
        toast.success("Profile updated successfully");
        setShowOtpInput(false);
        setOtp("");
        onClose();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-[8px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[6px] bg-primary/10 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
                Edit Profile
              </h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                Customize your identity
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            className="p-2 rounded-[6px] hover:bg-background text-white/20 hover:text-white transition-all"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"
        >
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[8px] bg-primary/5 border border-border overflow-hidden flex items-center justify-center group-hover:border-primary/30 transition-all">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-black text-3xl tracking-tighter">
                    {user?.name
                      ?.split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) || "U"}
                  </span>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader2
                      size={24}
                      className="animate-spin text-primary"
                    />
                  </div>
                )}
              </div>

              <label
                htmlFor="modal-profile-upload"
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-[8px] flex items-center justify-center cursor-pointer shadow-lg shadow-[var(--primary)]/20 hover:scale-110 active:scale-95 transition-all z-20 border-4 border-black"
              >
                <Camera size={16} className="text-black" />
                <Input
                  type="file"
                  id="modal-profile-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mt-4">
              Change Profile Picture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"
                  size={16}
                />
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-background border border-border rounded-[8px] py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Username
                </label>
                {usernameStatus && (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider ${usernameStatus === "available" ? "text-primary" : usernameStatus === "taken" ? "text-red-500" : usernameStatus === "short" ? "text-orange-500" : "text-white/20"}`}
                  >
                    {usernameStatus === "checking"
                      ? "Checking..."
                      : usernameStatus === "available"
                        ? "Available"
                        : usernameStatus === "taken"
                          ? "Username Taken"
                          : usernameStatus === "short"
                            ? "Too short"
                            : ""}
                  </span>
                )}
              </div>
              <div className="relative group">
                <span
                  className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm transition-colors ${usernameStatus === "available" ? "text-primary" : usernameStatus === "taken" ? "text-red-500" : "text-white/20"}`}
                >
                  @
                </span>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full bg-background border rounded-[8px] py-4 pl-10 pr-12 text-sm text-white focus:outline-none focus:ring-4 transition-all ${usernameStatus === "available" ? "border-primary/50 focus:border-primary focus:ring-primary/10" : usernameStatus === "taken" ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" : "border-border focus:border-primary focus:ring-primary/10"}`}
                  placeholder="username"
                  required
                />
                {isCheckingUsername && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2
                      size={14}
                      className="animate-spin text-primary"
                    />
                  </div>
                )}
                {!isCheckingUsername && usernameStatus === "available" && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Check size={14} className="text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                Contact Number
              </label>
              <div className="relative group">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"
                  size={16}
                />
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-background border border-border rounded-[8px] py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  placeholder="Phone number"
                />
              </div>
              {showOtpInput && (
                <div className="mt-2 relative group animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full bg-background border border-border rounded-[8px] py-4 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-center tracking-[0.5em] font-bold"
                    placeholder="ENTER OTP"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      setSendingOtp(true);
                      try {
                        await axiosInstance.post("/api/user/auth/send-phone-otp", {
                          phone: formData.phone,
                        });
                        toast.success("OTP resent");
                      } catch (error) {
                        toast.error("Failed to resend OTP");
                      } finally {
                        setSendingOtp(false);
                      }
                    }}
                    disabled={sendingOtp}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {sendingOtp ? "Sending..." : "Resend"}
                  </Button>
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                Gender
              </label>
              <Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-[8px] py-4 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
              >
                <option value="" className="bg-background">
                  Select Gender
                </option>
                <option value="Male" className="bg-background">
                  Male
                </option>
                <option value="Female" className="bg-background">
                  Female
                </option>
                <option value="Other" className="bg-background">
                  Other
                </option>
                <option value="Prefer not to say" className="bg-background">
                  Prefer not to say
                </option>
              </Select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
              Short Bio
            </label>
            <div className="relative group">
              <AlignLeft
                className="absolute left-4 top-4 text-white/20 group-focus-within:text-primary transition-colors"
                size={16}
              />
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-background border border-border rounded-[8px] py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div
              className="space-y-2 col-span-1 md:col-span-2"
              ref={locationRef}
            >
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
                Location
              </label>
              <div className="relative group">
                <MapPin
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors"
                  size={16}
                />
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() =>
                    setShowSuggestions(locationSuggestions.length > 0)
                  }
                  placeholder="e.g. Mumbai, Maharashtra"
                  className="w-full bg-background border border-border rounded-[8px] py-4 pl-12 pr-12 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                {isSearchingLocation && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-[12px] overflow-hidden z-[110] shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                    {locationSuggestions.map((suggestion, idx) => (
                      <Button
                        type="button"
                        key={idx}
                        onClick={() => handleSelectLocation(suggestion)}
                        className="w-full px-5 py-3 text-left hover:bg-primary/10 text-white/80 hover:text-white border-b border-border last:border-0 transition-colors flex flex-col gap-0.5"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {suggestion.city ||
                            suggestion.display_name.split(",")[0]}
                        </span>
                        <span className="text-[9px] text-white/40 truncate">
                          {suggestion.display_name}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interests / Sports */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">
              Sports & Interests
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.interests || []).map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-[6px] text-[10px] font-bold text-primary flex items-center gap-2"
                >
                  {interest}
                  <Button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        interests: prev.interests.filter((i) => i !== interest),
                      }));
                    }}
                    className="hover:text-white"
                  >
                    <X size={10} />
                  </Button>
                </span>
              ))}
            </div>
            <div className="relative group">
              <Select
                onChange={(e) => {
                  if (
                    e.target.value &&
                    !formData.interests.includes(e.target.value)
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      interests: [...prev.interests, e.target.value],
                    }));
                  }
                  e.target.value = "";
                }}
                className="w-full bg-background border border-border rounded-[8px] py-4 px-4 text-sm text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
              >
                <option value="">Add Interest...</option>
                {[
                  "Cricket",
                  "Football",
                  "Badminton",
                  "Tennis",
                  "Basketball",
                  "Volleyball",
                  "Table Tennis",
                  "Swimming",
                  "Gym",
                  "Yoga",
                ]
                  .filter((s) => !formData.interests.includes(s))
                  .map((sport, idx) => (
                    <option key={idx} value={sport}>
                      {sport}
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex items-center gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-[8px] border border-border text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-background hover:text-white transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                sendingOtp ||
                verifyingOtp ||
                isCheckingUsername ||
                usernameStatus === "taken" ||
                usernameStatus === "short"
              }
              className="flex-[2] px-8 py-4 rounded-[8px] bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
            >
              {loading || sendingOtp || verifyingOtp ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {sendingOtp ? "Sending OTP..." : verifyingOtp ? "Verifying..." : "Updating..."}
                </>
              ) : (
                <>
                  <Check size={16} />
                  {showOtpInput ? "Verify & Save" : "Save Changes"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
