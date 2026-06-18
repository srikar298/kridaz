import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice";
import useLoginForm from "../hooks/useLoginForm";
import GoogleAuthButton from "../components/GoogleAuthButton";
import OnboardingModal from "@components/modals/OnboardingModal";
import { Capacitor } from "@capacitor/core";
import { ArrowRight, X, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthModal } from "../../../context/AuthModalContext";
import { fetchCountryCodes } from "@utils/locationService";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const Login = ({ isModal = false }) => {
  const navigate = useNavigate();
  const { closeAuthModal, toggleView } = useAuthModal();
  const [countryCode, setCountryCode] = useState("+91");
  const [countryCodeOptions, setCountryCodeOptions] = useState([]);

  useEffect(() => {
    const loadCountryCodes = async () => {
      const codes = await fetchCountryCodes();
      if (codes && codes.length > 0) {
        setCountryCodeOptions(codes.filter(c => c.dial_code !== '+91'));
      }
    };
    loadCountryCodes();
  }, []);

  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    showOnboarding,
    setShowOnboarding,
    onboardingUser,
    accountNotFound,
    googleLoading,
    timeLeft,
    handleSendOtp,
    isPhoneAuth,
    watch
  } = useLoginForm(countryCode);

  const emailValue = watch("email");
  const isPhoneInput = /^\d+$/.test(emailValue || '');

  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();

  const { isLoggedIn, role } = useSelector((state) => state.auth);

  useEffect(() => {
    setMounted(true);

    if (isLoggedIn && !showOnboarding) {
      if (isModal) {
        closeAuthModal();
      }

      const normalizedRole = role?.toLowerCase();
      const professionalRoles = ["coach", "umpire", "streamer", "scorer", "cheerleader", "commentator"];
      
      if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
        dispatch(logout());
        toast.error("Administrators must log in via the Platform Admin Console.");
      } else if (normalizedRole === "venu_owners" || normalizedRole === "owner" || normalizedRole === "venue_owner") {
        navigate("/venue-owner");
      } else if (professionalRoles.includes(normalizedRole)) {
        navigate(`/professional/${normalizedRole}`);
      } else {
        navigate("/");
      }
    }
  }, [isLoggedIn, role, navigate, showOnboarding, dispatch, isModal, closeAuthModal]);

  const [showPassword, setShowPassword] = useState(false);

  const content = (
    <div className={`relative z-10 w-full flex flex-col flex-1 h-full transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* Logo */}
      <div className="absolute top-40 -left-6 z-50">
        <img src="/logo1.png" alt="Logo" className="h-[250px] object-contain drop-shadow-lg" />
      </div>

      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black pointer-events-none">
        <img src="/login-background.png" alt="Kridaz" className="w-full h-full object-cover object-top scale-[1.15] translate-y-6 -translate-x-6" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Spacer for Top Image Area */}
      <div className="relative w-full h-[52%] shrink-0 pointer-events-none z-10" />

      {/* Form Section */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-4 bg-transparent overflow-hidden z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 h-full">

          {/* OTP Step */}
          <div className={showOtpInput ? "flex flex-col gap-4 animate-fade-in flex-1" : "hidden"}>
            <div className="mb-2">
              <h3 className="text-[22px] font-bold text-white uppercase tracking-tight">Verification Code</h3>
              <p className="text-sm text-white/50 mt-1">We sent a 6-digit code to your address.</p>
            </div>
            <div className="relative">
              <input
                {...register("otp")}
                type="text"
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#1a1a1a] border border-white/10 focus:border-[#BFF367]/60 rounded-xl h-14 px-5 text-white text-center tracking-[0.5em] font-mono text-lg outline-none transition-all"
              />
            </div>
            {errors.otp && <p className="text-xs text-red-500 text-center">{errors.otp.message}</p>}
            <div className="flex flex-col items-center mt-4 gap-3">
              {timeLeft > 0 ? (
                <p className="text-white/60 text-sm">Resend in <span className="text-[#BFF367]">{timeLeft}s</span></p>
              ) : (
                <p className="text-white/60 text-sm">Didn't receive the code?</p>
              )}
              <button type="button" disabled={timeLeft > 0 || loading} onClick={() => handleSendOtp(false)}
                className={`text-lg font-bold transition-colors ${timeLeft > 0 ? 'text-white/30 cursor-not-allowed' : 'text-[#BFF367]'}`}>
                Resend Code
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="mt-auto w-full bg-gradient-to-r from-[#BFF367] to-[#60E5D0] text-black h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? 'Verifying...' : <><span>Verify & Login</span><ArrowRight size={18} /></>}
            </button>
          </div>

          {/* Email / Password Step */}
          <div className={!showOtpInput ? "flex flex-col gap-3 flex-1" : "hidden"}>

            {/* Email Input */}
            <div className="relative flex items-center">
              {isPhoneInput && (
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                  className="absolute left-12 z-10 bg-transparent text-white text-sm outline-none cursor-pointer appearance-none w-[60px] animate-fade-in">
                  <option value="+91" className="text-black">+91</option>
                  {countryCodeOptions.map((c, i) => (
                    <option key={i} value={c.dial_code} className="text-black">{c.dial_code}</option>
                  ))}
                </select>
              )}
              <div className="absolute left-4 text-[#C8F53B] drop-shadow-[0_0_8px_rgba(200,245,59,0.3)]"><User size={20} /></div>
              <input
                {...register("email")}
                type="text"
                placeholder="Email or Phone Number"
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d+$/.test(val)) e.target.value = val.slice(0, 10);
                  register("email").onChange(e);
                }}
                className={`w-full bg-[#121212] border border-white/5 focus:border-[#D2F40E]/50 focus:shadow-[0_0_10px_rgba(210,244,14,0.1)] rounded-[8px] h-11 text-white text-sm placeholder:text-white/30 outline-none transition-all ${isPhoneInput ? 'pl-28' : 'pl-12'} pr-4`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 -mt-2 ml-1">{errors.email.message}</p>}

            {/* Password Input */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#C8F53B] drop-shadow-[0_0_8px_rgba(200,245,59,0.3)]"><Lock size={20} /></div>
              <input
                {...register("password")}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full bg-[#121212] border border-white/5 focus:border-[#D2F40E]/50 focus:shadow-[0_0_10px_rgba(210,244,14,0.1)] rounded-[8px] h-11 pl-12 pr-12 text-white text-sm placeholder:text-white/30 outline-none transition-all tracking-wide"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-4 text-[#C8F53B] hover:text-[#D2F40E] drop-shadow-[0_0_8px_rgba(200,245,59,0.3)] transition-colors">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 -mt-2 ml-1">{errors.password.message}</p>}

            {/* Continue Button */}
            <button type="submit" disabled={loading}
              className="w-full bg-[linear-gradient(90deg,#D2F40E_0%,#B8ED30_50%,#A9E956_100%)] text-black h-11 rounded-[8px] font-bold text-[15px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_0_20px_rgba(210,244,14,0.25)] hover:shadow-[0_0_25px_rgba(210,244,14,0.4)]">
              {loading ? 'Sending OTP...' : <><span>Continue</span><ArrowRight size={18} /></>}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-white/30 text-[11px] tracking-widest uppercase">OR</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* Google Button */}
            <GoogleAuthButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} isLoading={googleLoading} mode="signin" />

            {/* Sign Up Link */}
            <p className="text-center text-[14px] text-white/60 mt-5">
              Don't have an account?{' '}
              <button type="button" onClick={() => isModal ? toggleView() : navigate('/signup')}
                className="text-[#C8F53B] font-semibold hover:text-[#D2F40E] drop-shadow-[0_0_4px_rgba(200,245,59,0.3)] transition-all">
                Sign up
              </button>
            </p>

            {accountNotFound && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
                <p className="text-sm text-red-400 text-center mb-3">Account not found. Create a new account!</p>
                <Link to="/signup" className="w-full bg-white/10 hover:bg-white/20 text-white h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  Sign Up Now <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <>
        {content}
        <OnboardingModal 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          onComplete={() => navigate("/")}
        />
      </>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 ${!mounted ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`relative w-full h-full flex flex-col transition-all duration-500 ${!mounted ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        {/* Close Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {content}
      </div>
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => navigate("/")}
      />
    </div>
  );
};

export default Login;

