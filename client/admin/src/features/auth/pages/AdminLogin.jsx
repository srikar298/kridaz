import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { login } from "../../../redux/slices/authSlice";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { ArrowRight, ShieldCheck, Lock, User, Terminal } from "lucide-react";import { Button, Input } from "@kridaz/ui";


export default function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoggedIn, role } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isLoggedIn && role?.toLowerCase() === "admin") {
      navigate("/");
    }
  }, [isLoggedIn, role, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/login-step1", {
        email: data.email,
        password: data.password,
      });

      if (response.data.success) {
        const userRole = response.data.role?.toLowerCase();

        if (userRole === "admin") {
          dispatch(
            login({
              token: response.data.token,
              role: response.data.role,
              user: response.data.user,
            })
          );
          toast.success("Welcome back to Staff Console!");
          navigate("/");
        } else {
          toast.error(
            "Access Denied: Only platform administrators are permitted here."
          );
        }
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "Failed to authenticate. Please check credentials.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center justify-center font-sans overflow-hidden">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(85,222,232,0.05)_0%,_black_80%)]" />
      </div>

      {/* CORE CONTAINER */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="flex flex-col items-center w-full">
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-primary mb-4 shadow-[0_0_20px_rgba(85,222,232,0.1)]">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight uppercase">
              Staff Login
            </h2>
            <p className="text-xs text-muted mt-2 tracking-wide font-medium uppercase">
              Kridaz Platform Administration Portal
            </p>
          </div>

          {/* Form Card */}
          <div className="w-full bg-white/[0.01] border border-white/5 p-8 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email / Username Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email or Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                    <User size={16} />
                  </div>
                  <Input
                    {...register("email", {
                      required: "Username/Email is required",
                    })}
                    type="text"
                    placeholder="admin@kridaz.com"
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/40 rounded-lg h-12 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Credentials Key (Password)
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors">
                    <Lock size={16} />
                  </div>
                  <Input
                    {...register("password", {
                      required: "Password is required",
                    })}
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full bg-white/[0.02] border border-white/5 focus:border-primary/40 rounded-lg h-12 pl-12 pr-4 text-white text-sm outline-none transition-all placeholder:text-white/10"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Action */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-[#3cc5ce] text-black h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-8"
              >
                {loading ? "Authenticating Key..." : "Establish Secure Session"}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>
          </div>

          {/* Secure indicator */}
          <div className="mt-8 flex items-center gap-2 text-white/20 text-xs">
            <Terminal size={14} />
            <span>Strict AES-256 Auth Session Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
