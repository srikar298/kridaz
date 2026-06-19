import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { Capacitor } from "@capacitor/core";
import { useSelector } from "react-redux";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isLoggedIn) {
      const redirectUrl = localStorage.getItem("redirectAfterLogin") || "/";
      localStorage.removeItem("redirectAfterLogin");
      navigate(redirectUrl);
    }
  }, [isLoggedIn, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post(
        "/api/user/auth/forgot-password-otp",
        { email }
      );
      if (res.data.success) {
        if (res.data.requiresOtp) {
          toast.success("OTP sent to your phone");
          setStep(2);
        } else {
          toast.success(res.data.message || "OTP sent!");
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
          setStep(2);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    setStep(3);
    toast.success("Code verified! Set your new password.");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/user/auth/reset-password", {
        email,
        otp: otp,
        newPassword,
      });
      if (res.data.success) {
        toast.success("Password updated successfully!");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] relative flex items-center justify-center font-sans p-4">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_black_100%)] opacity-80" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 group text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Login
        </Link>

        <div className="bg-[#0A0A0A] border border-white/5 rounded-[8px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#BFF367]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="mb-10 text-center">
            <div className="w-16 h-16 bg-[#BFF367]/10 rounded-[8px] flex items-center justify-center mx-auto mb-6 border border-[#BFF367]/20">
              {step === 1 && <Mail size={32} className="text-[#BFF367]" />}
              {step === 2 && (
                <ShieldCheck size={32} className="text-[#BFF367]" />
              )}
              {step === 3 && <KeyRound size={32} className="text-[#BFF367]" />}
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
              {step === 1 && "Reset Password"}
              {step === 2 && "Verify Code"}
              {step === 3 && "New Password"}
            </h1>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">
              {step === 1 &&
                "Enter your email or phone number to receive a recovery code."}
              {step === 2 && `Enter the 6-digit code sent to ${email}`}
              {step === 3 && "Set a strong password for your account."}
            </p>
          </div>

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Email or Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#BFF367] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email or phone"
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#BFF367]/50 transition-all text-sm font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#BFF367] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[8px] flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Send Code <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  6-Digit Code
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#BFF367] transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#BFF367]/50 transition-all text-center text-xl font-black tracking-[0.5em]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-14 bg-[#BFF367] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[8px] flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all"
              >
                Verify Code <CheckCircle2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
              >
                Change Details
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#BFF367] transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#BFF367]/50 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30 group-focus-within:text-[#BFF367] transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full bg-white/5 border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#BFF367]/50 transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#BFF367] text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-[8px] flex items-center justify-center gap-2 hover:bg-[#a3e635] transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
