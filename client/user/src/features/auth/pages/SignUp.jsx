import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "../components/GoogleAuthButton";
import OnboardingModal from "@components/modals/OnboardingModal";
import {
  ChevronLeft,
  X,
  ShieldCheck,
  Zap,
  User,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";
import toast from "@utils/toast";
import InlineError from "../../../shared/components/ui/InlineError";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { searchLocations, fetchCountryCodes } from "@utils/locationService";
import { login } from "@redux/slices/authSlice";
import { Capacitor } from "@capacitor/core";

import { useAuthModal } from "../../../context/AuthModalContext";
import { Button, Input, Select } from "@kridaz/ui";


const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const SearchableCountrySelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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

  const filtered = options.filter(
    (c) =>
      c.dial_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <div
        className="bg-card border border-white/5 hover:border-[#D2F40E]/50 rounded-[8px] h-11 px-2 text-white text-sm flex items-center justify-center cursor-pointer w-[80px] transition-all"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch(""); // Reset search on open
        }}
      >
        {value}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[220px] bg-[#111111] border border-white/10 rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-white/10 shrink-0">
            <input
              autoFocus
              type="text"
              placeholder="Search code or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[4px] px-3 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none focus:border-[#D2F40E]/50 transition-all"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
            <div
              className={`px-3 py-2 text-[13px] cursor-pointer flex justify-between items-center transition-colors ${value === "+91" ? "bg-[#D2F40E]/10 text-[#D2F40E]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
              onClick={() => {
                onChange("+91");
                setIsOpen(false);
              }}
            >
              <span className="font-medium">+91</span>
              <span className="text-[11px] opacity-50 truncate ml-2">India</span>
            </div>
            {filtered.map((c, i) => (
              <div
                key={i}
                className={`px-3 py-2 text-[13px] cursor-pointer flex justify-between items-center transition-colors ${value === c.dial_code ? "bg-[#D2F40E]/10 text-[#D2F40E]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                onClick={() => {
                  onChange(c.dial_code);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium shrink-0">{c.dial_code}</span>
                <span className="text-[11px] opacity-50 truncate ml-2 text-right">
                  {c.name || c.code}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-[12px] text-white/40">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SignUp = ({ isModal = false }) => {
  const { closeAuthModal, toggleView } = useAuthModal();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [authMode, setAuthMode] = useState("unified"); // 'unified', 'email', 'phone'
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

  const [timeLeft, setTimeLeft] = useState(60);

  const [countryCode, setCountryCode] = useState("+91");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationToken, setRegistrationToken] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingData, setOnboardingData] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.auth.role);

  useEffect(() => {
    if (isLoggedIn && role === "user" && !showOnboarding) {
      if (isModal) {
        closeAuthModal();
      } else {
        const redirectUrl = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");
        const isRelative = redirectUrl.startsWith("/") && !redirectUrl.startsWith("//") && !redirectUrl.startsWith("/\\");
        navigate(isRelative ? redirectUrl : "/");
      }
    }
  }, [isLoggedIn, role, navigate, showOnboarding, isModal, closeAuthModal]);

  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    setFormError("");
  }, [step, identifier, otp, password, confirmPassword, countryCode]);

  useEffect(() => {
    setMounted(true);
    const inviteToken =
      searchParams.get("inviteToken") || searchParams.get("invite");
    const inviter = searchParams.get("inviter");
    const teamId = searchParams.get("teamId");

    const umpireToken = searchParams.get("umpireInvite");

    if (inviteToken) {
      localStorage.setItem("pendingTeamInvite", inviteToken);
      if (teamId) localStorage.setItem("pendingTeamId", teamId);

      const emailParam = searchParams.get("email");
      if (emailParam) setIdentifier(decodeURIComponent(emailParam));

      if (inviter) {
        toast.success(`You are invited by ${inviter} to join their team!`, {
          duration: 6000,
          icon: "👋",
        });
      }
    }

    if (umpireToken) {
      localStorage.setItem("umpireInvite", umpireToken);
      const emailParam = searchParams.get("email");
      if (emailParam) setIdentifier(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSendOtp = async (e, forceSms = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!identifier) {
      setFormError("Phone number required");
      return;
    }

    const isPhone = /^\d{10}$/.test(identifier);

    if (!isPhone) {
      setFormError("Please enter a valid 10-digit phone number");
      return;
    }

    setFormError(""); // Clear any previous errors
    setAuthMode("phone");

    // Remove the '+' sign before sending to the backend
    const cleanCountryCode = countryCode.replace("+", "");
    const formattedPhone = cleanCountryCode + identifier;

    setPhone(formattedPhone);
    
    try {
      const fullPhone = `+${formattedPhone}`;

      if (forceSms) {
        const payload = {
          phone: formattedPhone,
          deliveryMethod: "sms",
          type: "signup",
        };
        const res = await axiosInstance.post(
          "/api/user/auth/send-otp",
          payload
        );
        if (res.data.exists) {
          toast.success("Account already exists. Redirecting to login...");
          if (isModal) {
            toggleView();
          } else {
            navigate("/login");
          }
          return;
        }
        toast.success(res.data.message || "OTP sent via SMS");
      } else {
        const payload = { phone: formattedPhone, type: "signup" };
        const res = await axiosInstance.post(
          "/api/user/auth/send-otp",
          payload
        );
        if (res.data.exists) {
          toast.success("Account already exists. Redirecting to login...");
          if (isModal) {
            toggleView();
          } else {
            navigate("/login");
          }
          return;
        }
        toast.success(res.data.message || "OTP sent via WhatsApp");
        if (Capacitor.isNativePlatform()) {
          toast(
            (t) => (
              <div className="flex flex-col gap-1 p-1">
                <div className="font-bold text-sm text-black flex items-center gap-1">
                  🔔 Kridaz Notification
                </div>
                <div className="text-xs text-gray-600">
                  OTP sent to your device. Please enter it below.
                </div>
              </div>
            ),
            { position: "top-center", duration: 8000 }
          );
        }
      }
      
      // Transition to OTP screen on success
      setStep(2);
      setTimeLeft(60);
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to send OTP";
      if (errorMessage.toLowerCase().includes("already registered") || errorMessage.toLowerCase().includes("already exists")) {
        setFormError("Account already exists with this phone number. Redirecting to login...");
        toast.error("Account already exists. Redirecting to login...");
        setTimeout(() => {
          if (isModal) {
            toggleView();
          } else {
            navigate("/login");
          }
        }, 3000);
      } else {
        setFormError(errorMessage);
        toast.error(errorMessage);
        // Fallback to step 1 if it fails entirely so they can try again
        setStep(1);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setFormError("Valid 6-digit OTP required");
      return toast.error("Valid 6-digit OTP required");
    }

    setLoading(true);
    try {
      const payload = authMode === "email" ? { email, otp } : { phone, otp };
      const res = await axiosInstance.post(
        "/api/user/auth/verify-otp",
        payload
      );

      if (res.data.success) {
        toast.success("OTP verified successfully!");
        setRegistrationToken(res.data.registrationToken);
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Invalid OTP";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return toast.error("Password must be at least 8 characters");
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/user/auth/create-account", {
        registrationToken,
        password,
      });

      if (res.data.success) {
        toast.success("Account created successfully!");
        dispatch(
          login({
            token: res.data.token,
            role: res.data.user.role,
            user: res.data.user,
          })
        );
        if (isModal) {
          closeAuthModal();
        }
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Failed to create account";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setGoogleLoading(true);
    try {
      const inviteToken = localStorage.getItem("pendingInvite");
      const umpireInvite = localStorage.getItem("umpireInvite");
      const payload = {
        role: "user",
        inviteToken,
        umpireInvite,
        mode: "signup",
      };
      if (googleResponse.credential) {
        payload.credential = googleResponse.credential;
      } else if (googleResponse.access_token) {
        payload.accessToken = googleResponse.access_token;
      }

      const response = await axiosInstance.post(
        `/api/user/auth/google-auth`,
        payload
      );
      const result = response.data;

      dispatch(
        login({ token: result.token, role: result.role, user: result.user })
      );
      toast.success("Successfully logged in with Google!");

      const user = result.user;
      const isMissingDetails =
        !user.phone ||
        !user.gender ||
        !user.location ||
        !user.sportTypes?.length;

      if (result.isNewUser && isMissingDetails) {
        setOnboardingData({
          authMethod: "google",
          user,
        });
        setShowOnboarding(true);
      } else {
        if (isModal) {
          closeAuthModal();
        }
        const teamInvite = localStorage.getItem("pendingTeamInvite");
        if (teamInvite) {
          try {
            await axiosInstance.post(`/api/team/user/join/${teamInvite}`);
            toast.success("Successfully joined the team!");
            localStorage.removeItem("pendingTeamInvite");
            const teamId = localStorage.getItem("pendingTeamId");
            if (teamId) {
              localStorage.removeItem("pendingTeamId");
              return navigate(`/team/${teamId}`);
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Failed to join team");
          }
        }

        const normalizedRole = role?.toLowerCase() || "user";
        const professionalRoles = [
          "coach",
          "umpire",
          "streamer",
          "scorer",
          "cheerleader",
          "commentator",
        ];
        if (
          normalizedRole === "venu_owners" ||
          normalizedRole === "owner" ||
          normalizedRole === "venue_owner"
        ) {
          navigate("/venue-owner");
        } else if (professionalRoles.includes(normalizedRole)) {
          navigate(`/professional/${normalizedRole}`);
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const content = (
    <div
      className={`relative z-10 w-full max-w-md mx-auto transition-all duration-1000 transform flex flex-col flex-1 h-full md:h-auto md:justify-center ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}
    >
      <div className="flex flex-col w-full max-w-md mx-auto flex-1 md:flex-none h-full">
        <div className="w-full relative flex flex-col flex-1 md:flex-none h-full">
          {/* Header removed as requested */}

          {/* Back to options removed as requested */}

          <div className="w-full flex-1 flex flex-col">
            <form
              onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}
              className="flex-1 flex flex-col"
            >
              {step === 1 && (
                <div className="flex-1 flex flex-col animate-fade-in">
                  {/* Google Button */}
                  <div className="w-full">
                    <GoogleAuthButton
                      mode="signup"
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error("Google sign-in failed")}
                      isLoading={googleLoading}
                    />
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 w-full my-6">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-white/30 text-[11px] tracking-widest uppercase">
                      OR
                    </span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>

                  {/* Phone Number Section */}
                  <div className="space-y-2 mb-6">
                    <label className="text-[11px] font-semibold tracking-widest text-[#C8F53B] uppercase block">
                      Phone Number
                    </label>
                    <div className="relative flex gap-3">
                      <SearchableCountrySelect
                        value={countryCode}
                        onChange={(val) => setCountryCode(val)}
                        options={countryCodeOptions}
                      />
                      <div className="relative flex-1">
                        <Input
                          type="tel"
                          required
                          placeholder="Enter your phone number"
                          value={identifier}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setIdentifier(val.slice(0, 10));
                          }}
                          className="w-full bg-card border border-white/5 focus:border-[#D2F40E]/50 focus:shadow-[0_0_10px_rgba(210,244,14,0.1)] rounded-[8px] h-11 px-4 text-white text-sm placeholder:text-[12px] placeholder:text-white/30 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <InlineError message={formError} className="mb-4" />

                  {/* Continue Button & Login Link */}
                  <div className="mt-auto pb-4 flex flex-col gap-5">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[linear-gradient(90deg,#D2F40E_0%,#B8ED30_50%,#A9E956_100%)] text-black h-11 rounded-[8px] font-bold text-[15px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(210,244,14,0.25)] hover:shadow-[0_0_25px_rgba(210,244,14,0.4)]"
                    >
                      {loading ? (
                        "Processing..."
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-[14px] text-white/60">
                        Already have an account?{" "}
                        {/* eslint-disable-next-line react/forbid-elements */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isModal) {
                              toggleView();
                            } else {
                              navigate("/login");
                            }
                          }}
                          className="text-[#C8F53B] font-semibold hover:text-[#D2F40E] drop-shadow-[0_0_4px_rgba(200,245,59,0.3)] transition-all bg-transparent border-0 outline-none p-0 cursor-pointer inline"
                        >
                          Login
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex-1 flex flex-col animate-slide-left">
                  <div className="flex-1">
                    <div className="flex flex-col items-start justify-center text-left mb-6">
                      <div className="space-y-1">
                        <p className="text-[12px] text-white/60">
                          Enter OTP sent to{" "}
                          {authMode === "email" ? email : phone}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between gap-1 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otp[index] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val && !/^\d*$/.test(val)) return;
                              const newOtp = otp.split("");
                              newOtp[index] = val.slice(-1);
                              const joined = newOtp.join("");
                              setOtp(joined);
                              if (val && index < 5) {
                                document
                                  .getElementById(`otp-${index + 1}`)
                                  ?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Backspace" &&
                                !otp[index] &&
                                index > 0
                              ) {
                                document
                                  .getElementById(`otp-${index - 1}`)
                                  ?.focus();
                              }
                            }}
                            className="flex-1 min-w-0 max-w-[48px] h-14 bg-white/10 backdrop-blur-[12.5px] shadow-[-13px_43px_18px_rgba(0,0,0,0.01),-7px_24px_15px_rgba(0,0,0,0.04),-3px_11px_11px_rgba(0,0,0,0.07),-1px_3px_6px_rgba(0,0,0,0.08)] border border-transparent focus:border-white/20 rounded-[10px] text-white text-center text-xl font-bold outline-none transition-all focus:bg-white/20"
                          />
                        ))}
                      </div>

                      <div className="flex flex-col items-center mt-8 space-y-4">
                        {timeLeft > 0 ? (
                          <p className="text-white/80 text-sm">
                            You can resend the code in{" "}
                            <span className="text-[#A2F86D]">{timeLeft}</span>{" "}
                            seconds
                          </p>
                        ) : (
                          <p className="text-white/80 text-sm">
                            Didn't receive the code?
                          </p>
                        )}
                        <Button
                          type="button"
                          disabled={timeLeft > 0 || loading}
                          onClick={(e) => handleSendOtp(e, false)}
                          className={`text-[15px] font-semibold transition-colors ${timeLeft > 0 ? "text-white/40 cursor-not-allowed" : "text-[#C8F53B] hover:text-[#D2F40E] drop-shadow-[0_0_4px_rgba(200,245,59,0.3)]"}`}
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  </div>

                  <InlineError message={formError} className="mb-4 text-center justify-center" />

                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="w-full bg-[linear-gradient(90deg,#D2F40E_0%,#B8ED30_50%,#A9E956_100%)] text-black h-11 rounded-[8px] font-bold text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(210,244,14,0.25)] hover:shadow-[0_0_25px_rgba(210,244,14,0.4)] mt-auto mb-4"
                  >
                    {loading && otp.length < 6
                      ? "Sending OTP..."
                      : loading
                        ? "Verifying..."
                        : "Verify & Sign Up"}
                  </Button>
                </div>
              )}

              {step === 3 && (
                <div className="flex-1 flex flex-col animate-slide-left">
                  <div className="flex-1">
                    <div className="flex flex-col items-start justify-center text-left mb-6">
                      <div className="space-y-1">
                        <p className="text-[12px] text-white/60">
                          Create a password for your account
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold tracking-widest text-[#C8F53B] uppercase block">
                            Password
                          </label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="At least 8 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-card border border-white/5 focus:border-[#D2F40E]/50 focus:shadow-[0_0_10px_rgba(210,244,14,0.1)] rounded-[8px] h-11 px-4 pr-10 text-white text-sm placeholder:text-[12px] placeholder:text-white/30 outline-none transition-all"
                            />
                            <div
                              role="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold tracking-widest text-[#C8F53B] uppercase block">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full bg-card border border-white/5 focus:border-[#D2F40E]/50 focus:shadow-[0_0_10px_rgba(210,244,14,0.1)] rounded-[8px] h-11 px-4 pr-10 text-white text-sm placeholder:text-[12px] placeholder:text-white/30 outline-none transition-all"
                            />
                            <div
                              role="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>

                  <InlineError message={formError} className="mb-4" />

                  <Button
                    type="button"
                    onClick={handleSetPassword}
                    disabled={loading}
                    className="w-full bg-[linear-gradient(90deg,#D2F40E_0%,#B8ED30_50%,#A9E956_100%)] text-black h-11 rounded-[8px] font-bold text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(210,244,14,0.25)] hover:shadow-[0_0_25px_rgba(210,244,14,0.4)] mt-auto mb-4"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const handleOnboardingComplete = async () => {
    if (isModal) {
      closeAuthModal();
    }

    const inviteToken = localStorage.getItem("pendingInvite");
    const teamInvite = localStorage.getItem("pendingTeamInvite");

    if (teamInvite) {
      try {
        await axiosInstance.post(`/api/team/user/join/${teamInvite}`);
        toast.success("Successfully joined the team!");
        localStorage.removeItem("pendingTeamInvite");
        const teamId = localStorage.getItem("pendingTeamId");
        if (teamId) {
          localStorage.removeItem("pendingTeamId");
          return navigate(`/team/${teamId}`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to join team");
      }
    }

    if (inviteToken) navigate(`/join-games?invite=${inviteToken}`);
    else if (!isModal) navigate("/");
  };

  if (isModal) {
    return (
      <>
        {content}
        {showOnboarding && (
          <OnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            initialData={onboardingData}
          />
        )}
        <div id="recaptcha-container"></div>
      </>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 ${!mounted ? "opacity-0" : "opacity-100"}`}
    >
      <div
        className={`relative w-full h-full flex flex-col transition-all duration-500 ${!mounted ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      >
        {/* Close Button */}
        {/* Close Button */}
        <Button
          onClick={() => navigate("/")}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </Button>

        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
          <img
            src="/signup-background.webp"
            alt="Signup"
            className="w-full h-full object-contain object-top mt-10"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* Spacer for Top Image Area */}
        <div className="relative w-full h-[45%] shrink-0 pointer-events-none z-10" />

        {/* Form Section */}
        <div className="flex-1 flex flex-col px-6 pt-10 pb-4 bg-transparent overflow-hidden z-10">
          {content}
        </div>
      </div>

      {showOnboarding && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          initialData={onboardingData}
          onComplete={handleOnboardingComplete}
        />
      )}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default SignUp;
