import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { login, logout } from "@redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email or phone number")
    .refine(
      (value) => {
        const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          value
        );
        const isPhone = /^[0-9]{10}$/.test(value);
        return isEmail || isPhone;
      },
      { message: "Enter a valid email or 10-digit phone number" }
    ),
  password: z
    .string()
    .min(1, "Enter your password")
    .min(6, "Password must be at least 6 characters long"),
});

const useLoginForm = (countryCode = "+91") => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPhoneAuth, setIsPhoneAuth] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const [formError, setFormError] = useState("");

  const emailVal = watch("email");
  const passVal = watch("password");
  const otpVal = watch("otp");

  useEffect(() => {
    setFormError("");
  }, [emailVal, passVal, otpVal, countryCode]);

  useEffect(() => {
    let timer;
    if (showOtpInput && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpInput, timeLeft]);

  const handleRoleRedirect = (role) => {
    const normalizedRole = role?.toLowerCase();
    const professionalRoles = [
      "coach",
      "umpire",
      "streamer",
      "scorer",
      "cheerleader",
      "commentator",
    ];

    if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
      dispatch(logout());
      toast.error("Administrators must log in via the Platform Admin Console.");
      navigate("/login");
    } else if (
      normalizedRole === "owner" ||
      normalizedRole === "venue_owner" ||
      normalizedRole === "venu_owners"
    ) {
      navigate("/venue-owner");
    } else if (professionalRoles.includes(normalizedRole)) {
      navigate(`/professional/${normalizedRole}`);
    } else {
      navigate("/");
    }
  };

  const handleLoginStep1 = async (forceSms = false) => {
    const isValid = await trigger(["email", "password"]);
    if (!isValid) return;

    setLoading(true);
    setAccountNotFound(false); // Reset on new attempt
    try {
      let { email, password } = getValues();

      const isPhoneInput = /^[0-9]{10}$/.test(email);
      if (isPhoneInput) {
        email = countryCode + email;
      }

      const response = await axiosInstance.post("/api/user/auth/login-step1", {
        email,
        password,
      });
      const result = response.data;

      if (result.token) {
        dispatch(
          login({ token: result.token, role: result.role, user: result.user })
        );
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${result.token}`;
        toast.success("Logged in successfully!");
        handleRoleRedirect(result.role);
        return;
      }

      if (result.requiresOtp) {
        const isPhoneCheck = /^[0-9]+$/.test(email) || email.startsWith("+");
        setIsPhoneAuth(isPhoneCheck);
        if (isPhoneCheck) {
          if (forceSms) {
            const payload = {
              phone: email.startsWith("+") ? email.replace("+", "") : email,
              deliveryMethod: "sms",
            };
            const otpRes = await axiosInstance.post(
              "/api/user/auth/send-otp",
              payload
            );
            toast.success(otpRes.data.message || "OTP sent via SMS");
            setShowOtpInput(true);
            setTimeLeft(60);
          } else {
            const payload = {
              phone: email.startsWith("+") ? email.replace("+", "") : email,
            };
            const otpRes = await axiosInstance.post(
              "/api/user/auth/send-otp",
              payload
            );
            toast.success(otpRes.data.message || "OTP sent via WhatsApp");
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
            setShowOtpInput(true);
            setTimeLeft(60);
          }
        } else {
          // Email OTP
          if (Capacitor.isNativePlatform()) {
            toast(
              (t) => (
                <div className="flex flex-col gap-1 p-1">
                  <div className="font-bold text-sm text-black flex items-center gap-1">
                    🔔 Kridaz Notification
                  </div>
                  <div className="text-xs text-gray-600">
                    OTP sent to your email. Please enter it below.
                  </div>
                </div>
              ),
              { position: "top-center", duration: 8000 }
            );
          }
          toast.success("OTP sent to your email");
          setShowOtpInput(true);
          setTimeLeft(60);
        }
        return;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";

      if (errorMessage.toLowerCase().includes("account not found")) {
        setAccountNotFound(true);
        setFormError("Account not found. Please sign up first.");
        toast.error("Account not found. Redirecting to sign up...");
        setTimeout(() => {
          navigate("/signup");
        }, 3000);
      } else {
        setFormError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (data) => {
    setLoading(true);
    try {
      let { email } = getValues();
      const isPhoneInput = /^[0-9]{10}$/.test(email);
      if (isPhoneInput) {
        email = countryCode + email;
      }

      const payload = {
        email,
        otp: data.otp,
        password: data.password,
      };

      const response = await axiosInstance.post(
        "/api/user/auth/login",
        payload
      );
      const result = response.data;

      dispatch(
        login({ token: result.token, role: result.role, user: result.user })
      );
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${result.token}`;
      toast.success(result.message);

      handleRoleRedirect(result.role);
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!showOtpInput) {
      return handleLoginStep1();
    }
    return handleVerifyOtp(data);
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setGoogleLoading(true);
    try {
      const payload = {
        role: "user",
        mode: "signin",
      };

      if (googleResponse.credential) {
        payload.credential = googleResponse.credential;
      } else if (googleResponse.access_token) {
        payload.accessToken = googleResponse.access_token;
      }

      const response = await axiosInstance.post(
        "/api/user/auth/google-auth",
        payload
      );
      const result = response.data;

      dispatch(
        login({ token: result.token, role: result.role, user: result.user })
      );
      axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${result.token}`;
      toast.success("Logged in with Google!");

      handleRoleRedirect(result.role);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Google login failed";
      if (
        errorMessage.toLowerCase().includes("account not found") ||
        errorMessage.toLowerCase().includes("sign up first")
      ) {
        setFormError("Account not found. Please sign up first.");
        toast.error("Account not found. Redirecting to sign up...");
        setTimeout(() => {
          navigate("/signup");
        }, 3000);
      } else {
        setFormError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setFormError("Google authentication failed");
    toast.error("Google authentication failed");
  };

  return {
    register,
    handleSubmit,
    errors,
    onSubmit,
    loading,
    googleLoading,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    accountNotFound,
    setAccountNotFound,
    timeLeft,
    handleSendOtp: handleLoginStep1,
    isPhoneAuth,
    watch,
    formError,
  };
};

export default useLoginForm;
