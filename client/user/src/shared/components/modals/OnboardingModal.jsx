import { useState, useEffect, useRef } from "react";
import {
  Check,
  Trophy,
  Activity,
  Zap,
  Target,
  MapPin,
  ChevronLeft,
  Loader2,
  Image as ImageIcon,
  ChevronDown,
  X,
  User,
  Calendar,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateUser, login } from "@redux/slices/authSlice";
import { searchLocations, fetchCountryCodes, formatLocation } from "@utils/locationService";
import { useGoogleLogin } from "@react-oauth/google";
import { Button, Input, Select } from "@kridaz/ui";


const getNameFromEmail = (email) => {
  if (!email) return "";
  const prefix = email.split("@")[0];
  const clean = prefix.replace(/[0-9]/g, "").replace(/[._-]/g, " ").trim();
  return clean.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const CustomSelect = ({ value, onChange, options, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div
        className="w-full bg-card border border-primary/50 rounded-[16px] py-2 px-2 text-white hover:border-primary outline-none transition-all cursor-pointer flex justify-between items-center h-[42px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-1">
          {icon && <span className="text-primary flex items-center justify-center">{icon}</span>}
          <span
            className={
              value
                ? "text-white text-[12px] md:text-sm"
                : "text-white/40 text-[12px] md:text-sm"
            }
          >
            {value ? options.find((o) => o.value === value)?.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/[0.08] rounded-[16px] max-h-[220px] overflow-y-auto z-[999] shadow-xl custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer transition-colors text-[13px] ${value === opt.value ? "bg-primary text-background font-bold" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const OnboardingModal = ({ isOpen, onClose, initialData, onComplete }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countryCodeOptions, setCountryCodeOptions] = useState([]);

  useEffect(() => {
    const loadCountryCodes = async () => {
      const codes = await fetchCountryCodes();
      if (codes && codes.length > 0) {
        setCountryCodeOptions(codes.filter((c) => c.dial_code !== "+91"));
      }
    };
    loadCountryCodes();
  }, []);

  // Phone verification state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneRegistrationToken, setPhoneRegistrationToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  // Email verification state
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailRegistrationToken, setEmailRegistrationToken] = useState("");

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize from initialData depending on authMethod (google vs email/phone)
  const isGoogle = initialData?.authMethod === "google";
  const needsPhoneVerification =
    initialData?.authMethod === "google" || initialData?.authMethod === "email";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    sportTypes: [],
    password: "",
    otp: "",
    countryCode: "+91",
    city: "",
    state: "",
  });

  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  const days = Array.from({ length: 31 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, "0"),
    label: (i + 1).toString().padStart(2, "0"),
  }));
  const months = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData((prev) => ({
        ...prev,
        dob: `${dobYear}-${dobMonth}-${dobDay}`,
      }));
    }
  }, [dobDay, dobMonth, dobYear]);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeLocationTab, setActiveLocationTab] = useState("map");
  const locationRef = useRef(null);

  const sports = [
    { name: "Cricket", icon: <Trophy size={18} /> },
    { name: "Football", icon: <Activity size={18} /> },
    { name: "Badminton", icon: <Zap size={18} /> },
    { name: "Tennis", icon: <Target size={18} /> },
    { name: "Basketball", icon: <Activity size={18} /> },
    { name: "Volleyball", icon: <Zap size={18} /> },
    { name: "Table Tennis", icon: <Target size={18} /> },
    { name: "Pickleball", icon: <Trophy size={18} /> },
  ];

  const toggleSport = (sportName) => {
    setFormData((prev) => ({
      ...prev,
      sportTypes: prev.sportTypes.includes(sportName)
        ? prev.sportTypes.filter((s) => s !== sportName)
        : [...prev.sportTypes, sportName],
    }));
  };

  // Sync initialData to formData
  useEffect(() => {
    if (isOpen && initialData) {
      let savedData = null;
      try {
        const saved = localStorage.getItem("kridaz_onboarding");
        if (saved) {
          savedData = JSON.parse(saved);
        }
      } catch (e) {}

      const isGoogle = initialData.authMethod === "google";
      const userObj = isGoogle ? initialData.user || {} : {};

      const emailVal =
        savedData?.email ||
        (isGoogle ? userObj.email || "" : initialData?.email || "");
      const derivedName =
        savedData?.name ||
        (isGoogle
          ? userObj.name || getNameFromEmail(emailVal)
          : initialData?.name || getNameFromEmail(emailVal));

      setFormData((prev) => ({
        name:
          savedData?.name ||
          prev.name ||
          initialData?.name ||
          derivedName ||
          "",
        firstName:
          savedData?.firstName ||
          prev.firstName ||
          initialData?.firstName ||
          derivedName.split(" ")[0] ||
          "",
        lastName:
          savedData?.lastName ||
          prev.lastName ||
          initialData?.lastName ||
          derivedName.split(" ").slice(1).join(" ") ||
          "",
        email: savedData?.email || prev.email || emailVal || "",
        phone:
          savedData?.phone ||
          prev.phone ||
          initialData?.phone ||
          (isGoogle ? userObj.phone || "" : ""),
        gender:
          savedData?.gender ||
          prev.gender ||
          initialData?.gender ||
          (isGoogle ? userObj.gender || "" : ""),
        dob:
          savedData?.dob ||
          prev.dob ||
          initialData?.dob ||
          (isGoogle
            ? userObj.dob
              ? new Date(userObj.dob).toISOString().split("T")[0]
              : ""
            : ""),
        location:
          savedData?.location ||
          prev.location ||
          initialData?.location ||
          (isGoogle ? userObj.city || userObj.location || "" : ""),
        sportTypes: savedData?.sportTypes?.length
          ? savedData.sportTypes
          : prev.sportTypes?.length
            ? prev.sportTypes
            : initialData?.sportTypes?.length
              ? initialData.sportTypes
              : isGoogle
                ? userObj.sportTypes || []
                : [],
        password:
          savedData?.password || prev.password || initialData?.password || "",
        otp: prev.otp || initialData?.otp || "",
        city: savedData?.city || prev.city || initialData?.city || "",
        state: savedData?.state || prev.state || initialData?.state || "",
      }));

      if (isGoogle && userObj.profilePic) {
        setPreviewImage(userObj.profilePic);
      }

      // Set DOB state if available
      const existingDob =
        formData.dob ||
        initialData?.dob ||
        (isGoogle
          ? userObj.dob
            ? new Date(userObj.dob).toISOString().split("T")[0]
            : ""
          : "");
      if (existingDob && existingDob.includes("-")) {
        const [y, m, d] = existingDob.split("-");
        setDobYear(y);
        setDobMonth(m);
        setDobDay(d);
      }

      if (initialData?.isEmailVerified) {
        setIsEmailVerified(true);
      }
      if (initialData?.emailRegistrationToken) {
        setEmailRegistrationToken(initialData.emailRegistrationToken);
      }
    }
  }, [isOpen, initialData]);

  const handleSendEmailVerificationLink = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return toast.error("Please enter a valid email address");
    }
    setSendingEmailLink(true);
    try {
      // Save form data to localStorage before redirect
      localStorage.setItem("kridaz_onboarding", JSON.stringify(formData));

      const endpoint = "/api/user/auth/send-email-verification";
      await axiosInstance.post(endpoint, {
        email: formData.email,
        source: "signup",
      });
      setEmailLinkSent(true);
      toast.success(
        "Verification link sent to your email! Please check your inbox."
      );
    } catch (error) {
      console.error("Email verification error:", error);
      toast.error(
        error.response?.data?.message || "Failed to send verification link"
      );
    } finally {
      setSendingEmailLink(false);
    }
  };

  const handleSendPhoneOtp = async (forceSms = false) => {
    if (!formData.phone || formData.phone.length < 10) {
      return toast.error("Please enter a valid 10-digit phone number");
    }
    setSendingPhoneOtp(true);
    try {
      const formattedPhone = formData.phone.startsWith("+")
        ? formData.phone
        : formData.countryCode + formData.phone;
      const endpoint = "/api/user/auth/send-otp";
      const res = await axiosInstance.post(endpoint, {
        phone: formattedPhone,
        deliveryMethod: forceSms ? "sms" : "whatsapp",
        type: "signup",
      });

      if (res.data.exists) {
        return toast.error(
          "Number is already registered. Try with different number"
        );
      }

      setPhoneOtpSent(true);
      setTimeLeft(60);
      toast.success(
        forceSms
          ? "SMS OTP sent successfully!"
          : "WhatsApp OTP sent successfully!"
      );
    } catch (error) {
      console.error("OTP send error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send verification OTP";
      if (errorMessage.toLowerCase().includes("already registered")) {
        toast.error("Number is already registered. Try with different number");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      return toast.error("Please enter the 6-digit OTP");
    }
    setVerifyingPhoneOtp(true);
    try {
      const formattedPhone = formData.phone.startsWith("+")
        ? formData.phone
        : formData.countryCode + formData.phone;
      const endpoint = isGoogle
        ? "/api/user/auth/verify-phone-otp"
        : "/api/user/auth/verify-otp";

      const payload = isGoogle
        ? { phone: formattedPhone, otp: phoneOtp }
        : { email: formData.email, phone: formattedPhone, otp: phoneOtp };

      const res = await axiosInstance.post(endpoint, payload);
      if (res.data.success) {
        setIsPhoneVerified(true);
        if (res.data.registrationToken) {
          setPhoneRegistrationToken(res.data.registrationToken);
        }
        toast.success("Phone number verified successfully!");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error.response?.data?.message || error.message || "Invalid OTP"
      );
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName)
        return toast.error("Please enter your first name");
      if (!formData.dob) return toast.error("Please select your date of birth");

      const dob = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 18) {
        return toast.error("You must be at least 18 years old to proceed");
      }
    } else if (step === 2) {
      if (!formData.gender) return toast.error("Please select your gender");
    } else if (step === 3) {
      if (formData.sportTypes.length === 0)
        return toast.error("Please select at least one sport");
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const skipNextLocationSearch = useRef(false);

  // Location Autocomplete Effect
  useEffect(() => {
    if (skipNextLocationSearch.current) {
      skipNextLocationSearch.current = false;
      return;
    }

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
    skipNextLocationSearch.current = true;
    const cityName = suggestion.city || suggestion.display_name.split(",")[0].trim();
    const stateName = suggestion.state || "";
    const formatted = formatLocation(suggestion);
    setFormData({
      ...formData,
      location: formatted,
      city: cityName,
      state: stateName,
    });
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (formData.sportTypes.length === 0)
      return toast.error("Please select at least one sport");

    // Only require email/phone/password validation if they are rendered for the specific flow
    if (!isGoogle && initialData?.authMethod === "phone") {
      if (formData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          return toast.error(
            "Please enter a valid email address (e.g., name@example.com)"
          );
        }
      }
    }
    if (!formData.password) return toast.error("Please create a password");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (needsPhoneVerification && !isPhoneVerified)
      return toast.error("Please verify your phone number via OTP");

    if (!formData.state || formData.state.trim() === "") {
      return toast.error(
        "Please select a precise location that includes a State from the dropdown list."
      );
    }

    setLoading(true);
    try {
      const payloadName =
        formData.firstName + (formData.lastName ? " " + formData.lastName : "");
      const formattedPhone = formData.phone
        ? formData.phone.startsWith("+")
          ? formData.phone
          : formData.countryCode + formData.phone
        : undefined;
      const finalFormData = { ...formData, phone: formattedPhone };

      if (isGoogle) {
        const res = await axiosInstance.put("/api/user/auth/updateProfile", {
          ...finalFormData,
          name: payloadName,
          isOnboarded: true,
        });
        if (res.data.success) {
          dispatch(updateUser(res.data.user));

          if (formData.profilePic && formData.profilePic instanceof File) {
            const formDataImage = new FormData();
            formDataImage.append("profilePicture", formData.profilePic);
            try {
              const picRes = await axiosInstance.post(
                "/api/user/auth/profile-picture",
                formDataImage,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              if (picRes.data.success) {
                dispatch(updateUser({ profilePic: picRes.data.profilePic }));
              }
            } catch (err) {
              console.error("Failed to upload profile picture", err);
            }
          }

          toast.success("Profile completed! Welcome to the arena.");
          localStorage.removeItem("kridaz_onboarding");
          onComplete();
          onClose();
        }
      } else {
        const inviteToken = localStorage.getItem("pendingInvite");
        const umpireInvite = localStorage.getItem("umpireInvite");

        // Register newly created user via email/phone flow
        const payload = {
          ...finalFormData,
          name: payloadName,
          username:
            formData.email.split("@")[0] + Math.floor(Math.random() * 1000), // temp username
          role: "user",
          inviteToken,
          umpireInvite,
        };

        // Pass either otp or phoneOtp depending on method
        if (initialData.authMethod === "phone") {
          payload.registrationToken = initialData.registrationToken;
        } else if (initialData.authMethod === "email") {
          payload.registrationToken = initialData.registrationToken;
          payload.phoneRegistrationToken = phoneRegistrationToken;
        } else {
          payload.otp = formData.otp;
        }

        if (emailRegistrationToken) {
          payload.emailRegistrationToken = emailRegistrationToken;
        }

        const res = await axiosInstance.post(
          "/api/user/auth/register",
          payload
        );
        const result = res.data;
        dispatch(
          login({ token: result.token, role: result.role, user: result.user })
        );

        if (formData.profilePic && formData.profilePic instanceof File) {
          const formDataImage = new FormData();
          formDataImage.append("profilePicture", formData.profilePic);
          try {
            const picRes = await axiosInstance.post(
              "/api/user/auth/profile-picture",
              formDataImage
            );
            if (picRes.data.success) {
              dispatch(updateUser({ profilePic: picRes.data.profilePic }));
            }
          } catch (err) {
            console.error("Failed to upload profile picture", err);
          }
        }

        toast.success("Registration complete! Welcome to the arena.");
        localStorage.removeItem("kridaz_onboarding");
        onComplete();
        onClose();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete onboarding"
      );
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[900px] h-[650px] max-h-[90vh] bg-black flex relative animate-in slide-in-from-bottom-8 duration-500 ease-out rounded-[20px] border border-white/[0.08] shadow-[0px_4px_16px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Left Side: Image Holder */}
        <div className="hidden md:block w-1/2 relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img
            src={
              step === 2
                ? "/gender_bg.webp"
                : step === 3
                  ? "/interests_bg.webp"
                  : step === 4
                    ? "/almost_done_bg.webp"
                    : "/onboarding_bg.webp"
            }
            alt="Auth Background"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full md:w-1/2 flex flex-col relative bg-black">
          {/* Close Button */}
          <Button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 text-white/50 hover:text-white !bg-transparent transition-all border-none"
            aria-label="Close"
          >
            <X size={20} />
          </Button>

          {/* Progress Bar (Hidden for step 1 to match design) */}
          {step > 1 && (
            <div className="flex h-1.5 bg-background absolute top-0 left-0 right-0 overflow-hidden z-20">
              <div
                className="bg-primary transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          )}

          <div className="p-5 md:p-6 pt-6 md:pt-8 flex-1 flex flex-col min-h-0 relative z-10">
            {/* Header */}
            {step === 1 ? (
              <div className="text-center mb-2 md:mb-3 shrink-0">
                <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-[1.1] font-['Inter'] uppercase">
                  Tell me some
                  <br />
                  <span className="text-primary">details</span> please?
                </h2>
              </div>
            ) : step === 2 ? (
              <div className="text-center mb-4 md:mb-6 shrink-0">
                <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-[1.1] font-['Inter'] uppercase">
                  What is
                  <br />
                  your <span className="text-primary">gender</span>?
                </h2>
                <p className="text-white/60 text-xs md:text-sm mt-2 md:mt-3 leading-relaxed">
                  This help us find you more
                  <br />
                  relevant content
                </p>
              </div>
            ) : (
              <div className="text-center mb-4 md:mb-6 shrink-0">
                <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-[1.1] font-['Inter'] uppercase">
                  {step === 3 && (
                    <>
                      What are you
                      <br />
                      <span className="text-primary">interested</span> in?
                    </>
                  )}
                  {step === 4 && (
                    <>
                      Almost <span className="text-primary">done</span>!
                    </>
                  )}
                </h2>
                <p className="text-white/60 text-xs md:text-sm mt-2 md:mt-3 leading-relaxed">
                  {step === 3 && (
                    <>
                      Select sports to find
                      <br />
                      relevant content
                    </>
                  )}
                  {step === 4 && (
                    <>
                      Finalize your account details
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 flex flex-col justify-start min-h-0 overflow-y-auto overflow-x-hidden -mx-2 px-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {step === 1 && (
                <div className="space-y-4 md:space-y-5 animate-in slide-in-from-bottom-8 duration-300">
                  {/* Image Upload Placeholder */}
                  <div className="flex justify-center mb-2 md:mb-3 mt-0">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-[64px] h-[64px] md:w-[80px] md:h-[80px] rounded-full bg-card flex items-center justify-center relative cursor-pointer border border-white/[0.08] hover:border-primary transition-colors group shadow-[0px_4px_16px_rgba(0,0,0,0.4)] overflow-hidden"
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={22}
                          className="text-white/40 group-hover:text-white/60 transition-colors"
                        />
                      )}
                    </div>
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setPreviewImage(URL.createObjectURL(file));
                          setFormData({ ...formData, profilePic: file });
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <label className="block">
                      <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2">
                        <User size={14} className="text-primary" /> FIRST NAME
                      </span>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        <Input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              firstName: e.target.value,
                            })
                          }
                          className="w-full bg-card border border-primary/50 rounded-[16px] py-2.5 md:py-3 pl-11 pr-4 text-white focus:border-primary outline-none transition-all text-xs md:text-sm !ring-0 !ring-offset-0"
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2">
                        <User size={14} className="text-primary" /> LAST NAME
                      </span>
                      <Input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full bg-card border border-primary/50 rounded-[16px] py-2.5 md:py-3 px-4 text-white focus:border-primary outline-none transition-all text-xs md:text-sm !ring-0 !ring-offset-0"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2">
                      <Calendar size={14} className="text-primary" /> DATE OF BIRTH
                    </span>
                    <div className="flex gap-2">
                      <CustomSelect
                        value={dobDay}
                        onChange={setDobDay}
                        options={days}
                        placeholder="DD"
                        icon={<Calendar size={16} />}
                      />
                      <CustomSelect
                        value={dobMonth}
                        onChange={setDobMonth}
                        options={months}
                        placeholder="MM"
                      />
                      <CustomSelect
                        value={dobYear}
                        onChange={setDobYear}
                        options={years}
                        placeholder="YYYY"
                      />
                    </div>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="flex justify-center gap-3 md:gap-5 animate-in slide-in-from-bottom-8 duration-300 mt-2 md:mt-6">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: "Male" })}
                    className={`w-[130px] h-[170px] md:w-[158px] md:h-[228px] shrink-0 rounded-[16px] border transition-all duration-300 relative overflow-hidden flex flex-col pt-3 md:pt-5 ${
                      formData.gender === "Male"
                        ? "border-white bg-card"
                        : "border-white/[0.08] bg-card"
                    }`}
                  >
                    <span className="text-white font-medium text-[13px] md:text-[15px] relative z-10 mb-2">
                      Male
                    </span>
                    <div className="flex-1 w-full relative">
                      <img
                        src={
                          formData.gender === "Male"
                            ? "/gender/male_selected.png"
                            : "/gender/male_default.png"
                        }
                        alt="Male"
                        className="absolute inset-0 w-full h-full object-cover object-bottom"
                      />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, gender: "Female" })
                    }
                    className={`w-[130px] h-[170px] md:w-[158px] md:h-[228px] shrink-0 rounded-[16px] border transition-all duration-300 relative overflow-hidden flex flex-col pt-3 md:pt-5 ${
                      formData.gender === "Female"
                        ? "border-white bg-card"
                        : "border-white/[0.08] bg-card"
                    }`}
                  >
                    <span className="text-white font-medium text-[15px] relative z-10 mb-2">
                      Female
                    </span>
                    <div className="flex-1 w-full relative">
                      <img
                        src={
                          formData.gender === "Female"
                            ? "/gender/female_selected.png"
                            : "/gender/female_default.png"
                        }
                        alt="Female"
                        className="absolute inset-0 w-full h-full object-cover object-bottom"
                      />
                    </div>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="animate-in slide-in-from-bottom-8 duration-300">
                  <div className="flex flex-col">
                    <span className="text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-3 block shrink-0">
                      Pick Your Sports
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                      {sports.map((sport) => {
                        const isSelected = formData.sportTypes.includes(
                          sport.name
                        );
                        const isPrimary =
                          isSelected && formData.sportTypes[0] === sport.name;
                        return (
                          <button
                            type="button"
                            key={sport.name}
                            onClick={() => toggleSport(sport.name)}
                            className={`group relative w-full aspect-square md:aspect-[4/5] rounded-[12px] md:rounded-[16px] transition-all duration-300 overflow-hidden ${isSelected ? "scale-[1.02] z-10" : "border border-white/[0.08] opacity-60 hover:opacity-100 hover:border-white/[0.2]"}`}
                          >
                            {isSelected && (
                              <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                                {/* Solid border without animation */}
                                <rect
                                  x="1"
                                  y="1"
                                  width="calc(100% - 2px)"
                                  height="calc(100% - 2px)"
                                  rx="15"
                                  fill="none"
                                  stroke="var(--primary)"
                                  strokeWidth={isPrimary ? "3" : "2"}
                                  opacity={isPrimary ? "1" : "0.6"}
                                />
                              </svg>
                            )}

                            <div className="absolute inset-0 w-full h-full rounded-[16px] overflow-hidden flex flex-col justify-end">
                              <img
                                src={`/sports/${sport.name.toLowerCase().replace(" ", "-")}.png`}
                                alt={sport.name}
                                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isSelected ? "scale-105" : "group-hover:scale-110"}`}
                              />

                              <div
                                className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${isSelected ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                              />

                              <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 z-30">
                                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                                  <div
                                    className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border transition-all ${isSelected ? "bg-primary border-primary text-black" : "border-white/30 text-white"}`}
                                  >
                                    {isSelected ? (
                                      <Check
                                        size={10}
                                        className="md:w-3 md:h-3"
                                        strokeWidth={3}
                                      />
                                    ) : (
                                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/30" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-[11px] md:text-[13px] font-bold tracking-wide transition-colors ${isSelected ? "text-primary" : "text-white"}`}
                                  >
                                    {sport.name}
                                  </span>
                                </div>

                                {isPrimary && (
                                  <div className="bg-primary/20 text-primary text-[8px] md:text-[9px] font-bold uppercase tracking-wider py-0.5 px-1.5 md:px-2 rounded-full w-fit mt-0.5 md:mt-1 border border-primary/30">
                                    Primary
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 duration-300">
                  <div className="space-y-3 md:space-y-5">


                    <div className="block" ref={locationRef}>
                      <span className="text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2 block">
                        Your City/Area
                      </span>
                      <div className="relative">
                        <MapPin
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10"
                          size={18}
                        />
                        <Input
                          type="text"
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              location: e.target.value,
                            })
                          }
                          onFocus={() =>
                            setShowSuggestions(locationSuggestions.length > 0)
                          }
                          placeholder="Select your location"
                          className="w-full bg-card border border-white/[0.08] rounded-[16px] py-2.5 md:py-4 pl-12 pr-4 text-white focus:border-primary outline-none transition-all placeholder-white/40 text-sm md:text-base !ring-0 !ring-offset-0"
                        />
                        {isSearchingLocation && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          </div>
                        )}
                        {showSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/[0.08] rounded-[16px] overflow-hidden z-[110] shadow-[0px_4px_16px_rgba(0,0,0,0.4)] max-h-[160px] overflow-y-auto custom-scrollbar">
                            {locationSuggestions.map((suggestion, idx) => (
                              <Button
                                type="button"
                                key={idx}
                                onClick={() => handleSelectLocation(suggestion)}
                                className="w-full px-4 py-3 text-left hover:bg-white/5 text-white/80 hover:text-white border-b border-white/[0.08] last:border-0 transition-colors flex flex-col gap-0.5"
                              >
                                <span className="text-sm font-bold">
                                  {suggestion.city ||
                                    suggestion.display_name.split(",")[0]}
                                </span>
                                <span className="text-[10px] text-white/40 truncate">
                                  {suggestion.display_name}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isGoogle && initialData?.authMethod === "phone" && (
                      <label className="block">
                        <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">
                          Email Address (Optional)
                        </span>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type="email"
                              value={formData.email}
                              disabled={isEmailVerified}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  email: e.target.value,
                                });
                                if (emailLinkSent) {
                                  setEmailLinkSent(false);
                                  setIsEmailVerified(false);
                                }
                              }}
                              className="w-full bg-card border border-white/[0.08] rounded-[16px] py-4 px-4 text-white focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed !ring-0 !ring-offset-0"
                            />
                          </div>
                          {isEmailVerified ? (
                            <div className="px-4 bg-green-500/10 border border-green-500/30 rounded-[16px] font-bold text-xs uppercase tracking-wider text-green-400 flex items-center justify-center gap-1.5 whitespace-nowrap animate-bounce">
                              <Check size={14} strokeWidth={3} />
                              Verified
                            </div>
                          ) : null}
                        </div>
                      </label>
                    )}

                    {(!isGoogle && initialData?.authMethod === "email") ||
                    (isGoogle && !initialData?.user?.phone) ? (
                      <label className="block">
                        <span className="text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2 block">
                          Phone Number
                        </span>
                        <div className="relative flex gap-2">
                          <select
                            value={formData.countryCode}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                countryCode: e.target.value,
                              })
                            }
                            disabled={isPhoneVerified}
                            className="bg-card border border-white/[0.08] rounded-[16px] py-2.5 md:py-4 px-3 text-white focus:border-primary outline-none transition-all w-[90px] md:w-[100px] text-xs md:text-sm appearance-none cursor-pointer !ring-0 !ring-offset-0"
                          >
                            <option value="+91">IN (+91)</option>
                            {countryCodeOptions.map((c, i) => (
                              <option key={i} value={c.dial_code}>
                                {c.code} ({c.dial_code})
                              </option>
                            ))}
                          </select>
                          <div className="relative flex-1">
                            <Input
                              type="tel"
                              maxLength={10}
                              value={formData.phone}
                              disabled={isPhoneVerified}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  phone: e.target.value.replace(/\D/g, ""),
                                });
                                if (phoneOtpSent) {
                                  setPhoneOtpSent(false);
                                  setIsPhoneVerified(false);
                                }
                              }}
                              className="w-full bg-card border border-white/[0.08] rounded-[16px] py-2.5 md:py-4 px-4 text-white focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base !ring-0 !ring-offset-0"
                            />
                          </div>

                          {needsPhoneVerification && isPhoneVerified && (
                            <div className="px-4 bg-green-500/10 border border-green-500/30 rounded-[8px] font-bold text-xs uppercase tracking-wider text-green-400 flex items-center gap-1.5 whitespace-nowrap animate-bounce h-[44px]">
                              <Check size={14} strokeWidth={3} />
                              Verified
                            </div>
                          )}
                        </div>

                        {needsPhoneVerification && !isPhoneVerified && (
                          <div className="mt-2 md:mt-3">
                            <button
                              type="button"
                              onClick={() => handleSendPhoneOtp(false)}
                              disabled={
                                sendingPhoneOtp ||
                                !formData.phone ||
                                formData.phone.length < 10 ||
                                timeLeft > 0
                              }
                              className="w-full py-3 bg-primary rounded-[16px] font-bold text-xs uppercase tracking-wider text-black shadow-[0px_8px_24px_rgba(179,220,38,0.15)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {sendingPhoneOtp ? (
                                <Loader2 className="animate-spin w-4 h-4 mx-auto" />
                              ) : timeLeft > 0 ? (
                                `Resend in ${timeLeft}s`
                              ) : phoneOtpSent ? (
                                "Resend"
                              ) : (
                                "Get OTP"
                              )}
                            </button>
                          </div>
                        )}

                        {needsPhoneVerification &&
                          phoneOtpSent &&
                          !isPhoneVerified && (
                            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                                Phone Verification OTP
                              </span>
                              <div className="flex flex-col gap-2 md:flex-row md:gap-3">
                                <Input
                                  type="text"
                                  maxLength={6}
                                  value={phoneOtp}
                                  onChange={(e) =>
                                    setPhoneOtp(
                                      e.target.value.replace(/\D/g, "")
                                    )
                                  }
                                  placeholder="Enter 6-digit OTP"
                                  className="w-full md:flex-1 bg-card border border-white/[0.08] rounded-[16px] py-3 md:py-4 px-4 text-white placeholder:text-white/40 focus:border-primary outline-none transition-all text-center tracking-widest font-black text-sm md:text-base !ring-0 !ring-offset-0"
                                />
                                <Button
                                  type="button"
                                  onClick={handleVerifyPhoneOtp}
                                  disabled={
                                    verifyingPhoneOtp || phoneOtp.length < 6
                                  }
                                  className="w-full md:w-auto md:px-8 py-3 md:py-4 bg-primary rounded-[16px] font-black text-xs md:text-sm uppercase tracking-wider text-background shadow-[0px_8px_24px_rgba(179,220,38,0.15)] transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center"
                                >
                                  {verifyingPhoneOtp ? (
                                    <Loader2 className="animate-spin w-4 h-4" />
                                  ) : (
                                    "Verify"
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                      </label>
                    ) : null}

                    <label className="block pt-1 md:pt-2">
                      <span className="text-[10px] md:text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1.5 md:mb-2 block">
                        Create Password
                      </span>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Must be at least 6 characters"
                        className="w-full bg-card border border-white/[0.08] rounded-[16px] py-2.5 md:py-4 px-4 text-white focus:border-primary outline-none transition-all text-sm md:text-base !ring-0 !ring-offset-0"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex pt-3 md:pt-4 mt-auto shrink-0 z-10 bg-transparent">
              <div className="flex w-full h-[48px] md:h-[58px] gap-3 md:gap-4">
                {step > 1 && (
                  <Button
                    onClick={handleBack}
                    className="w-[90px] md:w-[110px] shrink-0 bg-card text-white h-full rounded-[16px] font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-1.5 md:gap-2 transition-all border border-white/[0.08]"
                  >
                    <ChevronLeft size={16} />
                    BACK
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-primary shadow-[0px_8px_24px_rgba(179,220,38,0.15)] text-background h-full rounded-[16px] font-bold text-[14px] md:text-[18px] flex items-center justify-center transition-all disabled:opacity-40"
                  >
                    CONTINUE
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || formData.sportTypes.length === 0}
                    className="flex-1 bg-primary shadow-[0px_8px_24px_rgba(179,220,38,0.15)] text-background h-full rounded-[16px] font-bold text-[13px] md:text-[18px] flex items-center justify-center gap-1.5 md:gap-2 transition-all disabled:opacity-40 whitespace-nowrap"
                  >
                    {loading ? (
                      <Loader2
                        className="animate-spin text-background"
                        size={20}
                      />
                    ) : (
                      <>
                        <Trophy
                          size={16}
                          className="text-background hidden sm:block"
                        />
                        ENTER THE ARENA
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
