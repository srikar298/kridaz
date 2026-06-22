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
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../redux/slices/authSlice";
import { searchLocations } from "../../utils/locationService";
import { Button, Input, Select, Textarea } from "@kridaz/ui";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropImage";


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
  const [bannerUploading, setBannerUploading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Phone OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const locationRef = useRef(null);

  // Username check states
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking'
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Banner Crop States
  const [bannerToCrop, setBannerToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // Profile Crop States
  const [profileToCrop, setProfileToCrop] = useState(null);
  const [profileCrop, setProfileCrop] = useState({ x: 0, y: 0 });
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileCroppedAreaPixels, setProfileCroppedAreaPixels] = useState(null);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || user.phoneNumber || "",
        bio: user.bio || "",
        gender: user.gender || "",
        location: user.location || user.city || "",
        interests: user.interests || user.sportTypes || [],
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setProfileToCrop(reader.result);
    });
    reader.readAsDataURL(file);
  };

  const handleProfileCropDone = async () => {
    if (!profileCroppedAreaPixels || !profileToCrop) return;

    setUploading(true);
    try {
      const croppedBlob = await getCroppedImg(profileToCrop, profileCroppedAreaPixels);
      const file = new File([croppedBlob], "cropped-profile.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await axiosInstance.post(
        "/api/user/auth/profile-picture",
        formData
      );

      dispatch(updateUser({ profilePicture: response.data.profilePicture }));
      toast.success("Profile picture updated!");
      setProfileToCrop(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileCropCancel = () => {
    setProfileToCrop(null);
    setProfileCrop({ x: 0, y: 0 });
    setProfileZoom(1);
    setProfileCroppedAreaPixels(null);
  };

  const onProfileCropComplete = (croppedArea, croppedAreaPixels) => {
    setProfileCroppedAreaPixels(croppedAreaPixels);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setBannerToCrop(reader.result);
    });
    reader.readAsDataURL(file);
  };

  const handleCropDone = async () => {
    if (!croppedAreaPixels || !bannerToCrop) return;

    setBannerUploading(true);
    try {
      const croppedBlob = await getCroppedImg(bannerToCrop, croppedAreaPixels);
      const file = new File([croppedBlob], "cropped-banner.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("bannerPicture", file);

      const response = await axiosInstance.post(
        "/api/user/auth/banner-picture",
        formData
      );

      dispatch(updateUser({ bannerPicture: response.data.bannerPicture }));
      toast.success("Banner picture updated!");
      setBannerToCrop(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload banner");
    } finally {
      setBannerUploading(false);
    }
  };

  const handleCropCancel = () => {
    setBannerToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const submitProfileUpdate = async (finalPhone = formData.phone) => {
    setLoading(true);
    try {
      const payload = { ...formData, phone: finalPhone };
      const response = await axiosInstance.put(
        "/api/user/auth/updateProfile",
        payload
      );
      if (response.data.success) {
        dispatch(updateUser(response.data.user));
        toast.success("Profile updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone || formData.phone.trim() === "") {
      toast.error("Contact number is mandatory. Please enter a valid phone number.");
      return;
    }

    // Check if phone was changed
    const phoneChanged = formData.phone !== (user?.phone || "");

    if (phoneChanged && formData.phone) {
      setSendingOtp(true);
      try {
        const res = await axiosInstance.post("/api/user/auth/send-phone-verification-otp", { phone: formData.phone });
        if (res.data?.success) {
          toast.success("OTP sent to new phone number!");
          setShowOtpModal(true);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      } finally {
        setSendingOtp(false);
      }
      return; // Do not submit the rest of the profile yet
    }

    submitProfileUpdate();
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await axiosInstance.post("/api/user/auth/verify-phone-otp", {
        phone: formData.phone,
        otp: otp
      });
      if (res.data?.success) {
        toast.success("Phone verified successfully!");
        setShowOtpModal(false);
        setOtp("");
        // Continue saving the rest of the profile
        submitProfileUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 font-sans"
      style={{ fontFamily: "Inter, -apple-system, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-card border border-white/[0.08] rounded-[16px] overflow-hidden shadow-[0px_4px_16px_rgba(0,0,0,0.4)] animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-card border border-white/[0.08] flex items-center justify-center shrink-0">
              <User size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-white leading-[28px]">
                Edit Profile
              </h2>
              <p className="text-[14px] font-normal text-white/70 leading-[20px]">
                Customize your identity
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-[12px] bg-card border border-white/[0.08] text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
        >
          {/* Banner Upload */}
          <div className="flex flex-col">
            <label className="text-[14px] font-semibold text-white mb-2">
              Banner Image
            </label>
            <div className="relative group w-full h-32 md:h-40 rounded-[16px] bg-card border border-white/[0.08] overflow-hidden flex items-center justify-center hover:border-primary transition-all">
              {user?.bannerPicture || user?.ownerProfile?.bannerUrl ? (
                <img
                  src={user.bannerPicture || user.ownerProfile.bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[14px] font-normal text-white/70">
                  No Banner Image
                </span>
              )}
              {bannerUploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}
              <label
                htmlFor="modal-banner-upload"
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-20"
              >
                <Camera size={24} className="text-primary mb-2" />
                <span className="text-[14px] font-semibold text-white">
                  Change Banner
                </span>
                <Input
                  type="file"
                  id="modal-banner-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={bannerUploading}
                />
              </label>
            </div>
          </div>

          {/* Top Section: Avatar & Details side-by-side */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Box: Profile Picture */}
            <div className="flex flex-col shrink-0">
              <label className="text-[14px] font-semibold text-white mb-2">
                Profile Picture
              </label>
              <div className="relative group w-[100px] h-[100px]">
                <div className="w-full h-full rounded-[16px] bg-card border border-white/[0.08] overflow-hidden flex items-center justify-center group-hover:border-primary transition-all">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary font-bold text-[32px]">
                      {user?.name
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "U"}
                    </span>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <Loader2
                        size={24}
                        className="animate-spin text-primary"
                      />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="modal-profile-upload"
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-card rounded-[12px] border border-white/[0.08] flex items-center justify-center cursor-pointer hover:border-primary transition-all z-20 shadow-[0px_4px_16px_rgba(0,0,0,0.4)]"
                >
                  <Camera size={18} className="text-primary" />
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
            </div>

            {/* Right Box: Full Name & Username inputs */}
            <div className="flex-1 grid grid-cols-1 gap-6">
              {/* Full Name */}
              <div className="flex flex-col">
                <label className="text-[14px] font-semibold text-white mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-secondary transition-colors"
                    size={18}
                  />
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-[58px] bg-card border border-white/[0.08] rounded-[16px] py-4 pl-12 pr-4 text-[14px] text-white focus:outline-none focus:border-secondary transition-all placeholder-white/70"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[14px] font-semibold text-white">
                    Username
                  </label>
                  {usernameStatus && (
                    <span
                      className={`text-[12px] font-semibold ${usernameStatus === "available" ? "text-primary" : usernameStatus === "taken" ? "text-red-500" : usernameStatus === "short" ? "text-orange-500" : "text-white/70"}`}
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
                    className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[14px] transition-colors ${usernameStatus === "available" ? "text-primary" : usernameStatus === "taken" ? "text-red-500" : "text-white/70"}`}
                  >
                    @
                  </span>
                  <Input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full h-[58px] bg-card border rounded-[16px] py-4 pl-10 pr-12 text-[14px] text-white focus:outline-none transition-all placeholder-white/70 ${usernameStatus === "available" ? "border-primary/50 focus:border-primary" : usernameStatus === "taken" ? "border-red-500/50 focus:border-red-500" : "border-white/[0.08] focus:border-secondary"}`}
                    placeholder="username"
                    required
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2
                        size={16}
                        className="animate-spin text-secondary"
                      />
                    </div>
                  )}
                  {!isCheckingUsername && usernameStatus === "available" && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check size={16} className="text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Phone & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-white mb-2">
                Contact Number
              </label>
              <div className="relative group">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-secondary transition-colors"
                  size={18}
                />
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    if (!(user?.phone || user?.phoneNumber)) handleChange(e);
                  }}
                  readOnly={!!(user?.phone || user?.phoneNumber)}
                  className={`w-full h-[58px] bg-card border rounded-[16px] py-4 pl-12 pr-4 text-[14px] text-white focus:outline-none transition-all placeholder-white/70 ${(user?.phone || user?.phoneNumber) ? "border-white/[0.08] opacity-50 cursor-not-allowed" : "border-white/[0.08] focus:border-secondary"
                    }`}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Gender Dropdown */}
            <div className="flex flex-col">
              <label className="text-[14px] font-semibold text-white mb-2">
                Gender
              </label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-secondary transition-colors pointer-events-none"
                  size={18}
                />
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-[58px] bg-card border border-white/[0.08] rounded-[16px] py-4 pl-12 pr-10 text-[14px] text-white focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-card">
                    Select Gender
                  </option>
                  <option value="Male" className="bg-card">
                    Male
                  </option>
                  <option value="Female" className="bg-card">
                    Female
                  </option>
                  <option value="Other" className="bg-card">
                    Other
                  </option>
                  <option value="Prefer not to say" className="bg-card">
                    Prefer not to say
                  </option>
                </Select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Short Bio */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[14px] font-semibold text-white">
                Short Bio
              </label>
              <span className="text-[12px] font-normal text-white/70">
                {formData.bio?.length || 0}/150
              </span>
            </div>
            <div className="relative group">
              <AlignLeft
                className="absolute left-4 top-4 text-white/70 group-focus-within:text-secondary transition-colors"
                size={18}
              />
              <Textarea
                name="bio"
                maxLength={150}
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-card border border-white/[0.08] rounded-[16px] py-4 pl-12 pr-4 text-[14px] text-white focus:outline-none focus:border-secondary transition-all min-h-[100px] resize-none placeholder-white/70"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Row 4: Location */}
          <div className="flex flex-col" ref={locationRef}>
            <label className="text-[14px] font-semibold text-white mb-2">
              Location
            </label>
            <div className="relative group">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-secondary transition-colors"
                size={18}
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
                className="w-full h-[58px] bg-card border border-white/[0.08] rounded-[16px] py-4 pl-12 pr-12 text-[14px] text-white focus:outline-none focus:border-secondary transition-all placeholder-white/70"
              />
              {isSearchingLocation && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-card border border-white/[0.08] rounded-[16px] overflow-hidden z-[110] shadow-[0px_4px_16px_rgba(0,0,0,0.4)] max-h-[200px] overflow-y-auto custom-scrollbar">
                  {locationSuggestions.map((suggestion, idx) => (
                    <Button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectLocation(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-card border-b border-white/[0.08] last:border-0 transition-colors flex flex-col gap-1"
                    >
                      <span className="text-[14px] font-semibold text-white">
                        {suggestion.city ||
                          suggestion.display_name.split(",")[0]}
                      </span>
                      <span className="text-[12px] font-normal text-white/70 truncate">
                        {suggestion.display_name}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Sports & Interests */}
          <div className="flex flex-col">
            <label className="text-[14px] font-semibold text-white mb-2">
              Sports & Interests
            </label>
            {formData.interests?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-primary rounded-[8px] text-[12px] font-bold text-background flex items-center gap-1.5"
                  >
                    {interest}
                    <Button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          interests: prev.interests.filter(
                            (i) => i !== interest
                          ),
                        }));
                      }}
                      className="hover:bg-black/10 rounded-full p-0.5"
                    >
                      <X size={12} strokeWidth={3} />
                    </Button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative group">
              <Star
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-secondary transition-colors pointer-events-none"
                size={18}
              />
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
                className="w-full h-[58px] bg-card border border-white/[0.08] rounded-[16px] py-4 pl-12 pr-12 text-[14px] text-white focus:outline-none focus:border-secondary transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-card">
                  Add your sports or interests
                </option>
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
                    <option key={idx} value={sport} className="bg-card">
                      {sport}
                    </option>
                  ))}
              </Select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Row 6: Action Buttons */}
          <div className="pt-4 flex flex-col md:flex-row gap-4">
            <Button
              type="button"
              onClick={onClose}
              className="w-full md:flex-1 h-[58px] bg-card border border-white/[0.08] rounded-[16px] text-white text-[18px] font-bold hover:bg-card transition-colors flex items-center justify-center"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                isCheckingUsername ||
                usernameStatus === "taken" ||
                usernameStatus === "short" ||
                sendingOtp
              }
              className="w-full md:flex-[2] h-[58px] bg-[linear-gradient(90deg,var(--secondary)_0%,var(--primary)_100%)] rounded-[16px] text-background text-[18px] font-bold shadow-[0px_8px_24px_rgba(179,220,38,0.15)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
            >
              {loading || sendingOtp ? (
                <>
                  <Loader2 size={20} className="animate-spin text-background" />
                  {sendingOtp ? "Sending OTP..." : "Updating..."}
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* OTP Modal Overlay */}
      {showOtpModal && (
        <div className="absolute inset-0 z-50 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
          <h3 className="text-[20px] font-bold text-white mb-2">Verify Phone Number</h3>
          <p className="text-[14px] text-white/70 mb-6 text-center">
            We've sent an OTP to <span className="text-primary">{formData.phone}</span>
          </p>
          <Input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit OTP"
            className="w-full max-w-[250px] h-[58px] bg-card border border-white/[0.08] rounded-[16px] text-center text-[20px] tracking-widest text-white focus:outline-none focus:border-secondary transition-all mb-6"
            maxLength={6}
          />
          <div className="flex gap-4 w-full max-w-[250px]">
            <Button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="flex-1 h-[48px] bg-card border border-white/[0.08] rounded-[12px] text-white text-[14px] font-bold hover:bg-card transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp || otp.length < 6}
              className="flex-1 h-[48px] bg-[linear-gradient(90deg,var(--secondary)_0%,var(--primary)_100%)] rounded-[12px] text-background text-[14px] font-bold hover:opacity-90 transition-all disabled:opacity-40"
            >
              {verifyingOtp ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "Verify"}
            </Button>
          </div>
        </div>
      )}
      {/* Banner Crop Modal Overlay */}
      {bannerToCrop && (
        <div className="absolute inset-0 z-[1001] bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-white/[0.08] rounded-[16px] p-6 shadow-[0px_8px_32px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            <h3 className="text-[20px] font-bold text-white mb-2 text-center">Crop Banner Image</h3>
            <p className="text-[14px] text-white/70 mb-4 text-center">
              Adjust the selection to fit the banner dimensions.
            </p>
            
            <div className="relative w-full h-[200px] bg-black/50 rounded-[12px] overflow-hidden mb-4 border border-white/[0.08]">
              <Cropper
                image={bannerToCrop}
                crop={crop}
                zoom={zoom}
                aspect={3 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            {/* Zoom slider */}
            <div className="mb-6 flex items-center gap-4">
              <span className="text-[14px] text-white/70">Zoom</span>
              <input
                id="banner-crop-zoom-slider"
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-primary h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Buttons */}
            <div className="flex gap-4 w-full">
              <Button
                id="banner-crop-cancel-btn"
                type="button"
                onClick={handleCropCancel}
                className="flex-1 h-[48px] bg-card border border-white/[0.08] rounded-[12px] text-white text-[14px] font-bold hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </Button>
              <Button
                id="banner-crop-done-btn"
                type="button"
                onClick={handleCropDone}
                disabled={bannerUploading}
                className="flex-1 h-[48px] bg-[linear-gradient(90deg,var(--secondary)_0%,var(--primary)_100%)] rounded-[12px] text-background text-[14px] font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {bannerUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Profile Crop Modal Overlay */}
      {profileToCrop && (
        <div className="absolute inset-0 z-[1001] bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-white/[0.08] rounded-[16px] p-6 shadow-[0px_8px_32px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
            <h3 className="text-[20px] font-bold text-white mb-2 text-center">Crop Profile Picture</h3>
            <p className="text-[14px] text-white/70 mb-4 text-center">
              Adjust the selection to fit the profile circle.
            </p>
            
            <div className="relative w-full h-[250px] bg-black/50 rounded-[12px] overflow-hidden mb-4 border border-white/[0.08]">
              <Cropper
                image={profileToCrop}
                crop={profileCrop}
                zoom={profileZoom}
                aspect={1 / 1}
                cropShape="round"
                showGrid={false}
                onCropChange={setProfileCrop}
                onCropComplete={onProfileCropComplete}
                onZoomChange={setProfileZoom}
              />
            </div>
            
            {/* Zoom slider */}
            <div className="mb-6 flex items-center gap-4">
              <span className="text-[14px] text-white/70">Zoom</span>
              <input
                id="profile-crop-zoom-slider"
                type="range"
                value={profileZoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setProfileZoom(Number(e.target.value))}
                className="flex-1 accent-primary h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Buttons */}
            <div className="flex gap-4 w-full">
              <Button
                id="profile-crop-cancel-btn"
                type="button"
                onClick={handleProfileCropCancel}
                className="flex-1 h-[48px] bg-card border border-white/[0.08] rounded-[12px] text-white text-[14px] font-bold hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </Button>
              <Button
                id="profile-crop-done-btn"
                type="button"
                onClick={handleProfileCropDone}
                disabled={uploading}
                className="flex-1 h-[48px] bg-[linear-gradient(90deg,var(--secondary)_0%,var(--primary)_100%)] rounded-[12px] text-background text-[14px] font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
