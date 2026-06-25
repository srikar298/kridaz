import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  User,
  Mail,
  Shield,
  Settings,
  LogOut,
  Camera,
  MapPin,
  Calendar,
  Save,
  Bell,
  Lock,
  Briefcase,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { Button, Input } from "@kridaz/ui";


const SUBHEADING_STYLE = {
  fontFamily: "'Inter 28pt Light', sans-serif",
  fontWeight: 300,
};

const DashboardProfile = () => {
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const roleLabel = role?.replace("BMSP_", "") || "OWNER";

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-10 animate-fade-in custom-scrollbar">
      {/* Top Header Section */}
      <div className="max-w-[1600px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-10">
        <div>
          <h1 className="text-3xl font-semibold text-white uppercase tracking-tight mb-2 italic">
            My Profile
          </h1>
          <p
            className="text-[12px] text-muted-foreground uppercase tracking-widest"
            style={SUBHEADING_STYLE}
          >
            Identity and professional credentials
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-[6px]">
            <Shield size={14} className="text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {roleLabel} Verified
            </span>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[6px] font-normal text-[13px] uppercase tracking-wider transition-all border ${isEditing ? "bg-white/10 text-white border-white/20" : "bg-primary text-black border-transparent hover:bg-[#BFFF00] shadow-[0_4px_12px_rgba(204,255,0,0.2)]"}`}
          >
            {isEditing ? "Discard Changes" : "Edit Profile"}
          </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          <div className="bg-background border border-border rounded-[8px] p-8 lg:p-10 relative overflow-hidden shadow-[var(--shadow-2)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px]" />

            <div className="relative flex flex-col items-center">
              <div className="relative mb-10 group">
                <div className="w-48 h-48 rounded-[12px] bg-border p-1 border border-[#404040] relative overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                  <div className="w-full h-full bg-background rounded-[8px] flex items-center justify-center overflow-hidden border border-border">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <User size={64} strokeWidth={1} />
                        <span className="text-[10px] uppercase font-black tracking-widest">
                          No Image
                        </span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera size={32} className="text-primary" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary text-black rounded-[8px] flex items-center justify-center shadow-lg border-4 border-black z-10">
                  <Zap size={20} strokeWidth={2.5} />
                </div>
              </div>

              <div className="text-center w-full space-y-1 mb-8">
                <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
                  {user?.name || user?.fullName || "User Name"}
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
                  {user?.email}
                </p>
              </div>

              <div className="w-full grid grid-cols-1 gap-4 pt-8 border-t border-border">
                <ProfileDetailItem
                  icon={Mail}
                  label="Email Address"
                  value={user?.email}
                />
                <ProfileDetailItem
                  icon={MapPin}
                  label="Office Location"
                  value={user?.location || "Not Specified"}
                />
                <ProfileDetailItem
                  icon={Calendar}
                  label="Member Since"
                  value={
                    user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-GB")
                      : "Recently"
                  }
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-background border border-red-500/20 rounded-[8px] p-8 shadow-[var(--shadow-2)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-[6px] border border-red-500/20">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white uppercase tracking-wider">
                  Account Security
                </h3>
                <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-widest">
                  Session Management
                </p>
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground mb-8 leading-relaxed">
              Closing your session will revoke all active security tokens on
              this device.
            </p>
            <Button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-transparent border border-red-500/30 text-red-500 rounded-[6px] text-[13px] font-normal uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 group font-[Arial]"
            >
              <LogOut
                size={16}
                strokeWidth={2.5}
                className="group-hover:-translate-x-1 transition-transform"
              />
              Terminate Session
            </Button>
          </div>
        </div>

        {/* Right Column: Settings and Stats */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-8">
          {/* Main Information Card */}
          <div className="bg-background border border-border rounded-[8px] p-8 lg:p-10 shadow-[var(--shadow-2)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/50 via-transparent to-transparent" />

            <div className="flex items-center gap-4 mb-12">
              <div className="p-3 bg-border rounded-[8px] text-primary border border-[#404040]">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white uppercase tracking-tight">
                  Account Details
                </h3>
                <p className="text-[11px] font-normal text-muted-foreground uppercase tracking-widest">
                  Personal & Professional Information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <InfoField
                label="Full Name"
                value={user?.name || ""}
                icon={User}
                disabled={!isEditing}
              />
              <InfoField
                label="Phone Number"
                value={user?.phoneNumber || ""}
                prefix="+91"
                disabled={!isEditing}
              />
              <InfoField
                label="Role / Designation"
                value={roleLabel}
                icon={Briefcase}
                disabled={true}
              />
              <InfoField
                label="Secondary Email"
                value={user?.secondaryEmail || "Not Provided"}
                icon={Mail}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div className="mt-12 pt-8 border-t border-border flex justify-end">
                <Button className="flex items-center gap-3 px-12 py-4 bg-primary text-black rounded-[6px] font-normal text-[14px] uppercase tracking-[0.1em] hover:bg-[#BFFF00] hover:shadow-[0_4px_20px_rgba(204,255,0,0.3)] transition-all active:scale-95 font-[Arial]">
                  <Save size={18} strokeWidth={2.5} />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {/* Mini Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <DashboardMiniCard
              title="Profile Integrity"
              value="98%"
              icon={ShieldCheck}
              desc="Higher score boosts visibility"
            />
            <DashboardMiniCard
              title="Response Protocol"
              value="Fast"
              icon={Zap}
              desc="Based on recent interactions"
            />
          </div>

          {/* Quick Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <QuickSettingAction
              icon={Lock}
              title="Privacy Guard"
              desc="Manage password and active MFA"
            />
            <QuickSettingAction
              icon={Bell}
              title="Notification Hub"
              desc="System alerts and email logs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileDetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between group/item">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-border rounded-[4px] text-muted-foreground group-hover/item:text-primary transition-colors">
        <Icon size={14} />
      </div>
      <span className="text-[11px] font-normal text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
    <span className="text-[12px] font-semibold text-white tracking-tight">
      {value}
    </span>
  </div>
);

const InfoField = ({ label, value, icon: Icon, prefix, disabled }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-[2px] ml-1">
      {label}
    </label>
    <div className="relative group/input">
      {Icon && (
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors"
          size={18}
        />
      )}
      {prefix && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-bold group-focus-within/input:text-primary transition-colors">
          {prefix}
        </div>
      )}
      <Input
        type="text"
        defaultValue={value}
        disabled={disabled}
        className={`w-full bg-[#151617] border border-border rounded-[6px] py-4 pr-4 text-[14px] text-white focus:outline-none focus:border-primary/50 disabled:opacity-40 transition-all font-inter ${Icon ? "pl-12" : prefix ? "pl-14" : "pl-4"}`}
      />
    </div>
  </div>
);

const DashboardMiniCard = ({ title, value, icon: Icon, desc }) => (
  <div className="bg-background border border-border p-6 rounded-[8px] flex items-center justify-between group hover:border-primary/20 transition-all shadow-[var(--shadow-2)]">
    <div className="space-y-1">
      <h4 className="text-[12px] font-normal text-muted-foreground uppercase tracking-wider">
        {title}
      </h4>
      <p className="text-2xl font-semibold text-white tracking-tight">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
        {desc}
      </p>
    </div>
    <div className="w-12 h-12 bg-primary/10 rounded-[6px] flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
      <Icon size={24} />
    </div>
  </div>
);

const QuickSettingAction = ({ icon: Icon, title, desc }) => (
  <div className="bg-background border border-border p-6 rounded-[8px] flex items-center gap-5 hover:border-primary/20 transition-all cursor-pointer group shadow-[var(--shadow-2)]">
    <div className="p-4 bg-border rounded-[8px] text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all border border-[#404040] shadow-inner">
      <Icon size={22} />
    </div>
    <div>
      <h4 className="text-[14px] font-semibold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h4>
      <p className="text-[11px] font-normal text-muted-foreground uppercase tracking-widest">
        {desc}
      </p>
    </div>
  </div>
);

export default DashboardProfile;
