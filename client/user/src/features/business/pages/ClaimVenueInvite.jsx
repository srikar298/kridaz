import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import usePartnerSignUpForm from "@features/auth/hooks/usePartnerSignUpForm";
import toast from "react-hot-toast";

const ClaimVenueInvite = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const navigate = useNavigate();
  
  const { register, handleSubmit, errors, onSubmit, loading } = usePartnerSignUpForm("venu_owners");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!inviteToken) {
      toast.error("Invalid or missing invite token.");
      navigate("/");
    }
  }, [inviteToken, navigate]);

  const onFormSubmit = async (data) => {
    if (!inviteToken) return toast.error("Missing invite token.");
    await onSubmit(data, inviteToken);
  };

  return (
    <div className={`min-h-screen bg-[#050505] flex items-center justify-center p-4 transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-md bg-[#121212] border border-white/[0.08] p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Claim Venue</h2>
          <p className="text-sm text-white/60 mt-2">Create your venue owner account to manage your turf.</p>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1 block">Full Name</label>
            <input
              type="text"
              {...register("name")}
              placeholder="Enter your full name"
              className="w-full bg-[#1B1B1B] border border-white/[0.08] rounded-xl py-3 px-4 text-white focus:border-[#BFF367] outline-none transition-all"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1 block">Email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="Enter your email"
              className="w-full bg-[#1B1B1B] border border-white/[0.08] rounded-xl py-3 px-4 text-white focus:border-[#BFF367] outline-none transition-all"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1 block">Phone Number</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="Enter 10 digit phone number"
              className="w-full bg-[#1B1B1B] border border-white/[0.08] rounded-xl py-3 px-4 text-white focus:border-[#BFF367] outline-none transition-all"
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1 block">Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="Create a password"
              className="w-full bg-[#1B1B1B] border border-white/[0.08] rounded-xl py-3 px-4 text-white focus:border-[#BFF367] outline-none transition-all"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-1 block">Confirm Password</label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="Confirm your password"
              className="w-full bg-[#1B1B1B] border border-white/[0.08] rounded-xl py-3 px-4 text-white focus:border-[#BFF367] outline-none transition-all"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#BFF367] text-black font-bold h-12 rounded-xl uppercase tracking-wide hover:bg-[#a5db52] transition-colors disabled:opacity-50"
          >
            {loading ? "Claiming..." : "Claim & Register"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-white/40 hover:text-white transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClaimVenueInvite;
